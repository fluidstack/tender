import { Router, type IRouter } from "express";
import { and, asc, desc, eq, gte, ilike, lte, or, sql, type SQL } from "drizzle-orm";
import {
  db,
  organisations,
  sourceAwards,
  sourceDocuments,
  sourceTenders,
} from "@workspace/db";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();
router.use(requireAuth);

router.get("/catalogue/tenders", async (req, res): Promise<void> => {
  const search = typeof req.query.search === "string" ? req.query.search : "";
  const status = typeof req.query.status === "string" ? req.query.status : "";
  const jurisdiction =
    typeof req.query.jurisdiction === "string" ? req.query.jurisdiction : "";
  const category = typeof req.query.category === "string" ? req.query.category : "";
  const closingBefore =
    typeof req.query.closingBefore === "string" ? new Date(req.query.closingBefore) : null;
  const closingAfter =
    typeof req.query.closingAfter === "string" ? new Date(req.query.closingAfter) : null;
  const minValue = req.query.minValue ? Number(req.query.minValue) : null;
  const maxValue = req.query.maxValue ? Number(req.query.maxValue) : null;
  const limit = Math.min(Math.max(Number(req.query.limit ?? 25) || 25, 1), 100);
  const offset = Math.max(Number(req.query.offset ?? 0) || 0, 0);

  const conditions: SQL[] = [];
  if (search) {
    conditions.push(
      or(
        ilike(sourceTenders.title, `%${search}%`),
        ilike(sourceTenders.description, `%${search}%`),
      )!,
    );
  }
  if (status) conditions.push(eq(sourceTenders.status, status));
  if (jurisdiction)
    conditions.push(eq(sourceTenders.jurisdiction, jurisdiction));
  if (category) conditions.push(ilike(sourceTenders.category, `%${category}%`));
  if (closingBefore && Number.isFinite(closingBefore.getTime()))
    conditions.push(lte(sourceTenders.closingAt, closingBefore));
  if (closingAfter && Number.isFinite(closingAfter.getTime()))
    conditions.push(gte(sourceTenders.closingAt, closingAfter));
  if (minValue != null && Number.isFinite(minValue))
    conditions.push(gte(sourceTenders.estimatedValueMax, minValue));
  if (maxValue != null && Number.isFinite(maxValue))
    conditions.push(lte(sourceTenders.estimatedValueMin, maxValue));

  const whereClause = conditions.length ? and(...conditions) : undefined;

  const [{ count = 0 } = { count: 0 }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(sourceTenders)
    .where(whereClause as never);

  const rows = await db
    .select({
      id: sourceTenders.id,
      sourceSystem: sourceTenders.sourceSystem,
      sourceTenderId: sourceTenders.sourceTenderId,
      ocid: sourceTenders.ocid,
      title: sourceTenders.title,
      description: sourceTenders.description,
      status: sourceTenders.status,
      jurisdiction: sourceTenders.jurisdiction,
      category: sourceTenders.category,
      location: sourceTenders.location,
      estimatedValueMin: sourceTenders.estimatedValueMin,
      estimatedValueMax: sourceTenders.estimatedValueMax,
      currency: sourceTenders.currency,
      publishedAt: sourceTenders.publishedAt,
      closingAt: sourceTenders.closingAt,
      awardedAt: sourceTenders.awardedAt,
      buyerName: organisations.name,
    })
    .from(sourceTenders)
    .leftJoin(organisations, eq(sourceTenders.buyerOrgId, organisations.id))
    .where(whereClause as never)
    .orderBy(desc(sourceTenders.publishedAt))
    .limit(limit)
    .offset(offset);

  res.json({ total: count, limit, offset, items: rows });
});

router.get("/catalogue/tenders/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [row] = await db
    .select({
      tender: sourceTenders,
      buyer: organisations,
    })
    .from(sourceTenders)
    .leftJoin(organisations, eq(sourceTenders.buyerOrgId, organisations.id))
    .where(eq(sourceTenders.id, id));
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const docs = await db
    .select()
    .from(sourceDocuments)
    .where(eq(sourceDocuments.sourceTenderId, id))
    .orderBy(asc(sourceDocuments.id));
  const awards = await db
    .select({
      id: sourceAwards.id,
      awardId: sourceAwards.awardId,
      value: sourceAwards.value,
      currency: sourceAwards.currency,
      awardedAt: sourceAwards.awardedAt,
      supplierName: organisations.name,
    })
    .from(sourceAwards)
    .leftJoin(organisations, eq(sourceAwards.supplierOrgId, organisations.id))
    .where(eq(sourceAwards.sourceTenderId, id));
  res.json({
    ...row.tender,
    buyerName: row.buyer?.name ?? null,
    documents: docs,
    awards,
  });
});

export default router;
