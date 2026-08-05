"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { COLORS as C, FONTS as F } from "../lib/constants";
import { useVoice } from "../lib/useVoice";
import { VoiceButton } from "../lib/VoiceButton";

interface Message {
  role: "user" | "ai";
  text: string;
  loading?: boolean;
  // context extracted from AI response for Show Results button
  resultsUrl?: string;
}

function IconArrowLeft() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>
    </svg>
  );
}

function IconSend() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>
    </svg>
  );
}

function IconBot() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 8V4H8"/>
      <rect width="16" height="12" x="4" y="8" rx="2"/>
      <path d="M2 14h2M20 14h2M9 13v2M15 13v2"/>
    </svg>
  );
}

function IconMap() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
      <line x1="9" y1="3" x2="9" y2="18"/>
      <line x1="15" y1="6" x2="15" y2="21"/>
    </svg>
  );
}

// ── Suggestions — Iowa-wide, not Muscatine-specific ──────────────
const SUGGESTIONS_EN = [
  "I need a doctor who takes Medicaid near Iowa City",
  "I am a veteran with PTSD near Burlington",
  "My child needs dental care and we have no insurance",
  "I am feeling very depressed and need help near Cedar Rapids",
  "Where can I find free or low cost care near me?",
  "I need emergency care right now",
];

const SUGGESTIONS_ES = [
  "Necesito un medico que acepte Medicaid cerca de Iowa City",
  "Soy veterano con PTSD cerca de Burlington",
  "Mi hijo necesita atencion dental y no tenemos seguro",
  "Me siento muy deprimido y necesito ayuda cerca de Cedar Rapids",
  "Donde puedo encontrar atencion gratuita cerca?",
  "Necesito atencion de emergencia ahora",
];

// ── Extract category and location from AI response ───────────────
// Used to build the context-aware Show Results URL
function buildResultsUrl(userMessage: string, lang: "en"|"es"): string {
  const msg = userMessage.toLowerCase();

  // Detect category from user message
  let cat = "";
  if (/veteran|va\b|military|vets/i.test(msg))                           cat = "veteran";
  else if (/mental|counsel|depress|anxiety|ptsd|substance|alcohol/i.test(msg)) cat = "mental";
  else if (/dental|dentist|tooth|teeth/i.test(msg))                      cat = "dental";
  else if (/emergency|er\b|urgent|hospital|chest pain/i.test(msg))       cat = "er";
  else if (/uninsured|no insurance|sliding|free clinic|afford/i.test(msg)) cat = "uninsured";
  else if (/doctor|primary|family|medicaid|checkup/i.test(msg))           cat = "family";

  // Extract location from user message
  const patterns = [
    /(?:near|in|around|close to|from)\s+([A-Za-z][a-zA-Z\s]+?)(?:\s*[,.]|$)/i,
    /([A-Za-z][a-zA-Z\s]+),?\s*Iowa/i,
  ];
  const falsePositives = ["i", "a", "the", "my", "me", "we", "us", "help", "care", "need", "want", "iowa"];
  let location = "";
  for (const p of patterns) {
    const m = userMessage.match(p);
    if (m?.[1]) {
      const loc = m[1].trim();
      if (!falsePositives.includes(loc.toLowerCase())) {
        location = loc;
        break;
      }
    }
  }

  // Build URL
  const params = new URLSearchParams({ lang });
  if (cat) params.set("cat", cat);
  if (location) params.set("q", location);
  return `/results?${params.toString()}`;
}

function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center", padding: "4px 0" }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: C.t4,
          animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
      ))}
      <style>{`@keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)} }`}</style>
    </div>
  );
}

function NavigatorInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const langParam    = (searchParams.get("lang") ?? "en") as "en" | "es";
  // q param — passed from home screen search bar
  const initialQuery = searchParams.get("q") ?? "";
  const bottomRef    = useRef<HTMLDivElement>(null);
  const inputRef     = useRef<HTMLTextAreaElement>(null);
  const didAutoSend  = useRef(false);

  const [lang, setLang]         = useState<"en"|"es">(langParam);
  const [isMobile, setIsMobile] = useState(false);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [messages, setMessages] = useState<Message[]>([{
    role: "ai",
    text: langParam === "en"
      ? "Hello! I am the Iowa Rural Reach AI Care Navigator. Tell me about your situation and I will help you find the right care near you. You can type or use the microphone to speak."
      : "Hola! Soy el Navegador de Atencion IA de Iowa Rural Reach. Cuenteme su situacion y le ayudare a encontrar la atencion adecuada cerca de usted.",
  }]);

  useEffect(() => {
    const saved = localStorage.getItem("rrLang") as "en"|"es" | null;
    if (saved) setLang(saved);
  }, []);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // ── Auto-submit query from home screen search bar ─────────────
  // If user typed in the home screen search bar and pressed Find Care,
  // we receive the query via ?q= param and auto-send it
  useEffect(() => {
    if (initialQuery && !didAutoSend.current) {
      didAutoSend.current = true;
      sendMessage(initialQuery);
    }
  }, [initialQuery]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;

    // Build the results URL from the user message for the Show Results button
    const resultsUrl = buildResultsUrl(text, lang);

    const userMsg: Message    = { role: "user", text: text.trim() };
    const loadingMsg: Message = { role: "ai", text: "", loading: true };
    setMessages(prev => [...prev, userMsg, loadingMsg]);
    setInput("");
    setLoading(true);

    const history = messages.map(m => ({ role: m.role, text: m.text }));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim(), history }),
      });
      const data = await res.json();
      const aiText = data.text ?? (lang === "en"
        ? "I am sorry, something went wrong. Please try again."
        : "Lo siento, algo salio mal. Por favor intente de nuevo.");

      // Attach resultsUrl to the AI message so Show Results button appears
      setMessages(prev => [...prev.filter(m => !m.loading), {
        role: "ai",
        text: aiText,
        resultsUrl,
      }]);
    } catch {
      setMessages(prev => [...prev.filter(m => !m.loading), {
        role: "ai",
        text: lang === "en"
          ? "I am sorry, I could not connect. Please check your connection and try again."
          : "Lo siento, no pude conectarme. Por favor verifique su conexion e intente de nuevo.",
      }]);
    } finally {
      setLoading(false);
    }
  }

  const { voiceState, start: startVoice } = useVoice(
    lang,
    (text) => setInput(text),
    (text) => sendMessage(text)
  );

  const px = isMobile ? "18px" : "48px";

  return (
    <main style={{ height: "100vh", display: "flex", flexDirection: "column",
      fontFamily: F.body, background: "#F4F6FB" }}>

      {/* NAV */}
      <nav style={{ width: "100%", background: C.iBlue,
        padding: "0 " + px, boxSizing: "border-box",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: isMobile ? 60 : 72, flexShrink: 0,
        borderBottom: "3px solid #1A3A7A" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={() => router.push(`/?lang=${lang}`)}
            style={{ display: "flex", alignItems: "center", gap: 8,
              background: "transparent", border: "none", color: "#A8B8D8",
              cursor: "pointer", fontFamily: F.body, fontSize: 14,
              minHeight: 44, padding: "0 4px" }}>
            <IconArrowLeft />
            {!isMobile && (lang === "en" ? "Back" : "Volver")}
          </button>
          <div style={{ width: 1, height: 24, background: "#2A4A8A" }} />
          <div>
            <div style={{ fontFamily: F.heading, fontSize: isMobile ? 18 : 22,
              fontWeight: 700, color: C.iWhite }}>Iowa Rural Reach</div>
            {!isMobile && (
              <div style={{ fontFamily: F.body, fontSize: 12, color: "#A8B8D8", marginTop: 1 }}>
                {lang === "en" ? "AI Care Navigator" : "Navegador de Atencion IA"}
              </div>
            )}
          </div>
        </div>
        <div style={{ fontSize: 13, fontFamily: F.body,
          padding: "6px 12px", borderRadius: 4,
          border: "1px solid #3A5A9A", color: "#A8B8D8" }}>
          {lang === "en" ? "EN" : "ES"}
        </div>
      </nav>

      {/* CHAT HEADER */}
      <div style={{ background: C.iWhite, borderBottom: "1px solid " + C.border,
        padding: isMobile ? "10px 18px" : "12px 48px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: C.iBlue,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: C.iWhite, flexShrink: 0 }}>
            <IconBot />
          </div>
          <div>
            <div style={{ fontFamily: F.heading, fontSize: 15, fontWeight: 700, color: C.iBlue }}>
              {lang === "en" ? "AI Care Navigator" : "Navegador de Atencion IA"}
            </div>
            <div style={{ fontFamily: F.body, fontSize: 12, color: C.t3 }}>
              {lang === "en"
                ? "Powered by Claude AI — Not medical advice"
                : "Con tecnologia Claude IA — No es consejo medico"}
            </div>
          </div>
        </div>
      </div>

      {/* CHAT MESSAGES */}
      <div style={{ flex: 1, overflowY: "auto",
        padding: isMobile ? "16px 18px" : "24px 48px",
        display: "flex", flexDirection: "column", gap: 16 }}>

        {messages.map((msg, i) => (
          <div key={i}>
            <div style={{ display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              alignItems: "flex-end", gap: 10 }}>
              {msg.role === "ai" && (
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.blueL,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: C.iBlue, flexShrink: 0 }}>
                  <IconBot />
                </div>
              )}
              <div style={{ maxWidth: isMobile ? "85%" : "65%", padding: "12px 16px",
                borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                background: msg.role === "user" ? C.iBlue : C.iWhite,
                color: msg.role === "user" ? C.iWhite : C.t2,
                fontFamily: F.body, fontSize: isMobile ? 15 : 16, lineHeight: 1.65,
                boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                border: msg.role === "ai" ? "1px solid " + C.border : "none" }}>
                {msg.loading ? <TypingDots /> : msg.text}
              </div>
            </div>

            {/* ── Show Results button — appears after every AI response ── */}
            {/* Only shows if the AI message has a resultsUrl (i.e. a real healthcare query) */}
            {msg.role === "ai" && !msg.loading && msg.resultsUrl && (
              <div style={{ display: "flex", justifyContent: "flex-start",
                paddingLeft: 42, marginTop: 8 }}>
                <button
                  onClick={() => router.push(msg.resultsUrl!)}
                  style={{ display: "flex", alignItems: "center", gap: 8,
                    padding: "10px 18px", borderRadius: 8,
                    background: C.iBlue, color: C.iWhite, border: "none",
                    fontFamily: F.heading, fontSize: isMobile ? 13 : 14,
                    fontWeight: 700, cursor: "pointer", letterSpacing: "0.02em",
                    minHeight: 44,
                    boxShadow: "0 2px 8px rgba(10,31,98,0.2)" }}>
                  <IconMap />
                  {lang === "en" ? "Show Results on Map" : "Ver Resultados en Mapa"}
                </button>
              </div>
            )}
          </div>
        ))}

        {/* Suggested prompts — show only at start */}
        {messages.length === 1 && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontFamily: F.body, fontSize: 13, color: C.t3, marginBottom: 10 }}>
              {lang === "en" ? "Try asking:" : "Intente preguntar:"}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {(lang === "en" ? SUGGESTIONS_EN : SUGGESTIONS_ES).map((s, i) => (
                <button key={i} onClick={() => sendMessage(s)}
                  style={{ textAlign: "left", padding: "10px 14px", borderRadius: 8,
                    background: C.iWhite, border: "1px solid " + C.border,
                    fontFamily: F.body, fontSize: isMobile ? 13 : 14,
                    color: C.iBlue, cursor: "pointer", lineHeight: 1.4, minHeight: 44 }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Voice listening indicator */}
        {voiceState === "listening" && (
          <div style={{ display: "flex", justifyContent: "center", marginTop: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10,
              padding: "10px 20px", borderRadius: 24,
              background: C.redL, border: "1px solid " + C.iRed }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%",
                background: C.iRed,
                animation: "pulse 1s ease-in-out infinite" }} />
              <span style={{ fontFamily: F.body, fontSize: 14,
                color: C.iRed, fontWeight: 500 }}>
                {lang === "en" ? "Listening... speak now" : "Escuchando... hable ahora"}
              </span>
              <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* EMERGENCY STRIP */}
      <div style={{ background: C.iWhite, borderTop: "1px solid " + C.border,
        padding: isMobile ? "8px 18px" : "10px 48px",
        display: "flex", gap: 10, flexShrink: 0 }}>
        <a href="tel:911" style={{ textDecoration: "none", flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px",
            borderRadius: 6, background: C.redL, border: "1px solid " + C.iRed }}>
            <div style={{ width: 32, height: 32, borderRadius: 4, background: C.iRed,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontFamily: F.heading, fontSize: 12,
                fontWeight: 700, color: C.iWhite }}>911</span>
            </div>
            <span style={{ fontFamily: F.body, fontSize: isMobile ? 12 : 13,
              color: C.iRed, fontWeight: 500 }}>
              {lang === "en" ? "Physical Emergency" : "Emergencia Fisica"}
            </span>
          </div>
        </a>
        <a href="tel:988" style={{ textDecoration: "none", flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px",
            borderRadius: 6, background: C.blueL, border: "1px solid " + C.iBlue }}>
            <div style={{ width: 32, height: 32, borderRadius: 4, background: C.iBlue,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontFamily: F.heading, fontSize: 12,
                fontWeight: 700, color: C.iWhite }}>988</span>
            </div>
            <span style={{ fontFamily: F.body, fontSize: isMobile ? 12 : 13,
              color: C.iBlue, fontWeight: 500 }}>
              {lang === "en" ? "Mental Health Crisis" : "Crisis de Salud Mental"}
            </span>
          </div>
        </a>
      </div>

      {/* INPUT BAR */}
      <div style={{ background: C.iWhite, borderTop: "1px solid " + C.border,
        padding: isMobile ? "12px 18px" : "14px 48px",
        display: "flex", gap: 10, alignItems: "center", flexShrink: 0 }}>
        <VoiceButton voiceState={voiceState} onStart={startVoice} size={48} />
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage(input);
            }
          }}
          placeholder={lang === "en"
            ? "Describe your situation or ask a question..."
            : "Describa su situacion o haga una pregunta..."}
          rows={1}
          style={{ flex: 1, border: "1.5px solid " + C.border, borderRadius: 4,
            padding: "12px 14px", fontSize: isMobile ? 15 : 16,
            fontFamily: F.body, color: C.t2, background: C.card,
            outline: "none", resize: "none", lineHeight: 1.5,
            minHeight: 48, boxSizing: "border-box" }} />
        <button
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
          aria-label="Send message"
          style={{ width: 48, height: 48, borderRadius: "50%", flexShrink: 0,
            border: "none",
            background: loading || !input.trim() ? C.border : C.iBlue,
            color: C.iWhite,
            cursor: loading || !input.trim() ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "background 0.15s" }}>
          <IconSend />
        </button>
      </div>
    </main>
  );
}

export default function NavigatorPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center",
        justifyContent: "center", fontFamily: "'Roboto', sans-serif", color: "#5A6A8A" }}>
        Loading...
      </div>
    }>
      <NavigatorInner />
    </Suspense>
  );
}
