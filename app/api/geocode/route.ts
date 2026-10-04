import { NextRequest, NextResponse } from "next/server";
import { normalizeLocation, isVagueGeoResult } from "../../lib/locationUtils";

// /api/geocode?address=Clinton → { lat, lng, formattedAddress }
//
// No Muscatine fallback anymore. If a place can't be found we say so
// ({ notFound: true }) and the caller asks the user for their city/ZIP,
// instead of silently showing Muscatine results to someone elsewhere.

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address");

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
  if (!apiKey) {
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

    if (data.status !== "OK" || !data.results?.[0]) {
      return NextResponse.json({ notFound: true });
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
    return NextResponse.json({ error: "Geocoding failed" }, { status: 502 });
  }
}
