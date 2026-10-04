// ── app/lib/storedLocation.ts ────────────────────────────────────
// The city/ZIP the user gave once, remembered for this browser tab
// (sessionStorage) and shared by the results page and the AI chat, so
// "dentist near me" after picking Cedar Rapids uses Cedar Rapids instead
// of asking again. Cleared automatically when the tab is closed.

export interface StoredLoc { lat: number; lng: number; label: string; }

const LOC_KEY = "rrLoc";

export function readStoredLoc(): StoredLoc | null {
  try {
    const raw = sessionStorage.getItem(LOC_KEY);
    if (!raw) return null;
    const l = JSON.parse(raw);
    return typeof l?.lat === "number" && typeof l?.lng === "number"
      ? { lat: l.lat, lng: l.lng, label: String(l.label || "") }
      : null;
  } catch { return null; }
}

export function writeStoredLoc(l: StoredLoc) {
  try { sessionStorage.setItem(LOC_KEY, JSON.stringify(l)); } catch { /* private mode etc. */ }
}
