import type { NormalisedTender, OcdsRelease, OcdsSearchResponse } from "./types";

export const SOURCE_SYSTEM = "austender_ocds";

function parseDate(value: string | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isFinite(d.getTime()) ? d : null;
}

function getBuyer(release: OcdsRelease): { name: string; abn: string | null } | null {
  const buyerId = release.buyer?.id;
  const buyerName = release.buyer?.name;
  const party =
    release.parties?.find(
      (p) => p.id === buyerId || p.roles?.includes("buyer"),
    ) ?? null;
  const name = party?.name ?? buyerName ?? null;
  if (!name) return null;
  const abn =
    party?.identifier?.scheme === "AU-ABN"
      ? (party.identifier.id ?? null)
      : null;
  return { name, abn };
}

export function normaliseRelease(
  release: OcdsRelease,
  mode: "backfill" | "incremental" = "backfill",
): NormalisedTender | null {
  const sourceTenderId = release.tender?.id ?? release.id ?? release.ocid;
  const title = release.tender?.title;
  if (!sourceTenderId || !title) return null;

  const buyer = getBuyer(release);
  const item0 = release.tender?.items?.[0];
  const category =
    release.tender?.classification?.description ??
    item0?.classification?.description ??
    release.tender?.mainProcurementCategory ??
    null;
  const categoryCode =
    release.tender?.classification?.id ??
    item0?.classification?.id ??
    null;
  const location =
    item0?.deliveryAddress?.locality ??
    item0?.deliveryAddress?.region ??
    null;

  const valueMax = release.tender?.value?.amount ?? null;
  const valueMin = release.tender?.minValue?.amount ?? valueMax;
  const currency =
    release.tender?.value?.currency ??
    release.tender?.minValue?.currency ??
    "AUD";

  const publishedAt = parseDate(release.date);
  const closingAt = parseDate(release.tender?.tenderPeriod?.endDate);
  const awardedAt =
    release.awards?.length
      ? parseDate(release.awards[0]?.date)
      : null;

  const status =
    awardedAt && awardedAt.getTime() <= Date.now()
      ? "awarded"
      : closingAt && closingAt.getTime() < Date.now()
        ? "closed"
        : (release.tender?.status ?? "open");

  return {
    sourceSystem: SOURCE_SYSTEM,
    sourceTenderId: String(sourceTenderId),
    ocid: release.ocid ?? null,
    title,
    description: release.tender?.description ?? null,
    status,
    procurementMethod: release.tender?.procurementMethod ?? null,
    jurisdiction: "Commonwealth",
    categoryCode,
    category,
    location,
    estimatedValueMin: valueMin ?? null,
    estimatedValueMax: valueMax ?? null,
    currency,
    publishedAt,
    closingAt,
    awardedAt,
    buyer,
    documents: (release.tender?.documents ?? [])
      .filter((d) => !!d.url)
      .map((d) => ({
        docType: d.documentType ?? null,
        title: d.title ?? null,
        url: d.url!,
        mimeType: d.format ?? null,
      })),
    awards: (release.awards ?? []).map((a) => {
      const supplier = a.suppliers?.[0];
      const supplierParty = release.parties?.find(
        (p) => p.id === supplier?.id,
      );
      const supplierAbn =
        supplierParty?.identifier?.scheme === "AU-ABN"
          ? (supplierParty.identifier.id ?? null)
          : null;
      return {
        awardId: a.id ?? null,
        supplier: supplier?.name
          ? { name: supplier.name, abn: supplierAbn }
          : null,
        value: a.value?.amount ?? null,
        currency: a.value?.currency ?? "AUD",
        awardedAt: parseDate(a.date),
      };
    }),
    sourceLastModifiedAt: mode === "incremental" ? publishedAt : null,
  };
}

export function releasesFromPage(page: OcdsSearchResponse): OcdsRelease[] {
  if (page.releases?.length) return page.releases;
  return (
    page.records
      ?.map((r) => r.compiledRelease ?? r.releases?.[0])
      .filter((r): r is OcdsRelease => !!r) ?? []
  );
}
