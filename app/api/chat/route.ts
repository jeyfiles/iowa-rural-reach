import { NextRequest, NextResponse } from "next/server";

// ── Intent detection ─────────────────────────────────────────────
function detectCareType(msg: string): string {
  const m = msg.toLowerCase();
  if (/veteran|va\b|military|vets/i.test(m))                           return "veteran va military";
  if (/mental|counsel|depress|anxiety|ptsd|substance|alcohol/i.test(m)) return "mental health counseling";
  if (/dental|dentist|tooth|teeth/i.test(m))                           return "dental dentist";
  if (/emergency|er\b|urgent|hospital|accident|chest pain/i.test(m))   return "emergency hospital urgent";
  if (/uninsured|no insurance|sliding|free clinic|afford/i.test(m))    return "uninsured sliding scale";
  if (/doctor|primary|family|medicaid|checkup/i.test(m))               return "doctor primary family";
  return "";
}

// ── Detect out-of-scope requests ─────────────────────────────────
function isOutOfScope(msg: string): boolean {
  return /walgreens|cvs|walmart|target|hy-?vee|fareway|aldi|kroger|costco|restaurant|gas station|directions to|address of|where is the|grocery|pharmacy location|drug store/i.test(msg);
}

// ── Extract location from user message ───────────────────────────
function extractLocation(msg: string): string | null {
  const patterns = [
    /(?:near|in|around|close to|from)\s+([A-Za-z][a-zA-Z\s]+?)(?:\s*[,.]|$)/i,
    /([A-Za-z][a-zA-Z\s]+),?\s*Iowa/i,
    /([A-Za-z][a-zA-Z\s]+),?\s*IA\b/i,
  ];
  const falsePositives = ["i", "a", "the", "my", "me", "we", "us", "help", "care", "need", "want", "iowa"];
  for (const p of patterns) {
    const m = msg.match(p);
    if (m?.[1]) {
      const loc = m[1].trim();
      if (!falsePositives.includes(loc.toLowerCase())) {
        return loc + ", Iowa";
      }
    }
  }
  return null;
}

// ── Fetch real clinics ────────────────────────────────────────────
async function fetchNearbyClinics(location: string, careType: string, baseUrl: string) {
  try {
    const geoRes      = await fetch(`${baseUrl}/api/geocode?address=${encodeURIComponent(location)}`);
    const geoData     = await geoRes.json();
    const lat         = geoData.lat || 41.4245;
    const lng         = geoData.lng || -91.0432;
    const clinicsRes  = await fetch(`${baseUrl}/api/clinics?lat=${lat}&lng=${lng}&query=${encodeURIComponent(careType)}`);
    const clinicsData = await clinicsRes.json();
    return {
      clinics: clinicsData.clinics?.slice(0, 3) || [],
      count:   clinicsData.count || 0,
    };
  } catch {
    return { clinics: [], count: 0 };
  }
}

// ── Format clinics for Claude context ────────────────────────────
function formatClinicsForPrompt(clinics: any[], totalCount: number): string {
  if (!clinics.length) return "No nearby clinics found in the database.";
  const lines = clinics.map((c, i) =>
    `${i + 1}. ${c.name} — ${c.address} — Phone: ${c.phone || "call for info"} — ${c.distance} away` +
    (c.sliding ? " — Sliding scale fees" : "") +
    (c.telehealth ? " — Telehealth available" : "")
  );
  return `TOTAL OPTIONS FOUND: ${totalCount}\nCLOSEST OPTIONS:\n${lines.join("\n")}`;
}

// ── System prompt ─────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are the Iowa Rural Reach AI Care Navigator.
You help Iowa residents find healthcare in 2-3 sentences maximum.
This app covers all of Iowa — not just one city.

You will receive REAL CLINIC DATA from our database injected below each user message.
Use this data to name specific clinics, addresses, and phone numbers in your response.

