import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { tenders } from "./tenders";

export const tenderDocuments = pgTable("tender_documents", {
  id: serial("id").primaryKey(),
  tenderId: integer("tender_id")
    .notNull()
    .references(() => tenders.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  contentType: text("content_type").notNull(),
  sizeBytes: integer("size_bytes").notNull().default(0),
  objectPath: text("object_path").notNull(),
  parseStatus: text("parse_status").notNull().default("pending"),
  parseError: text("parse_error"),
  extractedText: text("extracted_text"),
  pageCount: integer("page_count"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type TenderDocumentRow = typeof tenderDocuments.$inferSelect;
