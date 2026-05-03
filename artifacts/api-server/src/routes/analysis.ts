import { Router, type IRouter } from "express";
import { and, eq, desc } from "drizzle-orm";
import {
  db,
  tenders,
  tenderDocuments,
  requirements,
  complianceReports,
  riskReports,
  tenderDrafts,
  activityEntries,
  staffMembers,
  pastPerformance,
  certifications,
  type ComplianceItemJson,
  type RiskItemJson,
  type DraftSectionJson,
} from "@workspace/db";
import { requireAuth, getUserId } from "../lib/auth";
import { aiJson, aiText, truncate } from "../lib/ai";
import { getOrCreateProfile } from "../lib/profile";
import { draftToDocx, draftToPdf } from "../lib/exportDoc";
import { UpdateTenderDraftBody } from "@workspace/api-zod";

const router: IRouter = Router();
router.use(requireAuth);

async function ownTender(userId: string, id: number) {
  const [t] = await db
    .select()
    .from(tenders)
    .where(and(eq(tenders.id, id), eq(tenders.userId, userId)));
  return t ?? null;
}

async function combinedText(tenderId: number): Promise<string> {
  const docs = await db
    .select()
    .from(tenderDocuments)
    .where(eq(tenderDocuments.tenderId, tenderId));
  const parts: string[] = [];
  for (const d of docs) {
    if (d.extractedText) {
      parts.push(`\n\n=== ${d.name} ===\n${d.extractedText}`);
    }
  }
  return truncate(parts.join("\n"), 24000);
}

router.post("/tenders/:id/extract-requirements", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const id = Number(req.params.id);
  const t = await ownTender(userId, id);
  if (!t) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const text = await combinedText(id);
  const tenderContext = [t.title, t.agency, t.summary].filter(Boolean).join(" — ");
  type Out = {
    requirements: Array<{
      category: string;
      text: string;
      section?: string | null;
      mandatory?: boolean;
    }>;
  };
  const result = await aiJson<Out>({
    system:
      "You are a procurement analyst. Extract every distinct requirement from a tender. Categorize as one of: mandatory, technical, evaluation, submission, contractual, other. Return strictly valid JSON: {\"requirements\":[{\"category\":\"...\",\"text\":\"...\",\"section\":\"...\",\"mandatory\":true|false}]}.",
    user: `Tender: ${tenderContext}\n\nDocuments:\n${text || "(no documents uploaded)"}`,
    fallback: { requirements: [] },
  });

  await db.delete(requirements).where(eq(requirements.tenderId, id));
  if (result.requirements.length) {
    await db.insert(requirements).values(
      result.requirements.slice(0, 80).map((r) => ({
        tenderId: id,
        category: r.category || "other",
        text: r.text,
        section: r.section ?? null,
        mandatory: Boolean(r.mandatory),
      })),
    );
  }
  await db.insert(activityEntries).values({
    userId,
    kind: "requirements_extracted",
    label: `Extracted ${result.requirements.length} requirements`,
    tenderId: id,
    tenderTitle: t.title,
  });
  const rows = await db
    .select()
    .from(requirements)
    .where(eq(requirements.tenderId, id))
    .orderBy(desc(requirements.createdAt));
  res.json(rows);
});

router.get("/tenders/:id/requirements", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const id = Number(req.params.id);
  const t = await ownTender(userId, id);
  if (!t) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const rows = await db
    .select()
    .from(requirements)
    .where(eq(requirements.tenderId, id))
    .orderBy(desc(requirements.createdAt));
  res.json(rows);
});

router.get("/tenders/:id/compliance", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const id = Number(req.params.id);
  if (!(await ownTender(userId, id))) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const [row] = await db
    .select()
    .from(complianceReports)
    .where(eq(complianceReports.tenderId, id));
  if (!row) {
    res.status(404).json({ error: "Not generated" });
    return;
  }
  res.json(row);
});

