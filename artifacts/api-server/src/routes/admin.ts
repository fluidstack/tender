import { Router, type IRouter } from "express";
import { sql, desc, eq, and } from "drizzle-orm";
import {
  db,
  tenders,
  activityEntries,
  businessProfiles,
  sourceTenders,
  ingestionRuns,
} from "@workspace/db";
import { clerkClient } from "@clerk/express";
import { requireAdminUser, requireAdminUserOrToken } from "../lib/admin";
import {
  ingestRange,
  runIncrementalSince,
} from "../lib/austender/ingest";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.use("/admin", (req, res, next) => {
  if (req.path === "/ingestion/run" && req.method === "POST") {
    requireAdminUserOrToken(req, res, next);
    return;
  }
  requireAdminUser(req, res, next);
});

router.get("/admin/stats", async (_req, res): Promise<void> => {
  const [users] = await db
    .select({ count: sql<number>`count(distinct ${tenders.userId})::int` })
    .from(tenders);
  const [profiles] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(businessProfiles);
  const [tendersCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(tenders);
  const [catalogue] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(sourceTenders);
  const [latestRun] = await db
    .select()
    .from(ingestionRuns)
    .orderBy(desc(ingestionRuns.startedAt))
    .limit(1);
  res.json({
    userCount: users?.count ?? 0,
    profileCount: profiles?.count ?? 0,
    tenderCount: tendersCount?.count ?? 0,
    catalogueCount: catalogue?.count ?? 0,
    latestRun: latestRun ?? null,
  });
});

router.get("/admin/users", async (_req, res): Promise<void> => {
  const profiles = await db
    .select({
      userId: businessProfiles.userId,
      companyName: businessProfiles.companyName,
      industry: businessProfiles.industry,
      updatedAt: businessProfiles.updatedAt,
    })
    .from(businessProfiles)
    .orderBy(desc(businessProfiles.updatedAt));
  const counts = await db
    .select({
      userId: tenders.userId,
      tenderCount: sql<number>`count(*)::int`,
    })
    .from(tenders)
    .groupBy(tenders.userId);
  const countByUser = new Map(counts.map((c) => [c.userId, c.tenderCount]));

  const enriched = await Promise.all(
    profiles.map(async (p) => {
      let email: string | null = null;
      let lastSignInAt: number | null = null;
      try {
        const u = await clerkClient.users.getUser(p.userId);
        email = u.primaryEmailAddress?.emailAddress ?? null;
        lastSignInAt = u.lastSignInAt ?? null;
      } catch {
        // user removed from Clerk; keep nulls
      }
      return {
        userId: p.userId,
        companyName: p.companyName,
        industry: p.industry,
        updatedAt: p.updatedAt,
        email,
        lastSignInAt,
        tenderCount: countByUser.get(p.userId) ?? 0,
      };
    }),
  );
  res.json(enriched);
});

router.get("/admin/tenders", async (req, res): Promise<void> => {
  const limit = Math.min(Number(req.query.limit) || 100, 500);
  const userId =
    typeof req.query.userId === "string" ? req.query.userId : null;
  const where = userId ? eq(tenders.userId, userId) : undefined;
  const rows = await db
    .select()
    .from(tenders)
    .where(where ? and(where) : undefined)
    .orderBy(desc(tenders.createdAt))
    .limit(limit);
  res.json(rows);
});

router.get("/admin/activity", async (req, res): Promise<void> => {
  const limit = Math.min(Number(req.query.limit) || 100, 500);
  const rows = await db
    .select()
    .from(activityEntries)
    .orderBy(desc(activityEntries.createdAt))
    .limit(limit);
  res.json(rows);
});

router.get("/admin/ingestion/runs", async (req, res): Promise<void> => {
  const limit = Math.min(Number(req.query.limit) || 25, 200);
  const rows = await db
    .select()
    .from(ingestionRuns)
    .orderBy(desc(ingestionRuns.startedAt))
    .limit(limit);
  res.json(rows);
});

router.post("/admin/ingestion/run", async (req, res): Promise<void> => {
  const mode =
    typeof req.body?.mode === "string" && req.body.mode === "backfill"
      ? "backfill"
      : "incremental";
  try {
    if (mode === "backfill") {
      const start = req.body?.start ? new Date(req.body.start) : null;
      const end = req.body?.end ? new Date(req.body.end) : new Date();
      if (!start || !Number.isFinite(start.getTime())) {
        res.status(400).json({ error: "Invalid 'start' for backfill" });
        return;
      }
      const summary = await ingestRange({
        mode: "backfill",
        windowStart: start,
        windowEnd: end,
      });
      res.json(summary);
      return;
    }
    const summary = await runIncrementalSince();
    res.json(summary);
  } catch (err) {
    logger.error({ err: String(err) }, "ingestion admin run failed");
    res
      .status(500)
      .json({ error: err instanceof Error ? err.message : "Run failed" });
  }
});

export default router;
