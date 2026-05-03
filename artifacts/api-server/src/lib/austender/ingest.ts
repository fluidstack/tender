import { eq, and, sql, desc } from "drizzle-orm";
import {
  db,
  organisations,
  sourceTenders,
  sourceAwards,
  sourceDocuments,
  ingestionRuns,
} from "@workspace/db";
import { logger } from "../logger";
import { ObjectStorageService, objectStorageClient } from "../objectStorage";
import { AusTenderClient } from "./client";
import { SOURCE_SYSTEM, normaliseRelease, releasesFromPage } from "./normalize";
import type { NormalisedTender, OcdsRelease } from "./types";

export type IngestMode = "backfill" | "incremental";

interface IngestRangeOptions {
  mode: IngestMode;
  windowStart: Date;
  windowEnd: Date;
  client?: AusTenderClient;
  storeRaw?: boolean;
}

interface RunSummary {
  runId: number;
  fetched: number;
  upserted: number;
  failed: number;
  status: "completed" | "failed";
  error: string | null;
}

async function upsertOrganisation(
  party: { name: string; abn: string | null } | null,
): Promise<number | null> {
  if (!party) return null;
  if (party.abn) {
    const [row] = await db
      .insert(organisations)
      .values({ name: party.name, abn: party.abn, role: "buyer" })
      .onConflictDoUpdate({
        target: organisations.abn,
        set: { name: party.name, updatedAt: new Date() },
      })
      .returning({ id: organisations.id });
    return row.id;
  }
  // No ABN: rely on partial unique on (name) where abn is null.
  const [row] = await db
    .insert(organisations)
    .values({ name: party.name, role: "buyer" })
    .onConflictDoNothing({
      target: organisations.name,
      where: sql`${organisations.abn} is null`,
    })
    .returning({ id: organisations.id });
  if (row) return row.id;
  const [existing] = await db
    .select({ id: organisations.id })
    .from(organisations)
    .where(and(eq(organisations.name, party.name), sql`${organisations.abn} is null`));
  return existing?.id ?? null;
}

async function persistRaw(
  release: OcdsRelease,
  publishedAt: Date | null,
): Promise<string | null> {
  try {
    const storage = new ObjectStorageService();
    const dir = storage.getPrivateObjectDir().replace(/\/+$/, "");
    const ocid = release.ocid ?? release.id ?? "unknown";
    const safeOcid = ocid.replace(/[^A-Za-z0-9._-]/g, "_");
    const ts = (publishedAt ?? new Date()).toISOString().replace(/[:.]/g, "-");
    const objectName = `ocds/${safeOcid}/${ts}.json`;
    const fullPath = `${dir}/${objectName}`;
    const [, bucketName, ...rest] = fullPath.split("/");
    const bucket = objectStorageClient.bucket(bucketName);
    const obj = bucket.file(rest.join("/"));
    await obj.save(JSON.stringify(release), {
      contentType: "application/json",
      resumable: false,
    });
    return objectName;
  } catch (err) {
    logger.warn({ err: String(err) }, "Failed to persist raw OCDS payload");
    return null;
  }
}

async function upsertSourceTender(
  norm: NormalisedTender,
  rawObjectPath: string | null,
): Promise<{ id: number }> {
  const buyerId = await upsertOrganisation(norm.buyer);
  const values = {
    sourceSystem: norm.sourceSystem,
    sourceTenderId: norm.sourceTenderId,
    ocid: norm.ocid,
    title: norm.title,
    description: norm.description,
    status: norm.status,
    procurementMethod: norm.procurementMethod,
    jurisdiction: norm.jurisdiction,
    categoryCode: norm.categoryCode,
    category: norm.category,
    location: norm.location,
    estimatedValueMin: norm.estimatedValueMin,
    estimatedValueMax: norm.estimatedValueMax,
    currency: norm.currency,
    publishedAt: norm.publishedAt,
    closingAt: norm.closingAt,
    awardedAt: norm.awardedAt,
    buyerOrgId: buyerId,
    rawObjectPath,
    sourceLastModifiedAt: norm.sourceLastModifiedAt,
  };
  const [row] = await db
    .insert(sourceTenders)
    .values(values)
    .onConflictDoUpdate({
      target: [sourceTenders.sourceSystem, sourceTenders.sourceTenderId],
      set: {
        ocid: values.ocid,
        title: values.title,
        description: values.description,
        status: values.status,
        procurementMethod: values.procurementMethod,
        jurisdiction: values.jurisdiction,
        categoryCode: values.categoryCode,
        category: values.category,
        location: values.location,
        estimatedValueMin: values.estimatedValueMin,
        estimatedValueMax: values.estimatedValueMax,
        currency: values.currency,
        publishedAt: values.publishedAt,
        closingAt: values.closingAt,
        awardedAt: values.awardedAt,
        buyerOrgId: values.buyerOrgId,
        rawObjectPath: sql`coalesce(excluded.raw_object_path, ${sourceTenders.rawObjectPath})`,
        sourceLastModifiedAt: values.sourceLastModifiedAt,
        updatedAt: new Date(),
      },
    })
    .returning({ id: sourceTenders.id });
  await db
    .delete(sourceDocuments)
    .where(eq(sourceDocuments.sourceTenderId, row.id));
  await db.delete(sourceAwards).where(eq(sourceAwards.sourceTenderId, row.id));
  return { id: row.id };
}

