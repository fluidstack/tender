import { Router, type IRouter } from "express";
import { eq, and, desc, ilike, or, sql } from "drizzle-orm";
import {
  db,
  tenders,
  tenderDocuments,
  requirements,
  complianceReports,
  riskReports,
  tenderDrafts,
  activityEntries,
} from "@workspace/db";
import {
  CreateTenderBody,
  UpdateTenderBody,
  AttachTenderDocumentBody,
} from "@workspace/api-zod";
import { requireAuth, getUserId } from "../lib/auth";
import { getOrCreateProfile } from "../lib/profile";
import { computeMatchScore } from "../lib/matching";
import { parseDocument } from "../lib/parse";

const router: IRouter = Router();
router.use(requireAuth);

async function ownTender(userId: string, id: number) {
  const [t] = await db
    .select()
    .from(tenders)
    .where(and(eq(tenders.id, id), eq(tenders.userId, userId)));
  return t ?? null;
}

type TenderRow = typeof tenders.$inferSelect;

async function decorate(tender: TenderRow, userId: string) {
  const profile = await getOrCreateProfile(userId);
  const [docRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(tenderDocuments)
    .where(eq(tenderDocuments.tenderId, tender.id));
  const [reqRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(requirements)
    .where(eq(requirements.tenderId, tender.id));
  const { score, rationale } = computeMatchScore(tender, profile);
  return {
    ...tender,
    matchScore: tender.matchScore ?? score,
    matchRationale: tender.matchRationale ?? rationale,
    documentCount: docRow?.count ?? 0,
    requirementCount: reqRow?.count ?? 0,
  };
}

router.get("/tenders", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const search = typeof req.query.search === "string" ? req.query.search : "";
  const status = typeof req.query.status === "string" ? req.query.status : "";
  const conditions = [eq(tenders.userId, userId)];
  if (search) {
    conditions.push(
      or(ilike(tenders.title, `%${search}%`), ilike(tenders.agency, `%${search}%`))!,
    );
  }
  if (status) conditions.push(eq(tenders.status, status));
  const rows = await db
    .select()
    .from(tenders)
    .where(and(...conditions))
    .orderBy(desc(tenders.createdAt));
  const decorated = await Promise.all(rows.map((r) => decorate(r, userId)));
  res.json(decorated);
});

router.get("/tenders/top-matches", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const rows = await db
    .select()
    .from(tenders)
    .where(and(eq(tenders.userId, userId), eq(tenders.status, "open")));
  const decorated = await Promise.all(rows.map((r) => decorate(r, userId)));
  decorated.sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));
  res.json(decorated.slice(0, 5));
});

router.post("/tenders", async (req, res): Promise<void> => {
  const parsed = CreateTenderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const userId = getUserId(req);
  const [row] = await db
    .insert(tenders)
    .values({ ...parsed.data, userId, status: "open" })
    .returning();
  await db.insert(activityEntries).values({
    userId,
    kind: "tender_created",
    label: `Created tender ${row.title}`,
    tenderId: row.id,
    tenderTitle: row.title,
  });
  res.status(201).json(await decorate(row, userId));
});

router.get("/tenders/:id", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const id = Number(req.params.id);
  const t = await ownTender(userId, id);
  if (!t) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const [docs, reqs, [comp], [risk], [draft]] = await Promise.all([
    db
      .select()
      .from(tenderDocuments)
      .where(eq(tenderDocuments.tenderId, id))
      .orderBy(desc(tenderDocuments.createdAt)),
    db
      .select()
      .from(requirements)
      .where(eq(requirements.tenderId, id))
      .orderBy(desc(requirements.createdAt)),
    db.select().from(complianceReports).where(eq(complianceReports.tenderId, id)),
    db.select().from(riskReports).where(eq(riskReports.tenderId, id)),
    db.select().from(tenderDrafts).where(eq(tenderDrafts.tenderId, id)),
  ]);
  const base = await decorate(t, userId);
  res.json({
    ...base,
    documents: docs,
    requirements: reqs,
    compliance: comp ?? null,
    risks: risk ?? null,
    draft: draft ?? null,
  });
});

router.patch("/tenders/:id", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const id = Number(req.params.id);
  const parsed = UpdateTenderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const t = await ownTender(userId, id);
  if (!t) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const [updated] = await db
    .update(tenders)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(tenders.id, id))
    .returning();
  res.json(await decorate(updated, userId));
});

router.delete("/tenders/:id", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const id = Number(req.params.id);
  await db.delete(tenders).where(and(eq(tenders.id, id), eq(tenders.userId, userId)));
  res.sendStatus(204);
});

router.patch("/tenders/:id/save", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const id = Number(req.params.id);
  const t = await ownTender(userId, id);
  if (!t) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const [updated] = await db
    .update(tenders)
    .set({ saved: !t.saved, updatedAt: new Date() })
    .where(eq(tenders.id, id))
    .returning();
  res.json(await decorate(updated, userId));
});

router.get("/tenders/:id/documents", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const id = Number(req.params.id);
  const t = await ownTender(userId, id);
  if (!t) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const docs = await db
    .select()
    .from(tenderDocuments)
    .where(eq(tenderDocuments.tenderId, id))
    .orderBy(desc(tenderDocuments.createdAt));
  res.json(docs);
});

router.post("/tenders/:id/documents", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const id = Number(req.params.id);
  const parsed = AttachTenderDocumentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const t = await ownTender(userId, id);
  if (!t) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const [doc] = await db
    .insert(tenderDocuments)
    .values({ ...parsed.data, tenderId: id, parseStatus: "parsing" })
    .returning();

  // Parse synchronously (small files); update on completion
  try {
    const { text, pageCount } = await parseDocument(
      parsed.data.objectPath,
      parsed.data.contentType,
      parsed.data.name,
    );
    const [updated] = await db
      .update(tenderDocuments)
      .set({ extractedText: text, pageCount, parseStatus: "parsed" })
      .where(eq(tenderDocuments.id, doc.id))
      .returning();
    await db.insert(activityEntries).values({
      userId,
      kind: "document_parsed",
      label: `Parsed ${parsed.data.name}`,
      tenderId: id,
      tenderTitle: t.title,
    });
    res.status(201).json(updated);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Parse failed";
    const [updated] = await db
      .update(tenderDocuments)
      .set({ parseStatus: "failed", parseError: message })
      .where(eq(tenderDocuments.id, doc.id))
      .returning();
    req.log.warn({ err }, "Document parsing failed");
    res.status(201).json(updated);
  }
});

router.delete(
  "/tenders/:id/documents/:documentId",
  async (req, res): Promise<void> => {
    const userId = getUserId(req);
    const id = Number(req.params.id);
    const docId = Number(req.params.documentId);
    const t = await ownTender(userId, id);
    if (!t) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    await db
      .delete(tenderDocuments)
      .where(
        and(eq(tenderDocuments.id, docId), eq(tenderDocuments.tenderId, id)),
      );
    res.sendStatus(204);
  },
);

export default router;
