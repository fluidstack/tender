import type { TenderRow, BusinessProfileRow } from "@workspace/db";

function tokenize(text: string | null | undefined): Set<string> {
  if (!text) return new Set();
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 3),
  );
}

export function computeMatchScore(
  tender: TenderRow,
  profile: BusinessProfileRow | null,
): { score: number; rationale: string } {
  if (!profile) return { score: 0, rationale: "Add a business profile to see match scores." };
  const profileText = [
    profile.industry,
    profile.capabilities,
    profile.capabilityStatement,
  ]
    .filter(Boolean)
    .join(" ");
  const tenderText = [tender.title, tender.summary, tender.category].filter(Boolean).join(" ");

  const pTokens = tokenize(profileText);
  const tTokens = tokenize(tenderText);
  if (pTokens.size === 0 || tTokens.size === 0) {
    return { score: 30, rationale: "Limited profile detail to compare against." };
  }
  let overlap = 0;
  const matched: string[] = [];
  for (const tok of tTokens) {
    if (pTokens.has(tok)) {
      overlap++;
      if (matched.length < 5) matched.push(tok);
    }
  }
  const denom = Math.max(8, Math.min(40, tTokens.size));
  const raw = (overlap / denom) * 100;
  const score = Math.max(15, Math.min(98, Math.round(raw + 25)));
  const rationale = matched.length
    ? `Matched on: ${matched.join(", ")}.`
    : "Limited keyword overlap with profile capabilities.";
  return { score, rationale };
}
