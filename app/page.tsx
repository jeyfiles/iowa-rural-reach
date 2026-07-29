"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { COLORS as C, FONTS as F, CATEGORIES } from "./lib/constants";

// ── SVG Icons ───────────────────────────────────────────────────
function IconStethoscope() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6 6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.3.3 0 1 0 .2.3"/>
      <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/>
      <circle cx="20" cy="10" r="2"/>
    </svg>
  );
}

function IconBrain() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.44-4.24z"/>
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.44-4.24z"/>
    </svg>
  );
}

function IconTooth() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5.5c-1.5-2-4-2.5-5.5-1S4 8 4.5 10c.3 1.2.5 2.5.5 4 0 2 .5 4 2 4s2-2 2-3.5c0-.8.7-1.5 1.5-1.5h.5c.8 0 1.5.7 1.5 1.5 0 1.5.5 3.5 2 3.5s2-2 2-4c0-1.5.2-2.8.5-4 .5-2 0-4-1-5S13.5 3.5 12 5.5z"/>
    </svg>
  );
}

function IconShield() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <path d="m9 12 2 2 4-4"/>
    </svg>
  );
}

function IconAmbulance() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 17H2V7a2 2 0 0 1 2-2h6"/>
      <path d="M14 9h4l3 3v5h-7V9z"/>
      <circle cx="7" cy="17" r="2"/>
      <circle cx="17" cy="17" r="2"/>
      <path d="M5 9h4M7 7v4"/>
    </svg>
  );
}

function IconHeart() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
    </svg>
  );
}

function IconMic() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect width="8" height="14" x="8" y="2" rx="4"/>
      <path d="M4 13a8 8 0 0 0 16 0M12 19v4M8 23h8"/>
    </svg>
  );
}

function IconAccessibility() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="16" cy="4" r="1"/>
      <path d="m18 19 1-7-6 1M5 8l6-3 5.5 3-2 3"/>
      <path d="M4.24 14.5a5 5 0 0 0 6.88 6M13.76 17.5a5 5 0 0 0-6.88-6"/>
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

const CAT_ICONS = [
  <IconStethoscope key="f" />,
  <IconBrain key="m" />,
  <IconTooth key="d" />,
  <IconShield key="v" />,
  <IconAmbulance key="e" />,
  <IconHeart key="u" />,
];

