import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const businessProfiles = pgTable("business_profiles", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  companyName: text("company_name").notNull().default(""),
  legalName: text("legal_name"),
  abn: text("abn"),
  website: text("website"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  industry: text("industry"),
  capabilities: text("capabilities"),
  capabilityStatement: text("capability_statement"),
  yearsTrading: integer("years_trading"),
  employeeCount: integer("employee_count"),
  annualRevenue: text("annual_revenue"),
  insuranceDetails: text("insurance_details"),
  whsStatement: text("whs_statement"),
  qualityStatement: text("quality_statement"),
  diversityStatement: text("diversity_statement"),
  sustainabilityStatement: text("sustainability_statement"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const staffMembers = pgTable("staff_members", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id")
    .notNull()
    .references(() => businessProfiles.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  role: text("role").notNull(),
  bio: text("bio"),
  yearsExperience: integer("years_experience"),
  qualifications: text("qualifications"),
  cvObjectPath: text("cv_object_path"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const pastPerformance = pgTable("past_performance", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id")
    .notNull()
    .references(() => businessProfiles.id, { onDelete: "cascade" }),
  projectName: text("project_name").notNull(),
  client: text("client").notNull(),
  sector: text("sector"),
  value: text("value"),
  startDate: text("start_date"),
  endDate: text("end_date"),
  outcomes: text("outcomes"),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const certifications = pgTable("certifications", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id")
    .notNull()
    .references(() => businessProfiles.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  issuer: text("issuer").notNull(),
  identifier: text("identifier"),
  expiresOn: text("expires_on"),
  documentObjectPath: text("document_object_path"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type BusinessProfileRow = typeof businessProfiles.$inferSelect;
export type StaffMemberRow = typeof staffMembers.$inferSelect;
export type PastPerformanceRow = typeof pastPerformance.$inferSelect;
export type CertificationRow = typeof certifications.$inferSelect;