router.post("/tenders/:id/compliance", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const id = Number(req.params.id);
  const t = await ownTender(userId, id);
  if (!t) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const profile = await getOrCreateProfile(userId);
  const reqs = await db.select().from(requirements).where(eq(requirements.tenderId, id));
  const certs = await db
    .select()
    .from(certifications)
    .where(eq(certifications.profileId, profile.id));
  const past = await db
    .select()
    .from(pastPerformance)
    .where(eq(pastPerformance.profileId, profile.id));
  const profileSummary = JSON.stringify({
    company: profile.companyName,
    industry: profile.industry,
    capabilities: profile.capabilities,
    capabilityStatement: profile.capabilityStatement,
    yearsTrading: profile.yearsTrading,
    employeeCount: profile.employeeCount,
    insurance: profile.insuranceDetails,
    whs: profile.whsStatement,
    quality: profile.qualityStatement,
    certifications: certs.map((c) => ({ name: c.name, issuer: c.issuer })),
    pastPerformance: past.map((p) => ({
      project: p.projectName,
      client: p.client,
      sector: p.sector,
    })),
  });

  type Out = {
    score: number;
    summary: string;
    gaps: string[];
    items: ComplianceItemJson[];
  };
  const result = await aiJson<Out>({
    system:
      "You are a tender compliance analyst. For each tender requirement, assess whether the business profile meets it. Status must be exactly one of met|partial|gap. Return strictly valid JSON: {\"score\":0-100,\"summary\":\"...\",\"gaps\":[\"...\"],\"items\":[{\"requirement\":\"...\",\"status\":\"met|partial|gap\",\"evidence\":\"...\",\"recommendation\":\"...\"}]}.",
    user: `Business profile: ${profileSummary}\n\nRequirements:\n${reqs
      .map((r, i) => `${i + 1}. (${r.category}${r.mandatory ? ", MANDATORY" : ""}) ${r.text}`)
      .join("\n")}`,
    fallback: { score: 0, summary: "Unable to generate", gaps: [], items: [] },
  });

  const items = (result.items ?? []).map((i) => ({
    requirement: i.requirement || "",
    status: (["met", "partial", "gap"] as const).includes(i.status as any)
      ? (i.status as ComplianceItemJson["status"])
      : ("gap" as const),
    evidence: i.evidence || "",
    recommendation: i.recommendation ?? null,
  }));

  await db
    .delete(complianceReports)
    .where(eq(complianceReports.tenderId, id));
  const [row] = await db
    .insert(complianceReports)
    .values({
      tenderId: id,
      score: Math.max(0, Math.min(100, Math.round(result.score ?? 0))),
      summary: result.summary ?? null,
      gaps: result.gaps ?? [],
      items,
    })
    .returning();
  await db
    .update(tenders)
    .set({ complianceScore: row.score })
    .where(eq(tenders.id, id));
  await db.insert(activityEntries).values({
    userId,
    kind: "compliance_run",
    label: `Compliance analysis (${row.score}%)`,
    tenderId: id,
    tenderTitle: t.title,
  });
  res.json(row);
});

router.get("/tenders/:id/risks", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const id = Number(req.params.id);
  if (!(await ownTender(userId, id))) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const [row] = await db.select().from(riskReports).where(eq(riskReports.tenderId, id));
  if (!row) {
    res.status(404).json({ error: "Not generated" });
    return;
  }
  res.json(row);
});

