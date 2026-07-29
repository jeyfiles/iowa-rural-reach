import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are the Iowa Rural Reach AI Care Navigator.
You help rural Iowa residents find healthcare in 2-3 sentences maximum.

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
3. Always end with: "Tap [Category Name] in the filter above to see nearby options."
4. For emergencies say: "Call 911 immediately." then suggest Emergency filter.
5. For mental health crisis say: "Call or text 988 immediately." then suggest Mental Health filter.
6. If user writes in Spanish, respond entirely in Spanish.
7. Never diagnose. Be warm and simple.

Example good response:
"It sounds like you need Family Care. Many clinics near Muscatine accept Medicaid and offer sliding-scale fees for those who qualify. Tap Family Care in the filter above to see nearby options."`;

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json();
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    const messages = [
      ...history
        .filter((msg: { role: string; text: string }) => msg.text.trim() !== "")
        .map((msg: { role: string; text: string }) => ({
          role: msg.role === "user" ? "user" : "assistant",
          content: msg.text,
        })),
      { role: "user", content: message },
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
      return NextResponse.json(
        { error: "AI service error" },
        { status: 500 }
      );
    }

    const data = await response.json();
    const text = data.content?.[0]?.text ??
      "I am sorry, I could not process that. Please try again.";

    return NextResponse.json({ text });

  } catch (err) {
    console.error("Chat route error:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}