import { NextRequest, NextResponse } from "next/server";

// ── Intent detection — same keywords as clinics route ────────────
function detectCareType(msg: string): string {
  const m = msg.toLowerCase();
  if (/veteran|va\b|military|vets/i.test(m))                          return "veteran va military";
  if (/mental|counsel|depress|anxiety|ptsd|substance|alcohol/i.test(m)) return "mental health counseling";
  if (/dental|dentist|tooth|teeth/i.test(m))                          return "dental dentist";
  if (/emergency|er\b|urgent|hospital|accident|chest pain/i.test(m))  return "emergency hospital urgent";
  if (/uninsured|no insurance|sliding|free clinic|afford/i.test(m))   return "uninsured sliding scale";
  if (/doctor|primary|family|medicaid|checkup/i.test(m))              return "doctor primary family";
  return ""; // general — fetch all
}

// ── Extract location from user message ───────────────────────────
function extractLocation(msg: string): string {
  // Match "near X", "in X", "around X", "close to X"
  const patterns = [
    /(?:near|in|around|close to|from)\s+([A-Z][a-zA-Z\s]+?)(?:\s*[,.]|$)/i,
    /([A-Z][a-zA-Z\s]+),?\s*Iowa/i,
    /([A-Z][a-zA-Z\s]+),?\s*IA\b/i,
  ];
  for (const p of patterns) {
    const m = msg.match(p);
    if (m?.[1]) {
      const loc = m[1].trim();
      // Filter out common false positives
      if (!["I", "a", "the", "my", "me", "we", "us", "help", "care", "need"].includes(loc)) {
        return loc + ", Iowa";
      }
    }
  }
  return "Muscatine, Iowa"; // default
}

// ── Fetch real clinics for the user's location + care type ────────
async function fetchNearbyClinics(location: string, careType: string, baseUrl: string) {
  try {
    // Step 1 — Geocode location
    const geoRes  = await fetch(`${baseUrl}/api/geocode?address=${encodeURIComponent(location)}`);
    const geoData = await geoRes.json();
    const lat = geoData.lat || 41.4245;
    const lng = geoData.lng || -91.0432;

    // Step 2 — Fetch clinics
    const clinicsRes  = await fetch(
      `${baseUrl}/api/clinics?lat=${lat}&lng=${lng}&query=${encodeURIComponent(careType)}`
    );
    const clinicsData = await clinicsRes.json();
    return clinicsData.clinics?.slice(0, 3) || []; // top 3 closest
  } catch {
    return [];
  }
}

// ── Format clinics into a concise context string for Claude ───────
function formatClinicsForPrompt(clinics: any[]): string {
  if (!clinics.length) return "No nearby clinics found in the database.";
  return clinics.map((c, i) =>
    `${i + 1}. ${c.name} — ${c.address} — Phone: ${c.phone || "call for info"} — ${c.distance} away` +
    (c.sliding ? " — Sliding scale fees" : "") +
    (c.telehealth ? " — Telehealth available" : "")
  ).join("\n");
}

const SYSTEM_PROMPT = `You are the Iowa Rural Reach AI Care Navigator.
You help rural Iowa residents find healthcare in 2-3 sentences maximum.

You will receive REAL CLINIC DATA from our database injected below each user message.
Use this data to name specific clinics, addresses, and phone numbers in your response.
This makes your response genuinely useful — not generic advice.

Clinic types in the app:
- Family Care: primary care, checkups
- Mental Health: counseling, depression, anxiety, PTSD
- Dental: dentistry, tooth pain
- Veterans Care: VA facilities, veteran benefits
- Emergency: ER, urgent care
- No Insurance: sliding scale, free clinics

Rules — follow these strictly:
1. NEVER ask follow-up questions. Give a direct answer immediately.
2. Maximum 3 sentences in your response.
3. ALWAYS use the REAL CLINIC DATA provided. You MUST name the first clinic listed with its exact address and phone number. Never give generic advice when real data is available.
4. Always end with: "Tap [Category Name] in the filter above to see all nearby options."
5. For emergencies say: "Call 911 immediately." then suggest Emergency filter.
6. For mental health crisis say: "Call or text 988 immediately." then suggest Mental Health filter.
7. If user writes in Spanish, respond entirely in Spanish.
8. Never diagnose. Be warm and direct.

Example good response with real data:
"The closest VA clinic to Burlington is the Burlington VA Clinic at 1000 North Roosevelt Avenue — call them at (319) 752-3722. They offer veterans primary care, mental health care, and audiology. Tap Veterans Care in the filter above to see all nearby options."

Example good response without data:
"It sounds like you need Family Care. Many clinics near Muscatine accept Medicaid and offer sliding-scale fees for those who qualify. Tap Family Care in the filter above to see nearby options."`;

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json();
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    // ── Get base URL for internal API calls ──────────────────────
    const baseUrl = req.nextUrl.origin;

    // ── Fetch real clinic data based on message intent ───────────
    const location  = extractLocation(message);
    const careType  = detectCareType(message);
    const clinics   = await fetchNearbyClinics(location, careType, baseUrl);
    const clinicCtx = formatClinicsForPrompt(clinics);

    //console.log("Navigator — location:", location, "careType:", careType, "clinics found:", clinics.length);
    //console.log("Clinic context:", clinicCtx);

    // ── Inject clinic data into the user message ─────────────────
    const enrichedMessage = `${message}

[REAL CLINIC DATA from Iowa Rural Reach database for ${location}:]
${clinicCtx}`;

    const messages = [
      ...history
        .filter((msg: { role: string; text: string }) => msg.text.trim() !== "")
        .map((msg: { role: string; text: string }) => ({
          role: msg.role === "user" ? "user" : "assistant",
          content: msg.text,
        })),
      { role: "user", content: enrichedMessage },
    ];

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        system: SYSTEM_PROMPT,
        messages,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Claude error:", err);
      return NextResponse.json({ error: "AI service error" }, { status: 500 });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text ??
      "I am sorry, I could not process that. Please try again.";

    return NextResponse.json({ text });

  } catch (err) {
    console.error("Chat route error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
