"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { COLORS as C, FONTS as F, CATEGORIES } from "./lib/constants";
import { useVoice } from "./lib/useVoice";
import { VoiceButton } from "./lib/VoiceButton";

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

function IconMedal() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="14" r="6"/>
      <path d="M8 3h8l-1.5 5h-5L8 3z"/>
      <path d="M12 10v4"/>
      <path d="m10 13 2 2 2-2"/>
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

const CAT_ICONS = [
  <IconStethoscope key="f" />,   // 0 — Family Care
  <IconBrain       key="m" />,   // 1 — Mental Health
  <IconMedal       key="v" />,   // 2 — Veterans Care
  <IconAmbulance   key="e" />,   // 3 — Emergency
  <IconTooth       key="d" />,   // 4 — Dental
  <IconHeart       key="u" />,   // 5 — No Insurance
];

export default function Home() {
  const router = useRouter();

  const [query, setQuery]         = useState("");
  const [lang, setLang]           = useState<"en"|"es">("en");
  const [activeIdx, setActiveIdx] = useState<number|null>(null);
  const [isMobile, setIsMobile]   = useState(false);

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

  function toggleLang() {
    const next = lang === "en" ? "es" : "en";
    setLang(next);
    localStorage.setItem("rrLang", next);
  }

  // Search bar routes to AI Navigator
  function handleFindCare() {
    if (!query.trim()) return;
    router.push(`/navigator?q=${encodeURIComponent(query)}&lang=${lang}`);
  }

  // Category buttons go directly to results — fast path, no chat
  function handleCategoryClick(i: number, catId: string) {
    const newIdx = activeIdx === i ? null : i;
    setActiveIdx(newIdx);
    if (newIdx !== null) {
      router.push(`/results?cat=${catId}&lang=${lang}`);
    }
  }

  // Voice routes to AI Navigator
  const { voiceState, start: startVoice } = useVoice(
    lang,
    (text) => setQuery(text),
    (text) => router.push(`/navigator?q=${encodeURIComponent(text)}&lang=${lang}`)
  );

  const t = {
    appSub:      lang === "en" ? "AI Healthcare Finder" : "Buscador de Atencion Medica con IA",
    heading:     lang === "en" ? "What kind of care do you need?" : "Que tipo de atencion necesita?",
    sub:         lang === "en"
      ? "Describe your situation and our AI will find the right care near you."
      : "Describa su situacion y nuestra IA encontrara opciones cerca de usted.",
    placeholder: lang === "en"
      ? "e.g. I need a doctor who takes Medicaid in Iowa City"
      : "ej. Necesito un medico que acepte Medicaid en Iowa City",
    cta:         lang === "en" ? "Find Care" : "Buscar",
    orPick:      lang === "en" ? "Or choose a category" : "O elija una categoria",
  };

  const px = isMobile ? "18px" : "56px";
  const maxW = 760; // single column max width

  return (
    <main style={{ minHeight: "100vh", background: "#F4F6FB", fontFamily: F.body }}>

      {/* TOP NAV */}
      <nav style={{ width: "100%", background: C.iBlue,
        padding: "0 " + px, boxSizing: "border-box",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: isMobile ? 68 : 80,
        borderBottom: "3px solid #1A3A7A" }}>
        <div>
          <div style={{ fontFamily: F.heading, fontSize: isMobile ? 24 : 32,
            fontWeight: 700, color: C.iWhite, letterSpacing: "0.01em" }}>
            Iowa Rural Reach
          </div>
          <div style={{ fontFamily: F.body, fontSize: isMobile ? 12 : 14,
            color: "#A8B8D8", marginTop: 2 }}>
            {t.appSub}
          </div>
        </div>
        <button onClick={toggleLang}
          style={{ background: "transparent",
            border: "1.5px solid rgba(255,255,255,0.3)",
            borderRadius: 4, color: C.iWhite,
            padding: "6px 14px", fontFamily: F.body,
            fontSize: 13, fontWeight: 600, cursor: "pointer",
            letterSpacing: "0.06em" }}>
          {lang === "en" ? "ES" : "EN"}
        </button>
      </nav>

      {/* MAIN CONTENT — single column, centered */}
      <section style={{
        padding: isMobile ? "32px 18px 40px" : "56px 56px 64px",
        boxSizing: "border-box",
        maxWidth: maxW + 112, // maxW + 2*px
        margin: "0 auto",
        width: "100%",
      }}>

        {/* Heading */}
        <h1 style={{ fontFamily: F.heading, fontSize: isMobile ? 28 : 46,
          fontWeight: 700, color: C.iBlue, margin: "0 0 12px",
          lineHeight: 1.1, letterSpacing: "0.01em" }}>
          {t.heading}
        </h1>
        <p style={{ fontFamily: F.body, fontSize: isMobile ? 15 : 18,
          color: C.t3, margin: "0 0 28px", lineHeight: 1.6, maxWidth: maxW }}>
          {t.sub}
        </p>

        {/* Search bar */}
        <div style={{ display: "flex", gap: 10, marginBottom: 10, maxWidth: maxW }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10,
            background: C.iWhite, borderRadius: 4,
            border: "1.5px solid " + C.borderM,
            padding: "0 16px", minHeight: isMobile ? 52 : 60,
            boxShadow: "0 2px 12px rgba(10,31,98,0.08)" }}>
            <VoiceButton voiceState={voiceState} onStart={startVoice} size={isMobile ? 36 : 40} />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleFindCare()}
              placeholder={t.placeholder}
              style={{ flex: 1, border: "none", outline: "none",
                fontFamily: F.body, fontSize: isMobile ? 15 : 17,
                color: C.t2, background: "transparent", minWidth: 0 }} />
          </div>
          <button onClick={handleFindCare}
            style={{ background: C.iBlue, color: C.iWhite, border: "none",
              borderRadius: 4, padding: isMobile ? "0 18px" : "0 28px",
              fontFamily: F.heading, fontSize: isMobile ? 15 : 17,
              fontWeight: 700, cursor: "pointer",
              letterSpacing: "0.04em", minHeight: isMobile ? 52 : 60,
              whiteSpace: "nowrap" }}>
            {t.cta}
          </button>
        </div>

        {/* Helper text */}
        <p style={{ fontFamily: F.body, fontSize: 13, color: C.t4,
          margin: "0 0 36px", lineHeight: 1.5, maxWidth: maxW }}>
          {lang === "en"
            ? "Type or speak — our AI will guide you to the right care and show you nearby clinics on a map."
            : "Escriba o hable — nuestra IA le guiara y le mostrara clinicas cercanas en un mapa."}
        </p>

        {/* Category buttons — full width, direct to results */}
        <div style={{ marginBottom: 36, maxWidth: maxW }}>
          <div style={{ fontFamily: F.body, fontSize: isMobile ? 12 : 13,
            fontWeight: 600, color: C.t3, textTransform: "uppercase",
            letterSpacing: "0.08em", marginBottom: 14 }}>
            {t.orPick}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: isMobile ? 8 : 10 }}>
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
                    cursor: "pointer", transition: "all 0.15s", minHeight: 48,
                    border: "1.5px solid " + (isActive ? (isVet ? C.gold : C.iBlue) : C.border),
                    background: isActive ? (isVet ? C.goldL : C.blueL) : C.iWhite,
                    color: isActive ? (isVet ? "#7A5E00" : C.iBlue) : C.t2 }}>
                  <span style={{ color: isActive ? (isVet ? "#7A5E00" : C.iBlue) : C.t3 }}>
                    {CAT_ICONS[i]}
                  </span>
                  {lang === "en" ? cat.label : cat.labelEs}
                </button>
              );
            })}
          </div>
        </div>

        {/* Emergency pills — compact, side by side */}
        <div style={{ display: "flex", gap: 10, maxWidth: maxW, flexWrap: "wrap" }}>
          <a href="tel:911" style={{ textDecoration: "none", flex: "1 1 auto", minWidth: 150 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10,
              padding: "10px 14px", borderRadius: 6, cursor: "pointer",
              background: C.redL, border: "1.5px solid " + C.iRed }}>
              <div style={{ width: 34, height: 34, borderRadius: 4,
                background: C.iRed, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontFamily: F.heading, fontSize: 13,
                  fontWeight: 700, color: C.iWhite }}>911</span>
              </div>
              <div>
                <div style={{ fontFamily: F.heading, fontSize: 14,
                  fontWeight: 700, color: C.iRed, letterSpacing: "0.02em" }}>
                  {lang === "en" ? "Physical Emergency" : "Emergencia Fisica"}
                </div>
                <div style={{ fontFamily: F.body, fontSize: 12,
                  color: "#8B0000", marginTop: 1, lineHeight: 1.3 }}>
                  {lang === "en" ? "Call 911" : "Llame al 911"}
                </div>
              </div>
            </div>
          </a>
          <a href="tel:988" style={{ textDecoration: "none", flex: "1 1 auto", minWidth: 150 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10,
              padding: "10px 14px", borderRadius: 6, cursor: "pointer",
              background: C.blueL, border: "1.5px solid " + C.iBlue }}>
              <div style={{ width: 34, height: 34, borderRadius: 4,
                background: C.iBlue, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontFamily: F.heading, fontSize: 13,
                  fontWeight: 700, color: C.iWhite }}>988</span>
              </div>
              <div>
                <div style={{ fontFamily: F.heading, fontSize: 14,
                  fontWeight: 700, color: C.iBlue, letterSpacing: "0.02em" }}>
                  {lang === "en" ? "Mental Health Crisis" : "Crisis de Salud Mental"}
                </div>
                <div style={{ fontFamily: F.body, fontSize: 12,
                  color: C.t2, marginTop: 1, lineHeight: 1.3 }}>
                  {lang === "en" ? "Call or text 988" : "Llame o escriba al 988"}
                </div>
              </div>
            </div>
          </a>
        </div>
      </section>

      {/* BOTTOM STRIP */}
      <section style={{ width: "100%", background: C.iBlue,
        padding: isMobile ? "36px 18px" : "52px 56px",
        boxSizing: "border-box" }}>
        <div style={{ fontFamily: F.heading, fontSize: isMobile ? 13 : 14,
          fontWeight: 400, color: "#A8B8D8",
          textTransform: "uppercase", letterSpacing: "0.1em",
          marginBottom: isMobile ? 24 : 32 }}>
          {lang === "en" ? "Care Categories" : "Categorias de Atencion"}
        </div>
        <div style={{ display: "grid",
          gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
          gap: isMobile ? 20 : 32 }}>
          {[
            { icon: <IconStethoscope />, label: lang === "en" ? "Family Care"   : "Atencion Familiar", sub: lang === "en" ? "Primary care & clinics"     : "Atencion primaria" },
            { icon: <IconBrain />,       label: lang === "en" ? "Mental Health" : "Salud Mental",      sub: lang === "en" ? "Counseling & crisis support" : "Consejeria y apoyo" },
            { icon: <IconMedal />,        label: lang === "en" ? "Veterans Care" : "Veteranos",         sub: lang === "en" ? "VA facilities & Vet Centers" : "Instalaciones VA" },
            { icon: <IconHeart />,       label: lang === "en" ? "No Insurance"  : "Sin Seguro",        sub: lang === "en" ? "Sliding-scale & free care"   : "Atencion gratuita" },
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
                <div style={{ fontFamily: F.heading, fontSize: isMobile ? 15 : 17,
                  fontWeight: 700, color: C.iWhite, letterSpacing: "0.01em" }}>
                  {item.label}
                </div>
                <div style={{ fontFamily: F.body, fontSize: isMobile ? 12 : 14,
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
