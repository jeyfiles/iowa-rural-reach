// ── app/lib/careIntent.ts ────────────────────────────────────────
// Single source of truth for "what kind of care is this text asking
// for" and "where". Used by: results page search box, navigator
// "Show Results" link, chat API, and clinics API — previously each had
// its own copy of these regexes and they had drifted apart (e.g. chat
// checked mental before dental, the clinics API did the opposite, and
// none of them recognised "therapist").

import { extractLocation, normalizeLocation } from "./locationUtils";

export type CareCategory =
  | "family" | "mental" | "dental" | "veteran" | "er" | "uninsured" | "chiro";

// Order matters — first match wins. Word boundaries on short tokens
// ("er", "va") so words like "teenager" or "nova" don't match.
const CARE_PATTERNS: { cat: CareCategory; re: RegExp }[] = [
  // English + Spanish keywords (the app is bilingual)
  { cat: "dental",    re: /dental|dentist|tooth|teeth|diente|muela/i },
  { cat: "chiro",     re: /chiro|spinal adjust|quiropr/i },
  { cat: "er",        re: /emergency|emergencia|\ber\b|urgent|hospital|accident|chest pain/i },
  { cat: "veteran",   re: /veteran|\bva\b|military|militar|\bvets?\b/i },
  { cat: "mental",    re: /mental|counsel|consejer|therap|terapeut|psycholog|psicolog|psychiatr|psiquiatr|social worker|depress|depresi|deprimid|anxiety|ansiedad|ptsd|substance|alcohol|grief|stress|estres/i },
  { cat: "uninsured", re: /uninsured|no insurance|sin seguro|sliding|free clinic|gratis|gratuit|low.?cost|afford/i },
  { cat: "family",    re: /doctor|medico|primary|family|familia|medicaid|checkup|check-up/i },
];

// "physical therapy", "speech therapist" etc. are not mental health.
// Stripped before matching instead of using a regex lookbehind, which
// older iPhone Safari versions can't parse (would crash the page).
const NON_MENTAL_THERAPY = /\b(physical|occupational|speech|massage)\s+therap\w*/gi;

export function detectCare(text: string): CareCategory | null {
  const t = (text || "").replace(NON_MENTAL_THERAPY, " ");
  for (const { cat, re } of CARE_PATTERNS) {
    if (re.test(t)) return cat;
  }
  return null;
}

// "near me" style phrases → use the device location, not a typed place.
export const NEAR_ME_RE =
  /\b(near me|nearby|close to me|close by|around me|my location|my area|cerca de mi|cerca)\b/i;

// Words that are never a place name on their own.
const FILLER = new Set([
  "i", "a", "an", "the", "my", "me", "we", "us", "our", "for", "to", "of",
  "and", "or", "with", "need", "needs", "want", "looking", "find", "finding",
  "show", "get", "help", "please", "can", "you", "some", "any", "local",
  "near", "nearby", "around", "close", "by", "in", "at", "area", "care",
  "clinic", "clinics", "health", "center", "centers", "provider", "providers",
  "options", "results", "services", "service", "best", "good", "cheap",
  "open", "now", "today", "location", "iowa", "ia", "who", "takes", "accepts",
  "insurance", "physical", "therapy", "my", "child", "kid", "kids", "teen",
  "teens", "son", "daughter", "mom", "dad",
  // pronouns / verbs / people — so "counselor for my teenager" doesn't
  // treat "teenager" as a town
  "teenager", "teenagers", "children", "baby", "someone", "somebody",
  "person", "people", "student", "students", "man", "woman", "boy", "girl",
  "he", "she", "they", "it", "is", "am", "are", "be", "have", "has", "had",
  "no", "not", "very", "really", "just", "feel", "feeling", "sick", "pain",
  "where", "what", "how", "there", "here", "this", "that", "new", "patient",
  "patients", "appointment", "visit", "doctors", "close", "when", "your", "why",
  "free", "low", "cost", "scale", "sliding",
  "yes", "ok", "okay", "thanks", "thank", "sure", "hi", "hello", "hey",
  "back", "neck", "knee", "shoulder", "head", "headache", "tooth", "ache",
  // Spanish filler
  "necesito", "busco", "quiero", "un", "una", "el", "la", "los", "las", "de",
  "del", "en", "para", "mi", "mis", "cerca", "por", "favor", "ayuda", "salud",
  "atencion", "clinica", "seguro", "sin", "y", "con", "que",
]);

export interface ParsedSearch {
  care:   CareCategory | null;
  place:  string | null;   // normalized, geocodable ("Clinton, Iowa", "52761, Iowa")
  nearMe: boolean;
}

// strict = true → only explicit place patterns ("in Clinton", "Ames, Iowa",
// a ZIP). Use for full chat sentences, where "whatever is left over" would
// turn "I am feeling sad" into a place name. Search-box input is short, so
// the leftover rule (max 3 words) is allowed there.
export function parseSearch(text: string, strict = false): ParsedSearch {
  const raw    = (text || "").trim();
  const care   = detectCare(raw);
  const nearMe = NEAR_ME_RE.test(raw);
  if (!raw) return { care, place: null, nearMe };

  // 1. ZIP code anywhere in the text
  const zip = raw.match(/\b\d{5}\b/);
  if (zip) return { care, place: normalizeLocation(zip[0]), nearMe: false };

  // 2. Explicit pattern: Spanish "cerca de Clinton" / "en Ames" first (the
  //    shared extractor's "X, Iowa" rule would otherwise grab the whole
  //    sentence), then "in Clinton", "near Davenport", "Ames, Iowa", aliases
  const es = raw.match(/(?:cerca de|en)\s+([A-Za-z][A-Za-z\s]{1,30}?)(?:\s*[,.?!]|\s+iowa\b|\s+ia\b|$)/i);
  if (es?.[1] && !isOnlyCareOrFiller(es[1])) {
    return { care, place: normalizeLocation(es[1].trim()), nearMe: false };
  }
  const explicit = extractLocation(raw);
  if (explicit && !isOnlyCareOrFiller(explicit)) {
    return { care, place: explicit, nearMe: false };
  }

  // 3. Whatever is left after removing care words and filler
  //    ("dentist clinton" → "clinton"; "local therapists" → nothing)
  const leftover = raw
    .replace(NON_MENTAL_THERAPY, " ")
    .split(/[\s,.!?]+/)
    .filter(w => w && !FILLER.has(w.toLowerCase()) && !detectCare(w))
    .join(" ")
    .trim();

  if (!strict && leftover && !nearMe && leftover.split(" ").length <= 3) {
    return { care, place: normalizeLocation(leftover), nearMe };
  }
  return { care, place: null, nearMe };
}

function isOnlyCareOrFiller(s: string): boolean {
  const words = s.replace(/,?\s*iowa$/i, "").split(/\s+/).filter(Boolean);
  return words.every(w => FILLER.has(w.toLowerCase()) || !!detectCare(w));
}
