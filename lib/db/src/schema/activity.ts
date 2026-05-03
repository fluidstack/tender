import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const activityEntries = pgTable("activity_entries", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  kind: text("kind").notNull(),
  label: text("label").notNull(),
  tenderId: integer("tender_id"),
  tenderTitle: text("tender_title"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type ActivityEntryRow = typeof activityEntries.$inferSelect;
