import { NextRequest, NextResponse } from "next/server";
import { isExcludedAddress } from "../../lib/exclusions";
import { detectCare, CareCategory } from "../../lib/careIntent";

// ── Types ────────────────────────────────────────────────────────
interface ClinicResult {
  id:         string;
  name:       string;
  address:    string;
  phone:      string;
  distance:   string;
  // true/false only when the source actually tells us; null = unknown
  // (no hours data) → UI shows no Open badge rather than guessing.
  open:       boolean | null;
  type:       "family" | "mental" | "dental" | "veteran" | "er" | "uninsured" | "chiro";
  insurance:  string[];
  services:   string[];
  telehealth: boolean;
  sliding:    boolean;
  lat:        number;
  lng:        number;
  source:     string;
}

// ── Distance helper ──────────────────────────────────────────────
function calcDistance(lat1: number, lng1: number, lat2: number, lng2: number): string {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  const miles = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return miles < 1 ? "< 1 mi" : `${miles.toFixed(1)} mi`;
}

// ── Format phone ────────────────────────────────────────────────
function formatPhone(raw: string): string {
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10)
    return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
  if (digits.length === 11 && digits[0] === "1")
    return `(${digits.slice(1,4)}) ${digits.slice(4,7)}-${digits.slice(7)}`;
  return raw;
}

// ── 1. HRSA Data Warehouse Locator API — FQHCs (family care + uninsured) ──
// CHANGED 2026-09-11: was onemap.cdc.gov (CDC's periodic mirror of HRSA's
// site file). That mirror was confirmed stale — e.g. for Muscatine, IA it
// still listed "Community Health Care, Inc. Muscatine Clinic" (2925 Cedar
// St) as Active and was missing "...Muscatine New Building" (1221 Park Ave)
// entirely. This endpoint is the same live source that backs HRSA's own
// public "Find a Health Center" tool (findahealthcenter.hrsa.gov), so
// results match what HRSA itself currently shows. It also returns results
// pre-sorted by distance with no arbitrary record cap, unlike the old
// ArcGIS query (which capped at 25 results in non-distance order).
//
// TRADE-OFF: this API's response is leaner than the old CDC feed — it has
// no grant-type flags (no way to tell "family" vs "uninsured" per site, no
// homeless/migrant/school-based service flags), and there's no shared key
// to safely merge it with the old feed for that metadata (this API's `Id`
// and the CDC feed's `Health_Center_Number` don't correspond). So every
// result below defaults to type "family" with a generic FQHC service list.
// This does NOT change filtering behavior: app/results/page.tsx's
// "uninsured" filter already matches `type === "uninsured" || (type ===
// "family" && sliding)`, and `sliding` stays true for every FQHC result
// exactly as it was before — so uninsured/sliding-scale search results are
// unaffected. `insurance` was already a static list, not derived from the
// feed, so that's unchanged too. The only visible difference is that some
// cards that used to show a "No Insurance" badge will now show "Family
// Care" instead — a label difference, not a functional one.
async function fetchFQHCs(lat: number, lng: number): Promise<ClinicResult[]> {
  try {
    const url = `https://data.hrsa.gov/HDWLocatorApi/healthcenters/find?lon=${lng}&lat=${lat}&radius=40`;

    const res = await fetch(url, {
      headers: { "Accept": "application/json" },
      next: { revalidate: 3600 },
    });

    if (!res.ok) { console.error("HRSA HDWLocatorApi response not OK:", res.status); return []; }

    const data = await res.json();
    if (!Array.isArray(data) || !data.length) return [];

    // EndDt set = HRSA says this site has closed → drop it entirely.
    return data.filter((r: any) => r.EndDt == null).slice(0, 30).map((r: any, i: number) => {
      const rLat = typeof r.Latitude  === "number" ? r.Latitude  : lat;
      const rLng = typeof r.Longitude === "number" ? r.Longitude : lng;
      const dist = typeof r.Distance === "number"
        ? (r.Distance < 1 ? "< 1 mi" : `${r.Distance.toFixed(1)} mi`)
        : calcDistance(lat, lng, rLat, rLng);

      return {
        id:        `fqhc-${r.Id ?? i}`,
        name:      r.CtrNm || "Community Health Center",
        address:   [r.CtrAddress, r.CtrCity, r.CtrStateAbbr, r.CtrZipCd].filter(Boolean).join(", "),
        phone:     formatPhone(r.CtrPhoneNum || ""),
        distance:  dist,
        open:      null,
        type:      "family" as const,
        insurance: ["Medicaid", "Medicare", "Uninsured OK", "Sliding Scale"],
        services:  ["Primary Care", "Preventive Care", "Immunizations"],
        telehealth: false,
        sliding:    true,
        lat:        rLat,
        lng:        rLng,
        source:     "HRSA Data Warehouse",
      };
    });
  } catch (err) {
    console.error("HRSA FQHC fetch error:", err);
    return [];
  }
}

