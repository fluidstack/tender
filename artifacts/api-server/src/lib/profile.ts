import { db, businessProfiles, type BusinessProfileRow } from "@workspace/db";
import { eq } from "drizzle-orm";

const PROFILE_FIELDS: Array<{
  key: keyof BusinessProfileRow;
  label: string;
  section: string;
}> = [
  { key: "companyName", label: "Company name", section: "Corporate" },
  { key: "legalName", label: "Legal name", section: "Corporate" },
  { key: "abn", label: "ABN", section: "Corporate" },
  { key: "website", label: "Website", section: "Corporate" },
  { key: "email", label: "Email", section: "Corporate" },
  { key: "phone", label: "Phone", section: "Corporate" },
  { key: "address", label: "Address", section: "Corporate" },
  { key: "industry", label: "Industry", section: "Corporate" },
  { key: "yearsTrading", label: "Years trading", section: "Corporate" },
  { key: "employeeCount", label: "Employee count", section: "Corporate" },
  { key: "annualRevenue", label: "Annual revenue", section: "Corporate" },
  { key: "capabilities", label: "Capabilities", section: "Capabilities" },
  {
    key: "capabilityStatement",
    label: "Capability statement",
    section: "Capabilities",
  },
  {
    key: "insuranceDetails",
    label: "Insurance details",
    section: "Compliance",
  },
  { key: "whsStatement", label: "WHS statement", section: "Compliance" },
  {
    key: "qualityStatement",
    label: "Quality statement",
    section: "Compliance",
  },
  {
    key: "diversityStatement",
    label: "Diversity statement",
    section: "Policies",
  },
  {
    key: "sustainabilityStatement",
    label: "Sustainability statement",
    section: "Policies",
  },
];

export async function getOrCreateProfile(
  userId: string,
): Promise<BusinessProfileRow> {
  const [existing] = await db
    .select()
    .from(businessProfiles)
    .where(eq(businessProfiles.userId, userId));
  if (existing) return existing;
  const [created] = await db
    .insert(businessProfiles)
    .values({ userId, companyName: "" })
    .returning();
  return created;
}

function isFilled(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return true;
  return Boolean(value);
}

export function computeCompleteness(profile: BusinessProfileRow): {
  score: number;
  completedFields: number;
  totalFields: number;
  missing: string[];
  sections: { name: string; score: number; missing: string[] }[];
} {
  const total = PROFILE_FIELDS.length;
  let completed = 0;
  const missing: string[] = [];
  const sectionMap = new Map<string, { total: number; done: number; missing: string[] }>();

  for (const field of PROFILE_FIELDS) {
    const filled = isFilled(profile[field.key]);
    if (filled) completed++;
    else missing.push(field.label);

    const s = sectionMap.get(field.section) ?? { total: 0, done: 0, missing: [] };
    s.total++;
    if (filled) s.done++;
    else s.missing.push(field.label);
    sectionMap.set(field.section, s);
  }

  return {
    score: Math.round((completed / total) * 100),
    completedFields: completed,
    totalFields: total,
    missing,
    sections: Array.from(sectionMap.entries()).map(([name, s]) => ({
      name,
      score: Math.round((s.done / s.total) * 100),
      missing: s.missing,
    })),
  };
}

export function profileToApi(profile: BusinessProfileRow) {
  const { score } = computeCompleteness(profile);
  return {
    id: profile.id,
    companyName: profile.companyName ?? "",
    legalName: profile.legalName,
    abn: profile.abn,
    website: profile.website,
    email: profile.email,
    phone: profile.phone,
    address: profile.address,
    industry: profile.industry,
    capabilities: profile.capabilities,
    capabilityStatement: profile.capabilityStatement,
    yearsTrading: profile.yearsTrading,
    employeeCount: profile.employeeCount,
    annualRevenue: profile.annualRevenue,
    insuranceDetails: profile.insuranceDetails,
    wHSStatement: profile.whsStatement,
    qualityStatement: profile.qualityStatement,
    diversityStatement: profile.diversityStatement,
    sustainabilityStatement: profile.sustainabilityStatement,
    completeness: score,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}
