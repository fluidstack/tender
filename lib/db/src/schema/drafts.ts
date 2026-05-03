import {
  integer,
  jsonb,
  pgTable,
  serial,
  timestamp,
} from "drizzle-orm/pg-core";
import { tenders } from "./tenders";

export type DraftSectionJson = {
  key: string;
  title: string;
  content: string;
};

export const tenderDrafts = pgTable("tender_drafts", {
  id: serial("id").primaryKey(),
  tenderId: integer("tender_id")
    .notNull()
    .unique()
    .references(() => tenders.id, { onDelete: "cascade" }),
  sections: jsonb("sections")
    .$type<DraftSectionJson[]>()
    .notNull()
    .default([]),
  generatedAt: timestamp("generated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type TenderDraftRow = typeof tenderDrafts.$inferSelect;
