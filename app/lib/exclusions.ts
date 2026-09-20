// ── Manual exclusion list — data governance ─────────────────────────
// Purpose: filter out listings known to be wrong (closed, duplicate, moved)
// that the upstream source (HRSA, SAMHSA, VA, NPI Registry) hasn't corrected
// yet. This is the mechanism referenced in the SME-meeting data-governance
// plan: Request-Change form submission -> Jey reviews -> add an entry here
// -> redeploy. Applied once, in app/api/clinics/route.ts, so it covers every
// category and both the results page and the AI chat navigator (both read
// from that one endpoint).
//
// Matched by ADDRESS, not name: "not in service" describes a physical
// location, not a brand. If an org opens a new location, that's a new
// address and won't be caught here, which is correct -- only the specific
// closed/wrong site should be excluded.
//
// The `address` value should be pasted verbatim from wherever it was
// confirmed wrong (e.g. a reviewed Request-Change submission, which already
// captures the app's exact displayed address string) -- normalization below
// handles minor punctuation/ZIP+4 differences, not full address-parsing, so
// don't rely on it to fuzzy-match a differently-formatted address.

export interface ExclusionEntry {
  address: string;
  name?: string;      // for the audit trail only, not used for matching
  reason: string;
  addedDate: string;  // ISO date
  addedBy: string;
}

export const EXCLUDED_LISTINGS: ExclusionEntry[] = [
  {
    name: "Community Health Care, Inc. MCSA Muscatine",
    address: "312 Iowa Ave, Muscatine, IA, 52761-3836",
    reason:
      "Old MCSA location, no longer in service. HRSA's site record has not been updated to reflect the closure -- confirmed by Jen (Director of Community Health, Muscatine) and cross-checked against CHC's current active site at 1221 Park Ave, which HRSA does list separately.",
    addedDate: "2026-09-20",
    addedBy: "Jey",
  },
];

function normalizeAddress(address: string): string {
  return address
    .replace(/-\d{4}\b/, "")     // drop ZIP+4 suffix, e.g. "52761-3836" -> "52761"
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");  // strip remaining punctuation/whitespace
}

const EXCLUDED_KEYS = new Set(EXCLUDED_LISTINGS.map(e => normalizeAddress(e.address)));

export function isExcludedAddress(address: string): boolean {
  return EXCLUDED_KEYS.has(normalizeAddress(address));
}