router.post("/tenders/:id/risks", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const id = Number(req.params.id);
  const t = await ownTender(userId, id);
  if (!t) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const text = await combinedText(id);
  type Out = {
    overallRisk: "low" | "medium" | "high";
    summary: string;
    items: RiskItemJson[];
  };
  const result = await aiJson<Out>({
    system:
      "You are a contract risk analyst. Identify risky clauses (liability, indemnity, IP, termination, payment, warranties, jurisdiction, SLAs, etc). Severity must be exactly one of low|medium|high. Return strictly valid JSON: {\"overallRisk\":\"low|medium|high\",\"summary\":\"...\",\"items\":[{\"clause\":\"...\",\"category\":\"...\",\"severity\":\"low|medium|high\",\"rationale\":\"...\",\"suggestion\":\"...\"}]}.",
    user: `Tender: ${t.title} (${t.agency})\n\nDocuments:\n${text || "(no documents uploaded)"}`,
    fallback: { overallRisk: "medium", summary: "Unable to generate", items: [] },
  });

  const items = (result.items ?? []).map((i) => ({
    clause: i.clause || "",
    category: i.category || "general",
    severity: (["low", "medium", "high"] as const).includes(i.severity as any)
      ? (i.severity as RiskItemJson["severity"])
      : "medium",
    rationale: i.rationale || "",
    suggestion: i.suggestion ?? null,
  }));

  await db.delete(riskReports).where(eq(riskReports.tenderId, id));
  const [row] = await db
    .insert(riskReports)
    .values({
      tenderId: id,
      overallRisk: result.overallRisk ?? "medium",
      summary: result.summary ?? null,
      items,
    })
    .returning();
  const riskScore = items.reduce(
    (sum, i) => sum + (i.severity === "high" ? 3 : i.severity === "medium" ? 2 : 1),
    0,
  );
  await db
    .update(tenders)
    .set({ riskScore: Math.min(100, riskScore * 5) })
    .where(eq(tenders.id, id));
  await db.insert(activityEntries).values({
    userId,
    kind: "risk_run",
    label: `Risk analysis (${row.overallRisk})`,
    tenderId: id,
    tenderTitle: t.title,
  });
  res.json(row);
});

router.get("/tenders/:id/draft", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const id = Number(req.params.id);
  if (!(await ownTender(userId, id))) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const [row] = await db.select().from(tenderDrafts).where(eq(tenderDrafts.tenderId, id));
  if (!row) {
    res.status(404).json({ error: "Not generated" });
    return;
  }
  res.json(row);
});

const DEFAULT_SECTIONS = [
  { key: "executive_summary", title: "Executive summary" },
  { key: "company_overview", title: "Company overview" },
  { key: "capability_statement", title: "Capability statement" },
  { key: "methodology", title: "Methodology & delivery approach" },
  { key: "team_experience", title: "Team & experience" },
  { key: "past_performance", title: "Past performance" },
  { key: "risk_management", title: "Risk management plan" },
  { key: "whs_quality", title: "WHS, quality & compliance" },
  { key: "value_proposition", title: "Value proposition" },
];

router.post("/tenders/:id/draft", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const id = Number(req.params.id);
  const t = await ownTender(userId, id);
  if (!t) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const profile = await getOrCreateProfile(userId);
  const reqs = await db.select().from(requirements).where(eq(requirements.tenderId, id));
  const staff = await db
    .select()
    .from(staffMembers)
    .where(eq(staffMembers.profileId, profile.id));
  const past = await db
    .select()
    .from(pastPerformance)
    .where(eq(pastPerformance.profileId, profile.id));

  const profileBlob = JSON.stringify({
    company: profile.companyName,
    industry: profile.industry,
    capabilities: profile.capabilities,
    capabilityStatement: profile.capabilityStatement,
    insurance: profile.insuranceDetails,
    whs: profile.whsStatement,
    quality: profile.qualityStatement,
    diversity: profile.diversityStatement,
    sustainability: profile.sustainabilityStatement,
    staff: staff.map((s) => ({ name: s.name, role: s.role, bio: s.bio })),
    pastPerformance: past.map((p) => ({
      project: p.projectName,
      client: p.client,
      outcomes: p.outcomes,
    })),
  });

  const sections: DraftSectionJson[] = [];
  for (const sec of DEFAULT_SECTIONS) {
    const content = await aiText({
      system:
        "You are a professional bid writer. Write a concise, persuasive section for a tender response. Use clear paragraphs, no markdown headings, no bullet stars. 2-4 paragraphs.",
      user: `Section: ${sec.title}\n\nTender: ${t.title} — ${t.agency}\nSummary: ${t.summary ?? ""}\n\nBusiness profile: ${profileBlob}\n\nKey requirements:\n${reqs
        .slice(0, 12)
        .map((r) => `- ${r.text}`)
        .join("\n") || "(none extracted yet)"}`,
      fallback: `${sec.title} content pending — please add details.`,
    });
    sections.push({ key: sec.key, title: sec.title, content });
  }

  await db.delete(tenderDrafts).where(eq(tenderDrafts.tenderId, id));
  const [row] = await db
    .insert(tenderDrafts)
    .values({ tenderId: id, sections })
    .returning();
  await db
    .update(tenders)
    .set({ status: "drafting", updatedAt: new Date() })
    .where(eq(tenders.id, id));
  await db.insert(activityEntries).values({
    userId,
    kind: "draft_generated",
    label: `Generated draft response`,
    tenderId: id,
    tenderTitle: t.title,
  });
  res.json(row);
});