// ── 2. SAMHSA FindTreatment — Mental health ──────────────────────
async function fetchMentalHealth(lat: number, lng: number): Promise<ClinicResult[]> {
  try {
    const url = [
      "https://findtreatment.gov/locator/exportsAsJson/v2",
      `?sAddr=${lat},${lng}`,
      `&limitType=2`,
      `&limitValue=80467`,
      `&pageSize=20`,
      `&page=1`,
      `&sort=0`,
    ].join("");

    const res = await fetch(url, {
      headers: { "Accept": "application/json" },
      next: { revalidate: 3600 },
    });

    if (!res.ok) { console.error("SAMHSA response not OK:", res.status); return []; }

    const data = await res.json();
    if (!data.rows?.length) return [];

    return data.rows.map((r: any, i: number) => {
      const rLat = parseFloat(r.latitude)  || lat;
      const rLng = parseFloat(r.longitude) || lng;
      return {
        id:        `samhsa-${i}-${r.rowNumber || i}`,
        name:      r.name1 || "Mental Health Center",
        address:   `${r.street1 || ""}, ${r.city || ""}, ${r.state || "IA"} ${r.zip || ""}`.trim(),
        phone:     formatPhone(r.phone || ""),
        distance:  calcDistance(lat, lng, rLat, rLng),
        open:      null,
        type:      "mental" as const,
        insurance: [
          ...(r.paymentOptions?.includes("MD") ? ["Medicaid"] : []),
          ...(r.paymentOptions?.includes("MI") ? ["Medicare"] : []),
          ...(r.paymentOptions?.includes("SF") ? ["Sliding Scale"] : []),
        ],
        services: [
          "Mental Health Counseling",
          ...(r.services?.includes("MH") ? ["Psychiatric Services"] : []),
          ...(r.services?.includes("SA") ? ["Substance Use Treatment"] : []),
          "Crisis Support",
        ],
        telehealth: r.telehealth === "Y" || false,
        sliding:    r.paymentOptions?.includes("SF") || false,
        lat:        rLat,
        lng:        rLng,
        source:     "SAMHSA",
      };
    });
  } catch (err) {
    console.error("SAMHSA fetch error:", err);
    return [];
  }
}

// ── 3. VA Facilities API ─────────────────────────────────────────
async function fetchVAFacilities(lat: number, lng: number): Promise<ClinicResult[]> {
  try {
    const vaKey = process.env.VA_API_KEY;
    if (!vaKey) { console.error("VA API key not configured"); return []; }

    const url = [
      "https://sandbox-api.va.gov/services/va_facilities/v1/facilities",
      `?lat=${lat}&long=${lng}`,
      `&radius=80`,
      `&type=health`,
      `&per_page=20&page=1`,
    ].join("");

    const res = await fetch(url, {
      headers: { "apikey": vaKey, "Accept": "application/json" },
      next: { revalidate: 3600 },
    });

    if (!res.ok) { console.error("VA response not OK:", res.status); return []; }

    const data = await res.json();
    if (!data.data?.length) return [];

    return data.data.map((f: any, i: number) => {
      const attr = f.attributes;
      const fLat = attr.lat  || lat;
      const fLng = attr.long || lng;
      return {
        id:        `va-${f.id || i}`,
        name:      attr.name || "VA Facility",
        address:   [
          attr.address?.physical?.address1,
          attr.address?.physical?.city,
          attr.address?.physical?.state,
          attr.address?.physical?.zip,
        ].filter(Boolean).join(", "),
        phone:     formatPhone(attr.phone?.main || ""),
        distance:  calcDistance(lat, lng, fLat, fLng),
        open:      attr.operatingStatus?.code === "CLOSED" ? false : null,
        type:      "veteran" as const,
        // Source doesn't list payers; VA generally can't bill Medicare and
        // Tricare acceptance varies by facility — so only VA Benefits.
        insurance: ["VA Benefits"],
        services:  [
          "Veterans Primary Care",
          ...(attr.services?.health?.map((s: any) => s.name) || []).slice(0, 4),
        ],
        telehealth: attr.services?.health?.some(
          (s: any) => s.name?.toLowerCase().includes("telehealth")
        ) || true,
        sliding:   false,
        lat:       fLat,
        lng:       fLng,
        source:    "VA",
      };
    });
  } catch (err) {
    console.error("VA fetch error:", err);
    return [];
  }
}

