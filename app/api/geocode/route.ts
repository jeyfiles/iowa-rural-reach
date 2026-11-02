import { NextRequest, NextResponse } from "next/server";
import { normalizeLocation, isVagueGeoResult } from "../../lib/locationUtils";

// /api/geocode?address=Clinton → { lat, lng, formattedAddress }
//
// No Muscatine fallback anymore. If a place can't be found we say so
// ({ notFound: true }) and the caller asks the user for their city/ZIP,
// instead of silently showing Muscatine results to someone elsewhere.
//
// Google refusing the request (bad key, key restriction, API disabled,
// billing, quota) is NOT "not found". That returns HTTP 502 with
// { error: "geocode_unavailable" } and logs Google's status, so an outage
// never looks like the user typed a wrong city.
//
// Key: GOOGLE_GEOCODE_KEY is a server-only key (no website restriction,
// limited to the Geocoding API). Falls back to the browser Maps key so
// nothing breaks before the new variable is added in Vercel.

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address");

  const apiKey = process.env.GOOGLE_GEOCODE_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
  if (!apiKey) {
    console.error("Geocode: no GOOGLE_GEOCODE_KEY or NEXT_PUBLIC_GOOGLE_MAPS_KEY set");
    return NextResponse.json({ error: "Maps key not configured" }, { status: 500 });
  }

  if (!address) {
    return NextResponse.json({ error: "Address required" }, { status: 400 });
  }

  try {
    // Resolve aliases ("Quad Cities" → "Davenport, Iowa"), append Iowa if missing.
    const query = normalizeLocation(address);

    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${apiKey}`
    );
    const data = await res.json();

    // Place genuinely not found → ask the user again
    if (data.status === "ZERO_RESULTS") {
      return NextResponse.json({ notFound: true });
    }

    // Google refused or failed (REQUEST_DENIED, OVER_QUERY_LIMIT, ...)
    if (data.status !== "OK" || !data.results?.[0]) {
      console.error("Geocode: Google returned", data.status, "-", data.error_message || "(no message)");
      return NextResponse.json(
        { error: "geocode_unavailable", googleStatus: String(data.status || "UNKNOWN") },
        { status: 502 }
      );
    }

    const { lat, lng } = data.results[0].geometry.location;
    const formattedAddress = data.results[0].formatted_address;

    // Too vague (e.g. just "Iowa, USA") → treat as not found
    if (isVagueGeoResult(formattedAddress)) {
      return NextResponse.json({ notFound: true });
    }

    return NextResponse.json({ lat, lng, formattedAddress: String(formattedAddress).replace(/,\s*USA$/, "") });
  } catch (err) {
    console.error("Geocode error:", err);
    return NextResponse.json({ error: "geocode_unavailable" }, { status: 502 });
  }
}