async function persistChildren(
  sourceTenderId: number,
  norm: NormalisedTender,
): Promise<void> {
  if (norm.documents.length) {
    await db.insert(sourceDocuments).values(
      norm.documents.map((d) => ({
        sourceTenderId,
        docType: d.docType,
        title: d.title,
        url: d.url,
        mimeType: d.mimeType,
      })),
    );
  }
  if (norm.awards.length) {
    for (const a of norm.awards) {
      const supplierId = await upsertOrganisation(a.supplier);
      await db.insert(sourceAwards).values({
        sourceTenderId,
        awardId: a.awardId,
        supplierOrgId: supplierId,
        value: a.value,
        currency: a.currency,
        awardedAt: a.awardedAt,
      });
    }
  }
}

export async function ingestRange(
  options: IngestRangeOptions,
): Promise<RunSummary> {
  const { mode, windowStart, windowEnd } = options;
  const client = options.client ?? new AusTenderClient();
  const storeRaw = options.storeRaw ?? !!process.env.PRIVATE_OBJECT_DIR;

  const [run] = await db
    .insert(ingestionRuns)
    .values({
      sourceSystem: SOURCE_SYSTEM,
      mode,
      windowStart,
      windowEnd,
      status: "running",
    })
    .returning();

  let fetched = 0;
  let upserted = 0;
  let failed = 0;
  try {
    const pages =
      mode === "incremental"
        ? client.searchByLastModified(windowStart, windowEnd)
        : client.searchByPublished(windowStart, windowEnd);
    for await (const page of pages) {
      const releases = releasesFromPage(page);
      for (const release of releases) {
        fetched += 1;
        try {
          const norm = normaliseRelease(release, mode);
          if (!norm) {
            failed += 1;
            continue;
          }
          const rawPath = storeRaw
            ? await persistRaw(release, norm.publishedAt)
            : null;
          const { id } = await upsertSourceTender(norm, rawPath);
          await persistChildren(id, norm);
          upserted += 1;
        } catch (err) {
          failed += 1;
          logger.warn(
            { err: String(err), sourceTenderId: release.tender?.id ?? release.id },
            "Failed to ingest release",
          );
        }
      }
    }
    await db
      .update(ingestionRuns)
      .set({
        status: "completed",
        finishedAt: new Date(),
        fetched,
        upserted,
        failed,
      })
      .where(eq(ingestionRuns.id, run.id));
    logger.info(
      { runId: run.id, mode, fetched, upserted, failed },
      "ingestion run completed",
    );
    return {
      runId: run.id,
      fetched,
      upserted,
      failed,
      status: "completed",
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db
      .update(ingestionRuns)
      .set({
        status: "failed",
        finishedAt: new Date(),
        fetched,
        upserted,
        failed,
        error: message,
      })
      .where(eq(ingestionRuns.id, run.id));
    logger.error({ err: message, runId: run.id }, "ingestion run failed");
    return {
      runId: run.id,
      fetched,
      upserted,
      failed,
      status: "failed",
      error: message,
    };
  }
}

export async function lastIncrementalCursor(): Promise<Date | null> {
  const [row] = await db
    .select()
    .from(ingestionRuns)
    .where(
      and(
        eq(ingestionRuns.sourceSystem, SOURCE_SYSTEM),
        eq(ingestionRuns.status, "completed"),
      ),
    )
    .orderBy(desc(ingestionRuns.finishedAt))
    .limit(1);
  return row?.windowEnd ?? null;
}

export async function runIncrementalSince(now = new Date()): Promise<RunSummary> {
  const last = await lastIncrementalCursor();
  const start = last ?? new Date(now.getTime() - 24 * 60 * 60 * 1000);
  return ingestRange({
    mode: "incremental",
    windowStart: start,
    windowEnd: now,
  });
}