// ── 4. Iowa Hospitals — real IDPH data ──────────────────────────
const IOWA_HOSPITALS = [
  { name: "University of Iowa Hospitals & Clinics",  address: "200 Hawkins Dr, Iowa City, IA 52242",        phone: "(319) 356-1616", lat: 41.6611, lng: -91.5302 },
  { name: "MercyOne Des Moines Medical Center",      address: "1111 6th Ave, Des Moines, IA 50314",         phone: "(515) 247-3121", lat: 41.5912, lng: -93.6335 },
  { name: "UnityPoint Health Iowa Methodist",        address: "1200 Pleasant St, Des Moines, IA 50309",     phone: "(515) 241-6212", lat: 41.5868, lng: -93.6250 },
  { name: "St. Luke's Hospital Cedar Rapids",        address: "1026 A Ave NE, Cedar Rapids, IA 52402",      phone: "(319) 369-7211", lat: 41.9779, lng: -91.6502 },
  { name: "MercyOne Cedar Rapids Medical Center",    address: "701 10th St SE, Cedar Rapids, IA 52403",     phone: "(319) 398-6011", lat: 41.9651, lng: -91.6434 },
  { name: "Genesis Medical Center Davenport",        address: "1227 E Rusholme St, Davenport, IA 52803",    phone: "(563) 421-1000", lat: 41.5236, lng: -90.5528 },
  { name: "UnityPoint Health Trinity Muscatine",     address: "1518 Mulberry Ave, Muscatine, IA 52761",     phone: "(563) 264-9100", lat: 41.4198, lng: -91.0512 },
  { name: "MercyOne Dubuque Medical Center",         address: "250 Mercy Dr, Dubuque, IA 52001",            phone: "(563) 589-8000", lat: 42.4967, lng: -90.6646 },
  { name: "Iowa City VA Medical Center",             address: "601 Hwy 6 W, Iowa City, IA 52246",           phone: "(319) 338-0581", lat: 41.6636, lng: -91.5486 },
  { name: "UnityPoint Health Allen Hospital",        address: "1825 Logan Ave, Waterloo, IA 50703",         phone: "(319) 235-3941", lat: 42.4928, lng: -92.3426 },
  { name: "MercyOne Waterloo Medical Center",        address: "400 Parrott St, Waterloo, IA 50703",         phone: "(319) 272-8000", lat: 42.5008, lng: -92.3355 },
  { name: "MercyOne Sioux City Medical Center",      address: "801 5th St, Sioux City, IA 51101",           phone: "(712) 279-2010", lat: 42.4999, lng: -96.4003 },
  { name: "UnityPoint Health St. Luke's Sioux City", address: "2720 Stone Park Blvd, Sioux City, IA 51104", phone: "(712) 279-3500", lat: 42.5201, lng: -96.3852 },
  { name: "MercyOne North Iowa Medical Center",      address: "1000 4th St SW, Mason City, IA 50401",       phone: "(641) 428-7000", lat: 43.1536, lng: -93.2010 },
  { name: "UnityPoint Health Meriter Burlington",    address: "800 E Burlington Ave, Burlington, IA 52601",  phone: "(319) 753-3011", lat: 40.8073, lng: -91.1126 },
  { name: "Lee County Regional Medical Center",      address: "1316 S Main St, Keokuk, IA 52632",           phone: "(319) 524-7150", lat: 40.3975, lng: -91.3846 },
  { name: "MercyOne Clinton Medical Center",         address: "1410 N 4th St, Clinton, IA 52732",           phone: "(563) 244-5555", lat: 41.8447, lng: -90.1887 },
  { name: "MercyOne Ottumwa Medical Center",         address: "1001 Pennsylvania Ave, Ottumwa, IA 52501",   phone: "(641) 684-2300", lat: 41.0200, lng: -92.4113 },
  { name: "UnityPoint Health Fort Dodge",            address: "802 Kenyon Rd, Fort Dodge, IA 50501",        phone: "(515) 574-6100", lat: 42.4975, lng: -94.1680 },
  { name: "MercyOne Ames Medical Center",            address: "1111 Duff Ave, Ames, IA 50010",              phone: "(515) 239-2011", lat: 42.0308, lng: -93.6319 },
];

