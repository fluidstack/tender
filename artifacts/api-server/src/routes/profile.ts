import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import {
  db,
  businessProfiles,
  staffMembers,
  pastPerformance,
  certifications,
} from "@workspace/db";
import {
  UpdateBusinessProfileBody,
  CreateStaffBody,
  CreatePastPerformanceBody,
  CreateCertificationBody,
} from "@workspace/api-zod";
import { requireAuth, getUserId } from "../lib/auth";
import { computeCompleteness, getOrCreateProfile, profileToApi } from "../lib/profile";

const router: IRouter = Router();

router.use(requireAuth);

router.get("/profile", async (req, res): Promise<void> => {
  const profile = await getOrCreateProfile(getUserId(req));
  res.json(profileToApi(profile));
});

router.patch("/profile", async (req, res): Promise<void> => {
  const parsed = UpdateBusinessProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const profile = await getOrCreateProfile(getUserId(req));
  const data = parsed.data;
  const [updated] = await db
    .update(businessProfiles)
    .set({
      companyName: data.companyName ?? profile.companyName,
      legalName: data.legalName ?? profile.legalName,
      abn: data.abn ?? profile.abn,
      website: data.website ?? profile.website,
      email: data.email ?? profile.email,
      phone: data.phone ?? profile.phone,
      address: data.address ?? profile.address,
      industry: data.industry ?? profile.industry,
      capabilities: data.capabilities ?? profile.capabilities,
      capabilityStatement: data.capabilityStatement ?? profile.capabilityStatement,
      yearsTrading: data.yearsTrading ?? profile.yearsTrading,
      employeeCount: data.employeeCount ?? profile.employeeCount,
      annualRevenue: data.annualRevenue ?? profile.annualRevenue,
      insuranceDetails: data.insuranceDetails ?? profile.insuranceDetails,
      whsStatement: data.wHSStatement ?? profile.whsStatement,
      qualityStatement: data.qualityStatement ?? profile.qualityStatement,
      diversityStatement: data.diversityStatement ?? profile.diversityStatement,
      sustainabilityStatement:
        data.sustainabilityStatement ?? profile.sustainabilityStatement,
      updatedAt: new Date(),
    })
    .where(eq(businessProfiles.id, profile.id))
    .returning();
  res.json(profileToApi(updated));
});

router.get("/profile/completeness", async (req, res): Promise<void> => {
  const profile = await getOrCreateProfile(getUserId(req));
  res.json(computeCompleteness(profile));
});

router.get("/profile/staff", async (req, res): Promise<void> => {
  const profile = await getOrCreateProfile(getUserId(req));
  const rows = await db
    .select()
    .from(staffMembers)
    .where(eq(staffMembers.profileId, profile.id))
    .orderBy(desc(staffMembers.createdAt));
  res.json(rows);
});

router.post("/profile/staff", async (req, res): Promise<void> => {
  const parsed = CreateStaffBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const profile = await getOrCreateProfile(getUserId(req));
  const [row] = await db
    .insert(staffMembers)
    .values({ ...parsed.data, profileId: profile.id })
    .returning();
  res.status(201).json(row);
});

router.delete("/profile/staff/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const profile = await getOrCreateProfile(getUserId(req));
  await db
    .delete(staffMembers)
    .where(and(eq(staffMembers.id, id), eq(staffMembers.profileId, profile.id)));
  res.sendStatus(204);
});

router.get("/profile/past-performance", async (req, res): Promise<void> => {
  const profile = await getOrCreateProfile(getUserId(req));
  const rows = await db
    .select()
    .from(pastPerformance)
    .where(eq(pastPerformance.profileId, profile.id))
    .orderBy(desc(pastPerformance.createdAt));
  res.json(rows);
});

router.post("/profile/past-performance", async (req, res): Promise<void> => {
  const parsed = CreatePastPerformanceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const profile = await getOrCreateProfile(getUserId(req));
  const [row] = await db
    .insert(pastPerformance)
    .values({ ...parsed.data, profileId: profile.id })
    .returning();
  res.status(201).json(row);
});

router.delete("/profile/past-performance/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const profile = await getOrCreateProfile(getUserId(req));
  await db
    .delete(pastPerformance)
    .where(and(eq(pastPerformance.id, id), eq(pastPerformance.profileId, profile.id)));
  res.sendStatus(204);
});

router.get("/profile/certifications", async (req, res): Promise<void> => {
  const profile = await getOrCreateProfile(getUserId(req));
  const rows = await db
    .select()
    .from(certifications)
    .where(eq(certifications.profileId, profile.id))
    .orderBy(desc(certifications.createdAt));
  res.json(rows);
});

router.post("/profile/certifications", async (req, res): Promise<void> => {
  const parsed = CreateCertificationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const profile = await getOrCreateProfile(getUserId(req));
  const [row] = await db
    .insert(certifications)
    .values({ ...parsed.data, profileId: profile.id })
    .returning();
  res.status(201).json(row);
});

router.delete("/profile/certifications/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const profile = await getOrCreateProfile(getUserId(req));
  await db
    .delete(certifications)
    .where(and(eq(certifications.id, id), eq(certifications.profileId, profile.id)));
  res.sendStatus(204);
});

export default router;