// ── MAIN PAGE ───────────────────────────────────────────────────
export default function Home() {
  const router = useRouter();

  const [query, setQuery]         = useState("");
  const [lang, setLang]           = useState<"en"|"es">("en");
  const [activeIdx, setActiveIdx] = useState<number|null>(null);
  const [isMobile, setIsMobile]   = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const t = {
    appName:     "Iowa Rural Reach",
    appSub:      lang === "en" ? "AI Health Care Navigator" : "Buscador de Atención Médica con IA",
    heading:     lang === "en" ? "What kind of care do you need?"                              : "¿Qué tipo de atención necesita?",
    sub:         lang === "en" ? "Describe your situation and we will find the right care near you." : "Describa su situación y encontraremos opciones cerca de usted.",
    placeholder: lang === "en" ? "e.g. I need a doctor who takes Medicaid in Muscatine"         : "ej. Necesito un médico que acepte Medicaid",
    mic:         lang === "en" ? "Or speak"  : "O hable",
    cta:         lang === "en" ? "Find Care" : "Buscar",
    aiNav:       lang === "en" ? "Ask AI Navigator" : "Preguntar al IA",
    orPick:      lang === "en" ? "Or choose a category" : "O elija una categoría",
    howTitle:    lang === "en" ? "How Iowa Rural Reach helps" : "Cómo ayuda Iowa Rural Reach",
    card1Title:  lang === "en" ? "Find the right match"   : "Encuentre la opción correcta",
    card1Body:   lang === "en" ? "Filter by insurance, cost, language, and distance - not just what is nearest."
                               : "Filtre por seguro, costo, idioma y distancia.",
    card2Title:  lang === "en" ? "Veterans care included" : "Atención para veteranos",
    card2Body:   lang === "en" ? "Dedicated layer for VA facilities, Vet Centers, and benefits offices near you."
                               : "Capa dedicada para instalaciones VA y oficinas de beneficios.",
    card3Title:  lang === "en" ? "AI Care Navigator"      : "Navegador de Atención IA",
    card3Body:   lang === "en" ? "Speak or type your situation. Get personalized care recommendations instantly."
                               : "Hable o escriba su situación y reciba recomendaciones personalizadas.",
  };

  function handleVoice() {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Voice input requires Chrome browser.");
      return;
    }
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = lang === "es" ? "es-US" : "en-US";
    recognition.onresult = (e: any) => setQuery(e.results[0][0].transcript);
    recognition.start();
  }

  function handleFindCare() {
    const cat = activeIdx !== null ? CATEGORIES[activeIdx].id : "";
    router.push(`/results?q=${encodeURIComponent(query)}&cat=${cat}`);
  }

  function handleCategoryClick(i: number, catId: string) {
    const newIdx = activeIdx === i ? null : i;
    setActiveIdx(newIdx);
    if (newIdx !== null) {
      router.push(`/results?cat=${catId}`);
    }
  }

  // ── Responsive helpers ──────────────────────────────────────
  const px          = isMobile ? "18px" : "56px";
  const headingSize = isMobile ? 28      : 46;
  const bodySize    = isMobile ? 16      : 18;
  const navH        = isMobile ? 68      : 96;

  return (
    <main style={{ minHeight: "100vh", background: C.iWhite,
      fontFamily: F.body, color: C.t2 }}>

      {/* ══ NAV ══════════════════════════════════════════════ */}
      <nav style={{ width: "100%", background: C.iBlue,
        padding: "0 " + px, boxSizing: "border-box",
        display: "flex", alignItems: "center",
        justifyContent: "space-between", height: navH,
        borderBottom: "3px solid #1A3A7A" }}>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontFamily: F.heading, fontSize: isMobile ? 24 : 34,
            fontWeight: 700, color: C.iWhite, letterSpacing: "0.01em",
            lineHeight: 1.1 }}>
            Iowa Rural Reach
          </span>
          {!isMobile && (
            <span style={{ fontFamily: F.body, fontSize: 16,
              color: "#A8B8D8", fontWeight: 400, marginTop: 6 }}>
              {t.appSub}
            </span>
          )}
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={() => setLang(lang === "en" ? "es" : "en")}
            style={{ fontSize: isMobile ? 13 : 14, fontFamily: F.body,
              padding: isMobile ? "6px 12px" : "7px 16px", borderRadius: 4,
              border: "1px solid #3A5A9A", background: "transparent",
              color: C.iWhite, cursor: "pointer", fontWeight: 500,
              minHeight: 44 }}>
            {lang === "en" ? "🇲🇽 Español" : "🇺🇸 English"}
          </button>
          <button title="Accessibility options"
            style={{ width: 44, height: 44, borderRadius: 4,
              border: "1px solid #3A5A9A", background: "transparent",
              color: C.iWhite, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center" }}>
            <IconAccessibility />
          </button>
        </div>
      </nav>

      {/* ══ HERO ════════════════════════════════════════════ */}
      <section style={{ width: "100%", boxSizing: "border-box",
        padding: isMobile ? "36px 18px 32px" : "72px 56px 64px",
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "1.1fr 0.9fr",
        gap: isMobile ? 32 : 64, alignItems: "start" }}>

        {/* ── LEFT ── */}
        <div>
          <h1 style={{ fontFamily: F.heading, fontSize: headingSize,
            fontWeight: 700, color: C.iBlue,
            margin: "0 0 16px", lineHeight: 1.15,
            letterSpacing: "0.01em" }}>
            {t.heading}
          </h1>
          <p style={{ fontFamily: F.body, fontSize: bodySize,
            color: C.t3, margin: "0 0 32px", lineHeight: 1.75,
            fontWeight: 400 }}>
            {t.sub}
          </p>

          {/* ── SEARCH CARD ── */}
          <div style={{ background: C.iWhite, borderRadius: 6,
            border: "1.5px solid " + C.border,
            boxShadow: "0 4px 24px rgba(10,31,98,0.10)",
            overflow: "hidden", marginBottom: 24 }}>

            <textarea
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleFindCare();
                }
              }}
              placeholder={t.placeholder}
              rows={3}
              aria-label="Describe what care you need"
              style={{ width: "100%", border: "none", outline: "none",
                padding: isMobile ? "16px 16px 10px" : "22px 22px 12px",
                fontSize: isMobile ? 16 : 17,
                fontFamily: F.body, color: C.t2,
                background: "transparent", resize: "none",
                lineHeight: 1.6, boxSizing: "border-box" }} />

            {/* Voice + Find Care row */}
            <div style={{ display: "flex", justifyContent: "space-between",
              alignItems: "center",
              padding: isMobile ? "10px 14px 10px" : "12px 18px 10px",
              borderTop: "1px solid " + C.border,
              background: "#FAFBFF" }}>
              <button onClick={handleVoice}
                aria-label="Use voice input"
                style={{ display: "flex", alignItems: "center", gap: 8,
                  background: "none", border: "1px solid " + C.border,
                  borderRadius: 4, padding: "9px 16px",
                  fontSize: isMobile ? 14 : 15, fontFamily: F.body,
                  color: C.t3, cursor: "pointer", minHeight: 44 }}>
                <IconMic /> {t.mic}
              </button>
              <button
                onClick={handleFindCare}
                aria-label="Find care"
                style={{ background: C.iBlue, color: C.iWhite,
                  border: "none", borderRadius: 4,
                  padding: isMobile ? "11px 28px" : "13px 36px",
                  fontSize: isMobile ? 15 : 17, fontFamily: F.heading,
                  fontWeight: 700, cursor: "pointer",
                  letterSpacing: "0.04em", minHeight: 44 }}>
                {t.cta} →
              </button>
            </div>

            {/* AI Navigator button — full width below */}
            <div style={{ padding: isMobile ? "0 14px 14px" : "0 18px 14px",
              background: "#FAFBFF" }}>
              <button
                onClick={() => router.push("/navigator")}
                style={{ width: "100%",
                  display: "flex", alignItems: "center",
                  justifyContent: "center", gap: 8,
                  background: "transparent",
                  color: C.iBlue,
                  border: "1.5px solid " + C.iBlue,
                  borderRadius: 4,
                  padding: isMobile ? "10px 20px" : "11px 20px",
                  fontSize: isMobile ? 14 : 15,
                  fontFamily: F.heading,
                  fontWeight: 700, cursor: "pointer",
                  letterSpacing: "0.04em", minHeight: 44 }}>
                <IconBot />
                {t.aiNav} →
              </button>
            </div>
          </div>

          {/* Category pills */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontFamily: F.body, fontSize: 12, fontWeight: 500,
              color: C.t3, textTransform: "uppercase",
              letterSpacing: "0.08em", marginBottom: 14 }}>
              {t.orPick}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap",
              gap: isMobile ? 8 : 10 }}>
              {CATEGORIES.map((cat, i) => {
                const isActive = activeIdx === i;
                const isVet    = cat.id === "veteran";
                return (
                  <button key={cat.id}
                    onClick={() => handleCategoryClick(i, cat.id)}
                    aria-pressed={isActive}
                    style={{ display: "flex", alignItems: "center", gap: 8,
                      padding: isMobile ? "10px 14px" : "11px 18px",
                      borderRadius: 4, fontSize: isMobile ? 14 : 15,
                      fontFamily: F.body, fontWeight: 500,
                      cursor: "pointer", transition: "all 0.15s",
                      minHeight: 48,
                      border: "1.5px solid " + (isActive
                        ? (isVet ? C.gold : C.iBlue) : C.border),
                      background: isActive
                        ? (isVet ? C.goldL : C.blueL) : C.iWhite,
                      color: isActive
                        ? (isVet ? "#7A5E00" : C.iBlue) : C.t2 }}>
                    <span style={{ color: isActive
                      ? (isVet ? "#7A5E00" : C.iBlue) : C.t3 }}>
                      {CAT_ICONS[i]}
                    </span>
                    {lang === "en" ? cat.label : cat.labelEs}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Emergency banners */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <a href="tel:911" style={{ textDecoration: "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14,
                padding: isMobile ? "14px 16px" : "16px 20px",
                borderRadius: 6, cursor: "pointer",
                background: C.redL, border: "1.5px solid " + C.iRed }}>
                <div style={{ width: 42, height: 42, borderRadius: 4,
                  background: C.iRed, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontFamily: F.heading, fontSize: 14,
                    fontWeight: 700, color: C.iWhite }}>911</span>
                </div>
                <div>
                  <div style={{ fontFamily: F.heading, fontSize: isMobile ? 15 : 16,
                    fontWeight: 700, color: C.iRed, letterSpacing: "0.02em" }}>
                    Physical Emergency
                  </div>
                  <div style={{ fontFamily: F.body, fontSize: isMobile ? 13 : 14,
                    color: "#8B0000", marginTop: 2, lineHeight: 1.4 }}>
                    {lang === "en"
                      ? "Chest pain, accident, immediate danger - Call 911"
                      : "Dolor de pecho, accidente, peligro inmediato - Llame al 911"}
                  </div>
                </div>
              </div>
            </a>

            <a href="tel:988" style={{ textDecoration: "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14,
                padding: isMobile ? "14px 16px" : "16px 20px",
                borderRadius: 6, cursor: "pointer",
                background: C.blueL, border: "1.5px solid " + C.iBlue }}>
                <div style={{ width: 42, height: 42, borderRadius: 4,
                  background: C.iBlue, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontFamily: F.heading, fontSize: 14,
                    fontWeight: 700, color: C.iWhite }}>988</span>
                </div>
                <div>
                  <div style={{ fontFamily: F.heading, fontSize: isMobile ? 15 : 16,
                    fontWeight: 700, color: C.iBlue, letterSpacing: "0.02em" }}>
                    Mental Health Crisis
                  </div>
                  <div style={{ fontFamily: F.body, fontSize: isMobile ? 13 : 14,
                    color: C.t2, marginTop: 2, lineHeight: 1.4 }}>
                    {lang === "en"
                      ? "Suicidal thoughts or emotional distress - Call or text 988"
                      : "Pensamientos suicidas o angustia - Llame o escriba al 988"}
                  </div>
                </div>
              </div>
            </a>
          </div>
        </div>

        {/* ── RIGHT — desktop only ── */}
        {!isMobile && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ fontFamily: F.body, fontSize: 18, fontWeight: 600,
              color: C.t2, marginBottom: 12 }}>
              {t.howTitle}
            </div>
            {[
              { icon: <IconStethoscope />, title: t.card1Title, body: t.card1Body, color: C.iBlue,   bg: C.blueL },
              { icon: <IconShield />,      title: t.card2Title, body: t.card2Body, color: "#7A5E00", bg: C.goldL },
              { icon: <IconBrain />,       title: t.card3Title, body: t.card3Body, color: C.t2,      bg: C.card  },
            ].map((card, i) => (
              <div key={i} style={{ background: C.iWhite, borderRadius: 6,
                border: "1px solid " + C.border, padding: "24px 26px",
                boxShadow: "0 2px 12px rgba(10,31,98,0.07)" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 6,
                    background: card.bg, display: "flex",
                    alignItems: "center", justifyContent: "center",
                    flexShrink: 0, color: card.color }}>
                    {card.icon}
                  </div>
                  <div>
                    <div style={{ fontFamily: F.heading, fontSize: 18,
                      fontWeight: 700, color: C.iBlue,
                      marginBottom: 6, letterSpacing: "0.01em" }}>
                      {card.title}
                    </div>
                    <div style={{ fontFamily: F.body, fontSize: 15,
                      color: C.t3, lineHeight: 1.7 }}>
                      {card.body}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ══ BOTTOM STRIP ════════════════════════════════════ */}
      <section style={{ width: "100%", background: C.iBlue,
        padding: isMobile ? "36px 18px" : "52px 56px",
        boxSizing: "border-box" }}>
        <div style={{ fontFamily: F.heading, fontSize: isMobile ? 13 : 14,
          fontWeight: 400, color: "#A8B8D8",
          textTransform: "uppercase", letterSpacing: "0.1em",
          marginBottom: isMobile ? 24 : 32 }}>
          {lang === "en" ? "Care Categories" : "Categorías de Atención"}
        </div>
        <div style={{ display: "grid",
          gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
          gap: isMobile ? 20 : 32 }}>
          {[
            { icon: <IconStethoscope />, label: lang === "en" ? "Family Care"   : "Atención Familiar", sub: lang === "en" ? "Primary care & clinics"     : "Atención primaria" },
            { icon: <IconBrain />,       label: lang === "en" ? "Mental Health" : "Salud Mental",      sub: lang === "en" ? "Counseling & crisis support" : "Consejería y apoyo" },
            { icon: <IconShield />,      label: lang === "en" ? "Veterans Care" : "Veteranos",         sub: lang === "en" ? "VA facilities & Vet Centers" : "Instalaciones VA" },
            { icon: <IconHeart />,       label: lang === "en" ? "No Insurance"  : "Sin Seguro",        sub: lang === "en" ? "Sliding-scale & free care"   : "Atención gratuita" },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex",
              flexDirection: isMobile ? "column" : "row",
              alignItems: "flex-start", gap: 14 }}>
              <div style={{ width: isMobile ? 44 : 48, height: isMobile ? 44 : 48,
                borderRadius: 6,
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: C.iWhite, flexShrink: 0 }}>
                {item.icon}
              </div>
              <div>
                <div style={{ fontFamily: F.heading,
                  fontSize: isMobile ? 15 : 17,
                  fontWeight: 700, color: C.iWhite,
                  letterSpacing: "0.01em" }}>
                  {item.label}
                </div>
                <div style={{ fontFamily: F.body,
                  fontSize: isMobile ? 12 : 14,
                  color: "#A8B8D8", marginTop: 4, lineHeight: 1.5 }}>
                  {item.sub}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}