async function fetchERs(lat: number, lng: number): Promise<ClinicResult[]> {
  return IOWA_HOSPITALS
    .map((h, i) => ({
      id:        `er-${i}-${h.name.slice(0,8).replace(/\W/g,'')}`,
      name:      h.name,
      address:   h.address,
      phone:     h.phone,
      distance:  calcDistance(lat, lng, h.lat, h.lng),
      open:      null,
      type:      "er" as const,
      // Federal law (EMTALA) requires ERs to screen/stabilize regardless of
      // ability to pay. Payer list isn't in our data, so nothing else shown.
      insurance: ["Emergency — all patients treated"],
      services:  ["Emergency Care", "Urgent Care", "Trauma"],
      telehealth: false,
      sliding:   false,
      lat:       h.lat,
      lng:       h.lng,
      source:    "Iowa IDPH",
    }))
    .sort((a, b) => {
      const dA = parseFloat(a.distance.replace(/[^0-9.]/g, "")) || 999;
      const dB = parseFloat(b.distance.replace(/[^0-9.]/g, "")) || 999;
      return dA - dB;
    })
    .slice(0, 10);
}

// ── 5. NPI Registry — Dental + Chiropractic providers ───────────
// Shared fetcher for NPI-based categories (same public CMS registry).
// Uses city-center coordinates (NPI has no lat/lng) so distances are
// approximate to the city, deterministic, and stable between the
// results page and the AI chat.
// Prefers organization_name, then "Dr. First Last, CRED" for solo practitioners.
interface NpiCategory {
  taxonomy:   string;                 // NPI taxonomy_description filter value
  type:       "dental" | "chiro";
  idPrefix:   string;
  defaultCred: string;
  fallbackName: string;
  services:   string[];
}

const NPI_DENTAL: NpiCategory = {
  taxonomy: "Dentist", type: "dental", idPrefix: "dental", defaultCred: "DDS",
  fallbackName: "Dental Clinic",
  services: ["General Dentistry", "Cleanings", "X-Rays", "Emergency Dental"],
};

const NPI_CHIRO: NpiCategory = {
  taxonomy: "Chiropractor", type: "chiro", idPrefix: "chiro", defaultCred: "DC",
  fallbackName: "Chiropractic Clinic",
  services: ["Chiropractic Care"],
};

// NPI "practice location" for individuals is self-reported and is
// sometimes a home address. Skip anything that looks residential.
const RESIDENTIAL_RE = /\b(apt|apartment|lot|trlr|trailer)\b/i;

