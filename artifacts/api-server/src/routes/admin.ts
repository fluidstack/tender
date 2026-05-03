import { Router, type IRouter } from "express";
import {
  ingestRange,
  runIncrementalSince,
} from "../lib/austender/ingest";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function isAuthorisedAdmin(req: { headers: Record<string, unknown> }): boolean {
  const expected = process.env.INGESTION_ADMIN_TOKEN;
  if (!expected) return false;
  const header = req.headers["x-admin-token"];
  if (typeof header !== "string") return false;
  return header === expected;
}

router.post("/admin/ingestion/run", async (req, res): Promise<void> => {
  if (!isAuthorisedAdmin(req)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
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
