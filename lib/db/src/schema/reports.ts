import {
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { tenders } from "./tenders";

export type ComplianceItemJson = {
  requirement: string;
  status: "met" | "partial" | "gap";
  evidence: string;
  recommendation?: string | null;
};

export type RiskItemJson = {
  clause: string;
  category: string;
  severity: "low" | "medium" | "high";
  rationale: string;
  suggestion?: string | null;
};

export const complianceReports = pgTable("compliance_reports", {
  id: serial("id").primaryKey(),
  tenderId: integer("tender_id")
    .notNull()
    .unique()
    .references(() => tenders.id, { onDelete: "cascade" }),
  score: integer("score").notNull().default(0),
  summary: text("summary"),
  gaps: jsonb("gaps").$type<string[]>().notNull().default([]),
  items: jsonb("items").$type<ComplianceItemJson[]>().notNull().default([]),
  generatedAt: timestamp("generated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const riskReports = pgTable("risk_reports", {
  id: serial("id").primaryKey(),
  tenderId: integer("tender_id")
    .notNull()
    .unique()
    .references(() => tenders.id, { onDelete: "cascade" }),
  overallRisk: text("overall_risk").notNull().default("medium"),
  summary: text("summary"),
  items: jsonb("items").$type<RiskItemJson[]>().notNull().default([]),
  generatedAt: timestamp("generated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type ComplianceReportRow = typeof complianceReports.$inferSelect;
export type RiskReportRow = typeof riskReports.$inferSelect;
