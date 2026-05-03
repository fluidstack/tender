import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  boolean,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const tenders = pgTable(
  "tenders",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    title: text("title").notNull(),
    agency: text("agency").notNull(),
    reference: text("reference"),
    category: text("category"),
    location: text("location"),
    summary: text("summary"),
    budget: text("budget"),
    closeDate: text("close_date"),
    publishedDate: text("published_date"),
    status: text("status").notNull().default("open"),
    saved: boolean("saved").notNull().default(false),
    matchScore: integer("match_score"),
    matchRationale: text("match_rationale"),
    riskScore: integer("risk_score"),
    complianceScore: integer("compliance_score"),
    sourceTenderId: integer("source_tender_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userSourceUidx: uniqueIndex("tenders_user_source_uidx")
      .on(table.userId, table.sourceTenderId)
      .where(sql`${table.sourceTenderId} IS NOT NULL`),
  }),
);

export type TenderRow = typeof tenders.$inferSelect;