async function fetchNpi(cfg: NpiCategory, lat: number, lng: number): Promise<ClinicResult[]> {
  try {
    const iowaCities = getCitiesNear(lat, lng);
    const results: ClinicResult[] = [];

    for (const city of iowaCities.slice(0, 3)) {
      try {
        const url = [
          "https://npiregistry.cms.hhs.gov/api/",
          `?version=2.1`,
          `&state=IA`,
          `&city=${encodeURIComponent(city)}`,
          `&taxonomy_description=${encodeURIComponent(cfg.taxonomy)}`,
          `&limit=10`,
          `&skip=0`,
        ].join("");

        const res = await fetch(url, {
          headers: { "Accept": "application/json" },
          next: { revalidate: 3600 },
        });

        if (!res.ok) continue;
        const data = await res.json();
        if (!data.results?.length) continue;

        const cityCoords = IOWA_CITY_COORDS[city.toUpperCase()] || { lat, lng };

        for (const [i, p] of data.results.entries()) {
          const loc = p.addresses?.find((a: any) => a.address_purpose === "LOCATION")
                   || p.addresses?.[0];
          if (!loc) continue;
          if (RESIDENTIAL_RE.test(`${loc.address_1 || ""} ${loc.address_2 || ""}`)) continue;

          const orgName    = p.basic?.organization_name?.trim();
          const firstName  = p.basic?.first_name?.trim() || "";
          const lastName   = p.basic?.last_name?.trim() || "";
          const credential = p.basic?.credential?.trim() || cfg.defaultCred;
          const name = orgName
            || (lastName ? `Dr. ${firstName} ${lastName}, ${credential}`.trim() : cfg.fallbackName);

          // Small index-based offset to spread pins slightly without randomness
          const offset = (i * 0.003) - 0.015;
          const dLat = cityCoords.lat + offset;
          const dLng = cityCoords.lng + offset;

          results.push({
            id:        `${cfg.idPrefix}-${city}-${i}-${p.number || i}`,
            name,
            address:   [
              loc.address_1,
              loc.city,
              loc.state,
              loc.postal_code?.slice(0, 5),
            ].filter(Boolean).join(", "),
            phone:     formatPhone(loc.telephone_number || ""),
            distance:  calcDistance(lat, lng, dLat, dLng),
            open:      null,           // NPI has no hours
            type:      cfg.type,
            insurance: [],             // NPI has no payer data → UI shows "Call to ask"
            services:  cfg.services,
            telehealth: false,
            sliding:    false,
            lat:        dLat,
            lng:        dLng,
            source:     "NPI Registry",
          });
        }
      } catch {
        continue;
      }
    }

    return results.sort((a, b) => {
      const dA = parseFloat(a.distance.replace(/[^0-9.]/g, "")) || 999;
      const dB = parseFloat(b.distance.replace(/[^0-9.]/g, "")) || 999;
      return dA - dB;
    });

  } catch (err) {
    console.error(`NPI ${cfg.taxonomy} fetch error:`, err);
    return [];
  }
}

const fetchDental = (lat: number, lng: number) => fetchNpi(NPI_DENTAL, lat, lng);
const fetchChiro  = (lat: number, lng: number) => fetchNpi(NPI_CHIRO,  lat, lng);

// ── Iowa city coordinate lookup ──────────────────────────────────
const IOWA_CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  "MUSCATINE":      { lat: 41.4245, lng: -91.0432 },
  "IOWA CITY":      { lat: 41.6611, lng: -91.5302 },
  "DAVENPORT":      { lat: 41.5236, lng: -90.5776 },
  "BETTENDORF":     { lat: 41.5245, lng: -90.5157 }, // Quad Cities Iowa side
  "CLINTON":        { lat: 41.8442, lng: -90.1887 }, // IA-01 district city
  "CEDAR RAPIDS":   { lat: 41.9779, lng: -91.6656 },
  "DES MOINES":     { lat: 41.5868, lng: -93.6250 },
  "DUBUQUE":        { lat: 42.4967, lng: -90.6646 },
  "WATERLOO":       { lat: 42.4928, lng: -92.3426 },
  "SIOUX CITY":     { lat: 42.4999, lng: -96.4003 },
  "BURLINGTON":     { lat: 40.8073, lng: -91.1126 },
  "OTTUMWA":        { lat: 41.0200, lng: -92.4113 },
  "FORT DODGE":     { lat: 42.4975, lng: -94.1680 },
  "MASON CITY":     { lat: 43.1536, lng: -93.2010 },
  "AMES":           { lat: 42.0308, lng: -93.6319 },
  "WAUKEE":         { lat: 41.6105, lng: -93.8883 },
  "ANKENY":         { lat: 41.7317, lng: -93.6001 },
  "COUNCIL BLUFFS": { lat: 41.2619, lng: -95.8608 },
  "CORALVILLE":     { lat: 41.6761, lng: -91.5640 },
  "TIPTON":         { lat: 41.7697, lng: -91.1254 },
  "DECORAH":        { lat: 43.3036, lng: -91.7857 },
  "KEOKUK":         { lat: 40.3975, lng: -91.3846 },
  "MARION":         { lat: 42.0341, lng: -91.5977 },
  "MAQUOKETA":      { lat: 42.0686, lng: -90.6657 },
};

