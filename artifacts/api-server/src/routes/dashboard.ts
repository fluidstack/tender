import { Router, type IRouter } from "express";
import { eq, desc, and, sql } from "drizzle-orm";
import { db, tenders, activityEntries, sourceTenders } from "@workspace/db";
import { requireAuth, getUserId } from "../lib/auth";
import { getOrCreateProfile } from "../lib/profile";
import { computeCompleteness } from "../lib/profile";
import { computeMatchScore } from "../lib/matching";
import { seedSampleTendersForUser } from "../lib/seed";

const router: IRouter = Router();
router.use(requireAuth);

async function shouldSeedSamples(): Promise<boolean> {
  if (process.env.DISABLE_SAMPLE_SEED === "1") return false;
  if (process.env.FORCE_SAMPLE_SEED === "1") return true;
  const [{ count = 0 } = { count: 0 }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(sourceTenders);
  return count === 0;
}

router.get("/dashboard/summary", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  if (await shouldSeedSamples()) {
    await seedSampleTendersForUser(userId);
  }
  const [profile, allTenders, activity] = await Promise.all([
    getOrCreateProfile(userId),
    db.select().from(tenders).where(eq(tenders.userId, userId)),
    db
      .select()
      .from(activityEntries)
      .where(eq(activityEntries.userId, userId))
      .orderBy(desc(activityEntries.createdAt))
      .limit(15),
  ]);

  const completeness = computeCompleteness(profile);
  const open = allTenders.filter((t) => t.status === "open");
  const drafting = allTenders.filter((t) => t.status === "drafting");
  const submitted = allTenders.filter((t) => t.status === "submitted");
  const saved = allTenders.filter((t) => t.saved);

  const decorated = allTenders.map((t) => {
    const m = computeMatchScore(t, profile);
    return { ...t, matchScore: t.matchScore ?? m.score, matchRationale: t.matchRationale ?? m.rationale, documentCount: 0, requirementCount: 0 };
  });
  const upcoming = decorated
    .filter((t) => t.status === "open" && t.closeDate)
    .sort((a, b) => (a.closeDate ?? "").localeCompare(b.closeDate ?? ""))
    .slice(0, 5);

  const avgScore =
    decorated.length === 0
      ? 0
      : Math.round(
          decorated.reduce((sum, t) => sum + (t.matchScore ?? 0), 0) /
            decorated.length,
        );

  const statusCounts = new Map<string, number>();
  for (const t of allTenders) {
    statusCounts.set(t.status, (statusCounts.get(t.status) ?? 0) + 1);
  }

  res.json({
    totalTenders: allTenders.length,
    openTenders: open.length,
    savedTenders: saved.length,
    draftsInProgress: drafting.length,
    submitted: submitted.length,
    profileCompleteness: completeness.score,
    averageMatchScore: avgScore,
    upcomingDeadlines: upcoming,
    recentActivity: activity.map((a) => ({
      id: String(a.id),
      kind: a.kind,
      label: a.label,
      tenderId: a.tenderId,
      tenderTitle: a.tenderTitle,
      createdAt: a.createdAt,
    })),
    statusBreakdown: Array.from(statusCounts.entries()).map(([status, count]) => ({
      status,
      count,
    })),
  });
});

export default router;
