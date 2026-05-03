import { db, tenders } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const SAMPLES = [
  {
    title: "Cybersecurity uplift programme",
    agency: "Department of Home Affairs",
    reference: "HOM-2026-CS-014",
    category: "ICT services",
    location: "Canberra, ACT",
    summary:
      "Multi-year cybersecurity uplift programme covering vulnerability assessment, penetration testing, SIEM modernisation, and 24/7 SOC support across federal agency networks. Provider must hold IRAP assessment, ISO 27001 certification, and demonstrate APRA-aligned incident response capability.",
    budget: "$4.5M – $6.0M over 3 years",
    closeDate: "2026-08-15",
    publishedDate: "2026-04-10",
  },
  {
    title: "Regional school facilities maintenance panel",
    agency: "NSW Department of Education",
    reference: "DOE-RSM-2026-09",
    category: "Facilities & maintenance",
    location: "Regional NSW",
    summary:
      "Establishment of a panel of qualified providers to deliver scheduled and reactive maintenance across 180+ regional schools. Includes plumbing, electrical, HVAC, grounds, and minor capital works. WHS, working with children clearances, and demonstrated regional presence are mandatory.",
    budget: "$25M panel value over 4 years",
    closeDate: "2026-07-30",
    publishedDate: "2026-04-22",
  },
  {
    title: "Public health communications campaign",
    agency: "Victorian Department of Health",
    reference: "VIC-DH-PHC-2026",
    category: "Marketing & communications",
    location: "Melbourne, VIC",
    summary:
      "Design and delivery of an integrated public health behaviour-change campaign across digital, broadcast, and community channels. Focus on equity in reach across CALD communities and regional Victoria. Provider must demonstrate prior government campaign experience and evaluation methodology.",
    budget: "$1.2M – $1.8M",
    closeDate: "2026-06-25",
    publishedDate: "2026-05-01",
  },
];

export async function seedSampleTendersForUser(userId: string): Promise<void> {
  for (const sample of SAMPLES) {
    const existing = await db
      .select()
      .from(tenders)
      .where(and(eq(tenders.userId, userId), eq(tenders.reference, sample.reference!)));
    if (existing.length === 0) {
      await db.insert(tenders).values({ ...sample, userId, status: "open" });
    }
  }
}
