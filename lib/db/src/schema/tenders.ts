import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";

export const tenders = pgTable("tenders", {
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
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type TenderRow = typeof tenders.$inferSelect;