function getCitiesNear(lat: number, lng: number): string[] {
  return Object.entries(IOWA_CITY_COORDS)
    .map(([city, coords]) => ({
      city,
      dist: Math.sqrt((coords.lat - lat) ** 2 + (coords.lng - lng) ** 2),
    }))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, 5)
    .map(e => e.city);
}

// ── Main route ───────────────────────────────────────────────────
// Params: lat, lng (required — no default location), and either
//   cat   = family|mental|dental|veteran|er|uninsured|chiro  (preferred)
//   query = free text, mapped to a category via lib/careIntent
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat   = parseFloat(searchParams.get("lat") || "");
  const lng   = parseFloat(searchParams.get("lng") || "");
  const query = (searchParams.get("query") || "").toLowerCase();
  const catQ  = searchParams.get("cat") || "";

  if (!isFinite(lat) || !isFinite(lng)) {
    return NextResponse.json({ error: "lat and lng are required" }, { status: 400 });
  }

  const VALID: CareCategory[] = ["family", "mental", "dental", "veteran", "er", "uninsured", "chiro"];
  const cat: CareCategory | null =
    (VALID as string[]).includes(catQ) ? (catQ as CareCategory) : detectCare(query);

  try {
    let fqhcResults:   ClinicResult[] = [];
    let mentalResults: ClinicResult[] = [];
    let vaResults:     ClinicResult[] = [];
    let erResults:     ClinicResult[] = [];
    let dentalResults: ClinicResult[] = [];
    let chiroResults:  ClinicResult[] = [];

    if (cat === "dental") {
      dentalResults = await fetchDental(lat, lng);
    } else if (cat === "chiro") {
      chiroResults = await fetchChiro(lat, lng);
    } else if (cat === "er") {
      erResults = await fetchERs(lat, lng);
    } else if (cat === "veteran") {
      vaResults = await fetchVAFacilities(lat, lng);
    } else if (cat === "mental") {
      mentalResults = await fetchMentalHealth(lat, lng);
    } else if (cat === "uninsured" || cat === "family") {
      fqhcResults = await fetchFQHCs(lat, lng);
    } else {
      const [fqhcs, mental, va, ers] = await Promise.allSettled([
        fetchFQHCs(lat, lng),
        fetchMentalHealth(lat, lng),
        fetchVAFacilities(lat, lng),
        fetchERs(lat, lng),
      ]);
      fqhcResults   = fqhcs.status   === "fulfilled" ? fqhcs.value   : [];
      mentalResults = mental.status  === "fulfilled" ? mental.value  : [];
      vaResults     = va.status      === "fulfilled" ? va.value      : [];
      erResults     = ers.status     === "fulfilled" ? ers.value     : [];
    }

    const all = [...fqhcResults, ...mentalResults, ...vaResults, ...erResults, ...dentalResults, ...chiroResults];

    all.sort((a, b) => {
      const dA = parseFloat(a.distance.replace(/[^0-9.]/g, "")) || 999;
      const dB = parseFloat(b.distance.replace(/[^0-9.]/g, "")) || 999;
      return dA - dB;
    });

    const seen = new Set<string>();
    const deduped = all
      .filter(c => {
        const key = c.name.toLowerCase().slice(0, 20) + c.lat.toFixed(2);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      // Data-governance exclusion list -- see app/lib/exclusions.ts.
      // Filters known-wrong listings (closed/duplicate/moved) that the
      // upstream source hasn't corrected yet. Covers every category and
      // both the results page and the AI chat navigator, since both read
      // from this one endpoint.
      .filter(c => !isExcludedAddress(c.address));

    return NextResponse.json({
      clinics: deduped,
      count:   deduped.length,
      sources: {
        fqhc:   fqhcResults.length,
        mental: mentalResults.length,
        va:     vaResults.length,
        er:     erResults.length,
        dental: dentalResults.length,
        chiro:  chiroResults.length,
      },
    });

  } catch (err) {
    console.error("Clinics API error:", err);
    return NextResponse.json({ error: "Failed to fetch clinics" }, { status: 500 });
  }
}
