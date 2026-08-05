import { NextRequest, NextResponse } from "next/server";

// ── Types ────────────────────────────────────────────────────────
interface ClinicResult {
  id:         string;
  name:       string;
  address:    string;
  phone:      string;
  distance:   string;
  open:       boolean;
  type:       "family" | "mental" | "dental" | "veteran" | "er" | "uninsured";
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

// ── 1. CDC OneMap — FQHCs (family care + uninsured) ──────────────
async function fetchFQHCs(lat: number, lng: number): Promise<ClinicResult[]> {
  try {
    const bbox = `${lng - 1},${lat - 1},${lng + 1},${lat + 1}`;
    const url = [
      "https://onemap.cdc.gov/onemapservices/rest/services/NCCDPHP/CDC_hospitals/MapServer/2/query",
      `?where=1%3D1`,
      `&geometry=${encodeURIComponent(bbox)}`,
      `&geometryType=esriGeometryEnvelope`,
      `&inSR=4326`,
      `&spatialRel=esriSpatialRelIntersects`,
      `&outFields=*`,
      `&outSR=4326`,
      `&returnGeometry=true`,
      `&resultRecordCount=25`,
      `&f=json`,
    ].join("");

    const res = await fetch(url, {
      headers: { "Accept": "application/json" },
      next: { revalidate: 3600 },
    });

    if (!res.ok) return [];
    const data = await res.json();
    if (!data.features?.length) return [];

    return data.features.map((f: any, i: number) => {
      const a    = f.attributes;
      const fLng = a.Geocoding_Artifact_Address_Prim || f.geometry?.x || lng;
      const fLat = a.Geocoding_Artifact_Address_Pr_1 || f.geometry?.y || lat;

      return {
        id:       `fqhc-${i}-${a.Health_Center_Number}-${(a.Site_Name || '').slice(0,8).replace(/\W/g,'')}`,
        name:      a.Site_Name || a.Health_Center_Name || "Community Health Center",
        address:   [a.Site_Address, a.Site_City, a.Site_State_Abbreviation, a.Site_Postal_Code].filter(Boolean).join(", "),
        phone:     formatPhone(a.Site_Telephone_Number || ""),
        distance:  calcDistance(lat, lng, fLat, fLng),
        open:      a.Site_Status_Description === "Active",
        type:      a.Community_Health_HRSA_Grant_Sub === "Y" ? "family" as const : "uninsured" as const,
        insurance: ["Medicaid", "Medicare", "Uninsured OK", "Sliding Scale"],
        services:  [
          "Primary Care", "Preventive Care", "Immunizations",
          ...(a.Health_Care_for_the_Homeless_HR === "Y" ? ["Homeless Services"] : []),
          ...(a.Migrant_Health_Centers_HRSA_Gra === "Y" ? ["Migrant Health"] : []),
          ...(a.School_Based_Health_Center_HRSA === "Y" ? ["School-Based Care"] : []),
        ],
        telehealth: false,
        sliding:    true,
        lat:        fLat,
        lng:        fLng,
        source:     "HRSA/CDC",
      };
    });
  } catch (err) {
    console.error("FQHC fetch error:", err);
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
        open:      true,
        type:      "mental" as const,
        insurance: [
          ...(r.paymentOptions?.includes("MD") ? ["Medicaid"] : []),
          ...(r.paymentOptions?.includes("MI") ? ["Medicare"] : []),
          ...(r.paymentOptions?.includes("SF") ? ["Sliding Scale"] : []),
          "Self Pay",
        ].filter(Boolean),
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
        open:      attr.operatingStatus?.code === "NORMAL",
        type:      "veteran" as const,
        insurance: ["VA Benefits", "Medicare", "Tricare"],
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
      open:      true,
      type:      "er" as const,
      insurance: ["Medicaid", "Medicare", "Most Insurance", "Emergency — all patients treated"],
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

// ── 5. NPI Registry — Dental providers ──────────────────────────
// KEY FIX: Use city center coordinates directly — no Math.random()
// This ensures AI first result matches results page first result
// Also prefer organization_name, then "Dr. LastName" format for solo practitioners
async function fetchDental(lat: number, lng: number): Promise<ClinicResult[]> {
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
          `&taxonomy_description=Dentist`,
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

        // Use city center coordinates — deterministic, no random offset
        // This ensures distance sorting is stable and AI matches results page
        const cityCoords = IOWA_CITY_COORDS[city.toUpperCase()] || { lat, lng };

        for (const [i, p] of data.results.entries()) {
          const loc = p.addresses?.find((a: any) => a.address_purpose === "LOCATION")
                   || p.addresses?.[0];
          if (!loc) continue;

          // Name: prefer org name, then "Dr. FirstName LastName" format
          // This avoids showing bare "Benjamin Clove" with no context
          const orgName  = p.basic?.organization_name?.trim();
          const firstName = p.basic?.first_name?.trim() || "";
          const lastName  = p.basic?.last_name?.trim() || "";
          const credential = p.basic?.credential?.trim() || "DDS";
          const name = orgName
            || (lastName ? `Dr. ${firstName} ${lastName}, ${credential}`.trim() : "Dental Clinic");

          // Use city center lat/lng — deterministic distance
          // Small index-based offset to spread pins slightly without randomness
          const offset = (i * 0.003) - 0.015;
          const dLat = cityCoords.lat + offset;
          const dLng = cityCoords.lng + offset;

          results.push({
            id:        `dental-${city}-${i}-${p.number || i}`,
            name,
            address:   [
              loc.address_1,
              loc.city,
              loc.state,
              loc.postal_code?.slice(0, 5),
            ].filter(Boolean).join(", "),
            phone:     formatPhone(loc.telephone_number || ""),
            distance:  calcDistance(lat, lng, dLat, dLng),
            open:      true,
            type:      "dental" as const,
            insurance: ["Medicaid", "Medicare", "Most Insurance", "Self Pay"],
            services:  ["General Dentistry", "Cleanings", "X-Rays", "Emergency Dental"],
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

    // Sort by distance — now stable since no random coordinates
    return results.sort((a, b) => {
      const dA = parseFloat(a.distance.replace(/[^0-9.]/g, "")) || 999;
      const dB = parseFloat(b.distance.replace(/[^0-9.]/g, "")) || 999;
      return dA - dB;
    });

  } catch (err) {
    console.error("Dental fetch error:", err);
    return [];
  }
}

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
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat   = parseFloat(searchParams.get("lat")  || "41.4245");
  const lng   = parseFloat(searchParams.get("lng")  || "-91.0432");
  const query = (searchParams.get("query") || "").toLowerCase();

  const wantsVet       = /veteran|va\b|military|vets/i.test(query);
  const wantsMental    = /mental|counsel|depress|anxiety|ptsd|substance|alcohol/i.test(query);
  const wantsDental    = /dental|dentist|tooth|teeth/i.test(query);
  const wantsER        = /emergency|er\b|urgent|hospital|accident|chest pain/i.test(query);
  const wantsFamily    = /doctor|primary|family|medicaid/i.test(query);
  const wantsUninsured = /uninsured|no insurance|sliding|free clinic|low cost|low-cost|afford/i.test(query);

  try {
    let fqhcResults:   ClinicResult[] = [];
    let mentalResults: ClinicResult[] = [];
    let vaResults:     ClinicResult[] = [];
    let erResults:     ClinicResult[] = [];
    let dentalResults: ClinicResult[] = [];

    if (wantsDental) {
      dentalResults = await fetchDental(lat, lng);
    } else if (wantsER) {
      erResults = await fetchERs(lat, lng);
    } else if (wantsVet) {
      vaResults = await fetchVAFacilities(lat, lng);
    } else if (wantsMental) {
      mentalResults = await fetchMentalHealth(lat, lng);
    } else if (wantsUninsured || wantsFamily) {
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

    let all = [...fqhcResults, ...mentalResults, ...vaResults, ...erResults, ...dentalResults];

    all.sort((a, b) => {
      const dA = parseFloat(a.distance.replace(/[^0-9.]/g, "")) || 999;
      const dB = parseFloat(b.distance.replace(/[^0-9.]/g, "")) || 999;
      return dA - dB;
    });

    const seen = new Set<string>();
    const deduped = all.filter(c => {
      const key = c.name.toLowerCase().slice(0, 20) + c.lat.toFixed(2);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return NextResponse.json({
      clinics: deduped,
      count:   deduped.length,
      sources: {
        fqhc:   fqhcResults.length,
        mental: mentalResults.length,
        va:     vaResults.length,
        er:     erResults.length,
        dental: dentalResults.length,
      },
    });

  } catch (err) {
    console.error("Clinics API error:", err);
    return NextResponse.json({ error: "Failed to fetch clinics" }, { status: 500 });
  }
}