Clinic types in the app:
- Family Care: primary care, checkups
- Mental Health: counseling, depression, anxiety, PTSD
- Dental: dentistry, tooth pain
- Veterans Care: VA facilities, veteran benefits
- Emergency: ER, urgent care
- No Insurance: sliding scale, free clinics

Rules — follow these strictly:
1. NEVER ask follow-up questions. NEVER end your response with a question. Period.
2. Maximum 3 sentences in your response.
3. When REAL CLINIC DATA is provided with a TOTAL OPTIONS FOUND count:
   - First sentence: state the total count and name the closest clinic with its address and phone number.
   - Second sentence: invite refinement — mention they can filter by insurance, distance, or services using the Show Results button.
   - Example: "I found 8 dental options near Muscatine — the closest is Dr. James Smith, DDS at 123 Main St, call (563) 555-1234. For more options or to filter by insurance, tap Show Results on Map below."
4. Always end with: "Use the Show Results on Map button below to see all [Category Name] options near you." — UNLESS you already included the Show Results mention in sentence 2, in which case don't repeat it.
5. For emergencies say: "Call 911 immediately." then mention Emergency filter.
6. For mental health crisis say: "Call or text 988 immediately." then mention Mental Health options.
7. If user writes in Spanish, respond entirely in Spanish.
8. Never diagnose. Be warm and direct.
9. If the CLINIC DATA note says NO LOCATION DETECTED — respond with exactly 2 sentences: acknowledge what they need, then ask which city or town in Iowa they are in. Do NOT name any clinics. This is the only time you may ask a question.
10. If the CLINIC DATA note says OUT OF SCOPE — respond with exactly: "I specialize in finding healthcare clinics across Iowa — for store locations, Google Maps will get you there quickly. If you ever need medical care nearby, the Show Results button below is ready for you."
11. If the user mentions something adjacent to healthcare (prescriptions, pharmacy services) briefly acknowledge it then offer the nearest relevant clinic. Be warm, never dismissive.
12. NEVER end with a question except in the case of Rule 9.

Example — good response with count:
"I found 14 VA options near Burlington — the closest is the Burlington VA Clinic at 1000 North Roosevelt Avenue, call (319) 752-3722. For more options or to filter by service, use the Show Results on Map button below."

Example — no location detected:
"It sounds like you need Veterans Care. Which city or town in Iowa are you in so I can find the closest VA options for you?"

Example — out of scope:
"I specialize in finding healthcare clinics across Iowa — for store locations, Google Maps will get you there quickly. If you ever need medical care nearby, the Show Results button below is ready for you."

Example — dental with count:
"I found 8 dental options near Muscatine — the closest is Dr. James Smith, DDS at 123 Main St, call (563) 555-1234. For more options or to filter by insurance, use the Show Results on Map button below."`;

// ── Main POST handler ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json();
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    const baseUrl  = req.nextUrl.origin;
    const location = extractLocation(message);
    const careType = detectCareType(message);

    let enrichedMessage: string;

    if (isOutOfScope(message)) {
      // Path 1 — out of scope
      enrichedMessage = `${message}

[CLINIC DATA NOTE: OUT OF SCOPE REQUEST. Do NOT mention any clinics. Follow Rule 10 exactly.]`;

    } else if (!location) {
      // Path 2 — no location found
      enrichedMessage = `${message}

[CLINIC DATA NOTE: NO LOCATION DETECTED. Do NOT show any clinics. Follow Rule 9 — ask which city or town in Iowa they are in.]`;

    } else {
      // Path 3 — location found, fetch real clinics with total count
      const { clinics, count } = await fetchNearbyClinics(location, careType, baseUrl);
      const clinicCtx = formatClinicsForPrompt(clinics, count);
      enrichedMessage = `${message}

[REAL CLINIC DATA from Iowa Rural Reach database for ${location}:]
${clinicCtx}`;
    }

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