router.patch("/tenders/:id/draft", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const id = Number(req.params.id);
  if (!(await ownTender(userId, id))) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const parsed = UpdateTenderDraftBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db
    .update(tenderDrafts)
    .set({ sections: parsed.data.sections, updatedAt: new Date() })
    .where(eq(tenderDrafts.tenderId, id))
    .returning();
  res.json(row);
});

router.get("/tenders/:id/draft/export", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const id = Number(req.params.id);
  const t = await ownTender(userId, id);
  if (!t) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const [draft] = await db.select().from(tenderDrafts).where(eq(tenderDrafts.tenderId, id));
  if (!draft) {
    res.status(404).json({ error: "No draft" });
    return;
  }
  const format = req.query.format === "pdf" ? "pdf" : "docx";
  const buf =
    format === "pdf"
      ? await draftToPdf(t.title, draft.sections)
      : await draftToDocx(t.title, draft.sections);
  const safeName = t.title.replace(/[^a-z0-9]+/gi, "_");
  res.setHeader(
    "Content-Type",
    format === "pdf"
      ? "application/pdf"
      : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  );
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${safeName}.${format}"`,
  );
  res.send(buf);
});

router.get("/tenders/:id/checklist", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const id = Number(req.params.id);
  const t = await ownTender(userId, id);
  if (!t) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const [comp] = await db
    .select()
    .from(complianceReports)
    .where(eq(complianceReports.tenderId, id));
  const [risk] = await db
    .select()
    .from(riskReports)
    .where(eq(riskReports.tenderId, id));
  const [draft] = await db
    .select()
    .from(tenderDrafts)
    .where(eq(tenderDrafts.tenderId, id));

  const items: Array<{
    id: string;
    category: string;
    label: string;
    complete: boolean;
    detail?: string | null;
  }> = [];

  items.push({
    id: "documents",
    category: "Setup",
    label: "Tender documents uploaded and parsed",
    complete: true,
  });
  items.push({
    id: "requirements",
    category: "Setup",
    label: "Requirements extracted",
    complete: true,
    detail: null,
  });
  items.push({
    id: "compliance",
    category: "Compliance",
    label: comp ? `Compliance score ${comp.score}%` : "Run compliance analysis",
    complete: !!comp,
  });
  if (comp) {
    for (const gap of comp.gaps.slice(0, 8)) {
      items.push({
        id: `gap-${gap.slice(0, 32)}`,
        category: "Gap",
        label: gap,
        complete: false,
      });
    }
  }
  items.push({
    id: "risks",
    category: "Risk",
    label: risk ? `Contract risk: ${risk.overallRisk}` : "Run risk analysis",
    complete: !!risk,
  });
  items.push({
    id: "draft",
    category: "Response",
    label: draft ? "Draft response generated" : "Generate draft response",
    complete: !!draft,
  });
  res.json(items);
});

export default router;
