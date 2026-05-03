import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { tenders } from "./tenders";

export const requirements = pgTable("requirements", {
  id: serial("id").primaryKey(),
  tenderId: integer("tender_id")
    .notNull()
    .references(() => tenders.id, { onDelete: "cascade" }),
  category: text("category").notNull(),
  text: text("text").notNull(),
  section: text("section"),
  mandatory: boolean("mandatory").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type RequirementRow = typeof requirements.$inferSelect;
