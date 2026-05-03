import { ingestRange, runIncrementalSince } from "../lib/austender/ingest";
import { logger } from "../lib/logger";

async function main() {
  const args = process.argv.slice(2);
  const mode = args[0] === "backfill" ? "backfill" : "incremental";

  if (mode === "backfill") {
    const start = args[1] ? new Date(args[1]) : null;
    const end = args[2] ? new Date(args[2]) : new Date();
    if (!start || !Number.isFinite(start.getTime())) {
      console.error(
        "Usage: ingest-austender backfill <ISO start> [ISO end]",
      );
      process.exit(1);
    }
    const summary = await ingestRange({
      mode: "backfill",
      windowStart: start,
      windowEnd: end,
    });
    logger.info({ summary }, "backfill complete");
    process.exit(summary.status === "failed" ? 1 : 0);
  }

  const summary = await runIncrementalSince();
  logger.info({ summary }, "incremental complete");
  process.exit(summary.status === "failed" ? 1 : 0);
}

main().catch((err) => {
  logger.error({ err: String(err) }, "ingestion script crashed");
  process.exit(1);
});
