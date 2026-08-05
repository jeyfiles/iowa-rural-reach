import { NextRequest, NextResponse } from "next/server";
import { normalizeLocation, isVagueGeoResult } from "../../lib/locationUtils";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address");

  if (!address) {
    return NextResponse.json({ error: "Address required" }, { status: 400 });
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Maps key not configured" }, { status: 500 });
  }

  try {
    // Normalize: resolve aliases ("Quad Cities" → "Davenport, Iowa"),
    // and append Iowa if not already present.
    const query = normalizeLocation(address);

    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${apiKey}`
    );
    const data = await res.json();

    if (data.status !== "OK" || !data.results?.[0]) {
      // Fallback to Muscatine, Iowa center if geocoding fails
      return NextResponse.json({
        lat: 41.4245, lng: -91.0432,
        fallback: true, vague: true,
      });
    }

    const { lat, lng } = data.results[0].geometry.location;
    const formattedAddress = data.results[0].formatted_address;

    // Detect vague results (e.g. "Iowa, USA") and flag them
    const vague = isVagueGeoResult(formattedAddress);
    if (vague) {
      return NextResponse.json({
        lat: 41.4245, lng: -91.0432,
        fallback: true, vague: true,
        formattedAddress: "Iowa",
      });
    }

    return NextResponse.json({ lat, lng, formattedAddress, vague: false });
  } catch (err) {
    console.error("Geocode error:", err);
    return NextResponse.json({
      lat: 41.4245, lng: -91.0432,
      fallback: true, vague: true,
    });
  }
}
