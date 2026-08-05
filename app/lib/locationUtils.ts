// ── app/lib/locationUtils.ts ─────────────────────────────────────
// Shared location extraction and normalization utilities.
// Used by: app/api/geocode/route.ts, app/api/chat/route.ts,
//          app/results/page.tsx (client-side voice handling)

// ── Regional alias map ───────────────────────────────────────────
// Maps colloquial / shorthand Iowa place names → canonical geocodable string.
// Add entries here whenever a new alias is discovered in testing.
export const LOCATION_ALIASES: Record<string, string> = {
  // Quad Cities variants
  "quad cities":       "Davenport, Iowa",
  "quad city":         "Davenport, Iowa",
  "the quad cities":   "Davenport, Iowa",
  "quad cities area":  "Davenport, Iowa",
  "qc":                "Davenport, Iowa",
  "the qc":            "Davenport, Iowa",

  // Common shorthand
  "ic":                "Iowa City, Iowa",
  "iowa city area":    "Iowa City, Iowa",
  "cr":                "Cedar Rapids, Iowa",
  "cedar rapids area": "Cedar Rapids, Iowa",
  "dsm":               "Des Moines, Iowa",
  "des moines area":   "Des Moines, Iowa",
  "council bluffs area": "Council Bluffs, Iowa",
  "sioux city area":   "Sioux City, Iowa",
};

// ── Normalize a raw location string ─────────────────────────────
// Resolves aliases, appends Iowa if missing.
export function normalizeLocation(raw: string): string {
  const lower = raw.trim().toLowerCase();

  // Check alias map first
  if (LOCATION_ALIASES[lower]) return LOCATION_ALIASES[lower];

  // Partial alias match (e.g. "quad cities iowa" still maps to Davenport)
  for (const [alias, canonical] of Object.entries(LOCATION_ALIASES)) {
    if (lower.includes(alias)) return canonical;
  }

  // Append Iowa if not already present
  const hasIowa = /\biowa\b|\b,\s*ia\b/i.test(raw);
  return hasIowa ? raw.trim() : `${raw.trim()}, Iowa`;
}

// ── Extract location from a natural language string ──────────────
// Returns the best location string found, or null if none detected.
// Shared by chat/route.ts and results/page.tsx voice handler.
export function extractLocation(msg: string): string | null {
  const FALSE_POSITIVES = new Set([
    "i", "a", "the", "my", "me", "we", "us",
    "help", "care", "need", "want", "iowa",
    "show", "options", "results", "near", "area",
    "find", "me", "some", "please", "can", "you",
  ]);

  // Check full message against alias map first (handles "quad cities" before pattern matching)
  const lower = msg.trim().toLowerCase();
  for (const [alias, canonical] of Object.entries(LOCATION_ALIASES)) {
    if (lower.includes(alias)) return canonical;
  }

  const patterns = [
    // "near X", "in X", "around X", "close to X", "from X"
    /(?:near|in|around|close to|from)\s+([A-Za-z][a-zA-Z\s]{1,30}?)(?:\s*[,.]|\s+iowa|\s+ia\b|$)/i,
    // "X, Iowa" or "X, IA"
    /([A-Za-z][a-zA-Z\s]{1,30}?),?\s*Iowa/i,
    /([A-Za-z][a-zA-Z\s]{1,30}?),?\s*IA\b/i,
  ];

  for (const pattern of patterns) {
    const match = msg.match(pattern);
    if (match?.[1]) {
      const loc = match[1].trim();
      // Filter out false positives and very short words
      if (loc.length < 2) continue;
      if (FALSE_POSITIVES.has(loc.toLowerCase())) continue;
      // Multi-word false positive check
      const words = loc.toLowerCase().split(/\s+/);
      if (words.every(w => FALSE_POSITIVES.has(w))) continue;
      return normalizeLocation(loc);
    }
  }

  return null;
}

// ── Check if a Google geocode result is too vague to use ─────────
// Returns true if the result covers a whole state or country rather
// than a specific city — signals geocoding failed meaningfully.
export function isVagueGeoResult(formattedAddress: string): boolean {
  if (!formattedAddress) return true;
  const lower = formattedAddress.toLowerCase();
  // Vague: just "Iowa, USA" or "United States" with no city
  if (/^iowa,?\s*(usa|united states)?$/i.test(lower.trim())) return true;
  if (/^united states$/i.test(lower.trim())) return true;
  // Vague if no comma (city results always have commas: "Clinton, IA, USA")
  if (!formattedAddress.includes(",")) return true;
  return false;
}
