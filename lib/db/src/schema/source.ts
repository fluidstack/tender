import {
  bigint,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const organisations = pgTable(
  "organisations",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    abn: text("abn"),
    role: text("role").notNull().default("buyer"),
    jurisdiction: text("jurisdiction"),
    country: text("country").default("AU"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    abnIdx: uniqueIndex("organisations_abn_uidx").on(table.abn),
    nameNoAbnUidx: uniqueIndex("organisations_name_no_abn_uidx")
      .on(table.name)
      .where(sql`${table.abn} IS NULL`),
    nameIdx: index("organisations_name_idx").on(table.name),
  }),
);

export const sourceTenders = pgTable(
  "source_tenders",
  {
    id: serial("id").primaryKey(),
    sourceSystem: text("source_system").notNull(),
    sourceTenderId: text("source_tender_id").notNull(),
    ocid: text("ocid"),
    title: text("title").notNull(),
    description: text("description"),
    status: text("status").notNull().default("open"),
    procurementMethod: text("procurement_method"),
    jurisdiction: text("jurisdiction").notNull().default("Commonwealth"),
    categoryCode: text("category_code"),
    category: text("category"),
    location: text("location"),
    estimatedValueMin: bigint("estimated_value_min", { mode: "number" }),
    estimatedValueMax: bigint("estimated_value_max", { mode: "number" }),
    currency: text("currency").default("AUD"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    closingAt: timestamp("closing_at", { withTimezone: true }),
    awardedAt: timestamp("awarded_at", { withTimezone: true }),
    buyerOrgId: integer("buyer_org_id").references(() => organisations.id, {
      onDelete: "set null",
    }),
    rawObjectPath: text("raw_object_path"),
    sourceLastModifiedAt: timestamp("source_last_modified_at", {
      withTimezone: true,
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    sourceUidx: uniqueIndex("source_tenders_source_uidx").on(
      table.sourceSystem,
      table.sourceTenderId,
    ),
    publishedIdx: index("source_tenders_published_idx").on(table.publishedAt),
    closingIdx: index("source_tenders_closing_idx").on(table.closingAt),
    statusIdx: index("source_tenders_status_idx").on(table.status),
    jurisdictionIdx: index("source_tenders_jurisdiction_idx").on(
      table.jurisdiction,
    ),
  }),
);

export const sourceAwards = pgTable(
  "source_awards",
  {
    id: serial("id").primaryKey(),
    sourceTenderId: integer("source_tender_id")
      .notNull()
      .references(() => sourceTenders.id, { onDelete: "cascade" }),
    awardId: text("award_id"),
    supplierOrgId: integer("supplier_org_id").references(
      () => organisations.id,
      { onDelete: "set null" },
    ),
    value: bigint("value", { mode: "number" }),
    currency: text("currency").default("AUD"),
    awardedAt: timestamp("awarded_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    tenderIdx: index("source_awards_tender_idx").on(table.sourceTenderId),
  }),
);

export const sourceDocuments = pgTable(
  "source_documents",
  {
    id: serial("id").primaryKey(),
    sourceTenderId: integer("source_tender_id")
      .notNull()
      .references(() => sourceTenders.id, { onDelete: "cascade" }),
    docType: text("doc_type"),
    title: text("title"),
    url: text("url").notNull(),
    mimeType: text("mime_type"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    tenderIdx: index("source_documents_tender_idx").on(table.sourceTenderId),
  }),
);

export const ingestionRuns = pgTable(
  "ingestion_runs",
  {
    id: serial("id").primaryKey(),
    sourceSystem: text("source_system").notNull(),
    mode: text("mode").notNull(),
    windowStart: timestamp("window_start", { withTimezone: true }),
    windowEnd: timestamp("window_end", { withTimezone: true }),
    startedAt: timestamp("started_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    fetched: integer("fetched").notNull().default(0),
    upserted: integer("upserted").notNull().default(0),
    failed: integer("failed").notNull().default(0),
    status: text("status").notNull().default("running"),
    error: text("error"),
    cursor: jsonb("cursor"),
  },
  (table) => ({
    sourceIdx: index("ingestion_runs_source_idx").on(
      table.sourceSystem,
      table.startedAt,
    ),
  }),
);

export type SourceTenderRow = typeof sourceTenders.$inferSelect;
export type OrganisationRow = typeof organisations.$inferSelect;
export type SourceAwardRow = typeof sourceAwards.$inferSelect;
export type SourceDocumentRow = typeof sourceDocuments.$inferSelect;
export type IngestionRunRow = typeof ingestionRuns.$inferSelect;
