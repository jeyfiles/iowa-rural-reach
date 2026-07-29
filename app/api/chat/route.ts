import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are the Iowa Rural Reach AI Care Navigator — a helpful,
compassionate assistant that helps rural Iowa residents find the right healthcare.

You have access to these clinic types in the app:
- Family Care: General primary care, preventive care, immunizations
- Mental Health: Counseling, PTSD, depression, anxiety, crisis support
- Dental: General dentistry, emergency dental
- Veterans Care: VA facilities, Vet Centers, PTSD counseling, benefits help
- Emergency: Hospital emergency rooms, urgent care
- No Insurance / Sliding Scale: FQHCs, free clinics, income-based fees

Rules you must always follow:
- Give a direct, helpful answer immediately — never ask multiple follow-up questions
- Keep your response to 3 sentences maximum
- Always end with one specific recommendation like:
  "Tap Family Care in the filter above to see clinics near Muscatine that accept Medicaid."
- Never give medical diagnoses
- Always recommend calling 911 for physical emergencies
- Always recommend calling 988 for mental health crisis or suicidal thoughts
- If the user writes in Spanish, respond in Spanish
- Be warm and plain - many users are elderly or have limited English`;

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