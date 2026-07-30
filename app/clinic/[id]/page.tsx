"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { COLORS as C, FONTS as F } from "../../lib/constants";
import { MOCK_CLINICS } from "../../lib/mockClinics";
import { Clinic } from "../../lib/types";

function IconArrowLeft() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>
    </svg>
  );
}

function IconPhone() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.21h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.81a16 16 0 0 0 6.29 6.29l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  );
}

function IconMap() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  );
}

function IconVideo() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m22 8-6 4 6 4V8z"/>
      <rect width="14" height="12" x="2" y="6" rx="2" ry="2"/>
    </svg>
  );
}

function IconShield() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <path d="m9 12 2 2 4-4"/>
    </svg>
  );
}

function IconClock() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 6v6l4 2"/>
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5"/>
    </svg>
  );
}

function getTypeProps(type: Clinic["type"]) {
  const map = {
    family:    { color: C.iBlue,   bg: C.blueL,  label: "Family Care"   },
    mental:    { color: "#166534", bg: "#DCFCE7", label: "Mental Health" },
    dental:    { color: "#6B21A8", bg: "#F3E8FF", label: "Dental"        },
    veteran:   { color: "#7A5E00", bg: C.goldL,   label: "Veterans Care" },
    er:        { color: C.iRed,    bg: C.redL,    label: "Emergency"     },
    uninsured: { color: "#166534", bg: "#DCFCE7", label: "No Insurance"  },
  };
  return map[type];
}

function getVisitPrep(clinic: Clinic, lang: "en" | "es") {
  const isVet     = clinic.type === "veteran";
  const isMental  = clinic.type === "mental";
  const isSliding = clinic.sliding;

  const bringEn = [
    "Photo ID",
    isVet     ? "DD-214 discharge papers"    : "Insurance card (if you have one)",
    isSliding ? "Proof of income (pay stub)" : "Insurance card",
    "List of current medications",
    "Any prior medical records relevant to your visit",
  ];
  const bringEs = [
    "Identificacion con foto",
    isVet     ? "Papeles de baja militar DD-214" : "Tarjeta de seguro (si tiene)",
    isSliding ? "Comprobante de ingresos"         : "Tarjeta de seguro",
    "Lista de medicamentos actuales",
    "Registros medicos anteriores relevantes",
  ];
  const askEn = [
    isSliding ? "What will my visit cost based on my income?" : "What does this visit cost with my insurance?",
    isMental  ? "Do you offer ongoing counseling sessions?"   : "Can I schedule follow-up visits here?",
    clinic.telehealth ? "Can follow-up appointments be done by telehealth?" : "Do you offer any telehealth options?",
    isVet     ? "Am I eligible for VA benefits here?"         : "What services are covered at this clinic?",
    "How long is the typical wait time for an appointment?",
  ];
  const askEs = [
    isSliding ? "Cuanto costara mi visita segun mis ingresos?" : "Que cuesta esta visita con mi seguro?",
    isMental  ? "Ofrecen sesiones de consejeria continua?"     : "Puedo programar visitas de seguimiento?",
    clinic.telehealth ? "Las citas de seguimiento pueden ser por telesalud?" : "Ofrecen opciones de telesalud?",
    isVet     ? "Soy elegible para beneficios VA aqui?"        : "Que servicios estan cubiertos en esta clinica?",
    "Cual es el tiempo de espera tipico para una cita?",
  ];
  return {
    bring: lang === "en" ? bringEn : bringEs,
    ask:   lang === "en" ? askEn   : askEs,
  };
}

function ClinicDetailInner() {
  const router       = useRouter();
  const params       = useParams();
  const searchParams = useSearchParams();
  const id           = params.id as string;
  const langParam    = (searchParams.get("lang") ?? "en") as "en" | "es";

  const [lang, setLang] = useState<"en"|"es">(langParam);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("rrLang") as "en"|"es" | null;
    if (saved) setLang(saved);
  }, []);

  const [activeTab, setActiveTab] = useState<"details"|"insurance"|"prep">("details");

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const clinic = MOCK_CLINICS.find(c => c.id === id);

  if (!clinic) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center",
        justifyContent: "center", fontFamily: F.body, color: C.t3 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: F.heading, fontSize: 28, color: C.iBlue, marginBottom: 12 }}>
            Clinic not found
          </div>
          <button onClick={() => router.push(`/results?lang=${lang}`)}
            style={{ background: C.iBlue, color: C.iWhite, border: "none",
              borderRadius: 4, padding: "12px 24px", fontFamily: F.heading,
              fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
            Back to Results
          </button>
        </div>
      </div>
    );
  }

  const tp   = getTypeProps(clinic.type);
  const prep = getVisitPrep(clinic, lang);
  const px   = isMobile ? "18px" : "48px";

  const tabs = [
    { id: "details",   label: lang === "en" ? "Details"    : "Detalles"    },
    { id: "insurance", label: lang === "en" ? "Insurance"  : "Seguro"      },
    { id: "prep",      label: lang === "en" ? "Visit Prep" : "Preparacion" },
  ] as const;

  return (
    <main style={{ minHeight: "100vh", background: "#F4F6FB", fontFamily: F.body }}>

      {/* NAV */}
      <nav style={{ width: "100%", background: C.iBlue,
        padding: "0 " + px, boxSizing: "border-box",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: isMobile ? 60 : 72, borderBottom: "3px solid #1A3A7A" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={() => router.push(`/results?lang=${lang}`)}
            style={{ display: "flex", alignItems: "center", gap: 8,
              background: "transparent", border: "none", color: "#A8B8D8",
              cursor: "pointer", fontFamily: F.body, fontSize: 14,
              minHeight: 44, padding: "0 4px" }}>
            <IconArrowLeft />
            {!isMobile && (lang === "en" ? "Back" : "Volver")}
          </button>
          <div style={{ width: 1, height: 24, background: "#2A4A8A" }} />
          <span style={{ fontFamily: F.heading, fontSize: isMobile ? 18 : 22,
            fontWeight: 700, color: C.iWhite }}>
            Iowa Rural Reach
          </span>
        </div>
        <div style={{ fontSize: 13, fontFamily: F.body,
          padding: "6px 12px", borderRadius: 4,
          border: "1px solid #3A5A9A", color: "#A8B8D8" }}>
          {lang === "en" ? "EN" : "ES"}
        </div>
      </nav>

      {/* CLINIC HEADER */}
      <div style={{ background: C.iWhite, borderBottom: "1px solid " + C.border }}>
        <div style={{ height: 5, background: tp.color }} />
        <div style={{ padding: isMobile ? "20px 18px" : "32px 48px" }}>
          <div style={{ marginBottom: 20 }}>
            <h1 style={{ fontFamily: F.heading, fontSize: isMobile ? 22 : 32,
              fontWeight: 700, color: C.iBlue,
              margin: "0 0 12px", lineHeight: 1.15, letterSpacing: "0.01em" }}>
              {clinic.name}
            </h1>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              <span style={{ fontSize: 13, fontFamily: F.body,
                fontWeight: 500, color: tp.color, background: tp.bg,
                padding: "4px 12px", borderRadius: 4 }}>
                {tp.label}
              </span>
              <span style={{ fontSize: 13, fontFamily: F.body, fontWeight: 500,
                color: clinic.open ? "#166534" : C.t3,
                background: clinic.open ? "#DCFCE7" : "#F3F4F6",
                padding: "4px 12px", borderRadius: 4 }}>
                {clinic.open
                  ? (lang === "en" ? "Open Now" : "Abierto Ahora")
                  : (lang === "en" ? "Closed"   : "Cerrado")}
              </span>
              {clinic.telehealth && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5,
                  fontSize: 13, fontFamily: F.body, fontWeight: 500,
                  color: "#1D4ED8", background: "#EFF6FF", padding: "4px 12px", borderRadius: 4 }}>
                  <IconVideo />
                  {lang === "en" ? "Telehealth Available" : "Telesalud Disponible"}
                </span>
              )}
              {clinic.sliding && (
                <span style={{ fontSize: 13, fontFamily: F.body, fontWeight: 500,
                  color: "#166534", background: "#DCFCE7", padding: "4px 12px", borderRadius: 4 }}>
                  {lang === "en" ? "Sliding Scale Fees" : "Escala Movil de Tarifas"}
                </span>
              )}
              {clinic.type === "veteran" && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5,
                  fontSize: 13, fontFamily: F.body, fontWeight: 500,
                  color: "#7A5E00", background: C.goldL, padding: "4px 12px", borderRadius: 4 }}>
                  <IconShield />
                  {lang === "en" ? "Veterans Specialized" : "Especializado en Veteranos"}
                </span>
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: isMobile ? "wrap" : "nowrap" }}>
            <a href={"tel:" + clinic.phone}
              style={{ textDecoration: "none", flex: isMobile ? "1 1 100%" : "0 0 auto" }}>
              <button style={{ width: "100%", display: "flex", alignItems: "center",
                justifyContent: "center", gap: 10,
                padding: isMobile ? "13px 20px" : "13px 28px",
                borderRadius: 4, background: C.iBlue, color: C.iWhite, border: "none",
                fontFamily: F.heading, fontSize: isMobile ? 15 : 16,
                fontWeight: 700, cursor: "pointer", letterSpacing: "0.02em", minHeight: 52 }}>
                <IconPhone /> {clinic.phone}
              </button>
            </a>
            <a href={"https://maps.google.com/?q=" + encodeURIComponent(clinic.address)}
              target="_blank" rel="noreferrer"
              style={{ textDecoration: "none", flex: isMobile ? "1 1 100%" : "0 0 auto" }}>
              <button style={{ width: "100%", display: "flex", alignItems: "center",
                justifyContent: "center", gap: 10,
                padding: isMobile ? "13px 20px" : "13px 28px",
                borderRadius: 4, background: C.iWhite, color: C.iBlue,
                border: "1.5px solid " + C.iBlue,
                fontFamily: F.heading, fontSize: isMobile ? 15 : 16,
                fontWeight: 700, cursor: "pointer", letterSpacing: "0.02em", minHeight: 52 }}>
                <IconMap />
                {lang === "en" ? "Get Directions" : "Obtener Indicaciones"}
              </button>
            </a>
          </div>
        </div>

        {/* TABS */}
        <div style={{ display: "flex", borderTop: "1px solid " + C.border, padding: "0 " + px }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{ padding: isMobile ? "12px 16px" : "14px 24px",
                fontFamily: F.body, fontSize: isMobile ? 14 : 15,
                fontWeight: activeTab === tab.id ? 600 : 400,
                border: "none", background: "none", cursor: "pointer",
                color: activeTab === tab.id ? C.iBlue : C.t3,
                borderBottom: activeTab === tab.id
                  ? "3px solid " + C.iBlue : "3px solid transparent",
                transition: "all 0.15s", minHeight: 48 }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB CONTENT */}
      <div style={{ padding: isMobile ? "20px 18px" : "32px 48px",
        maxWidth: 860, boxSizing: "border-box" }}>

        {activeTab === "details" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: C.iWhite, borderRadius: 6,
              border: "1px solid " + C.border, padding: "20px 24px" }}>
              <div style={{ fontFamily: F.heading, fontSize: 14, fontWeight: 600,
                color: C.t3, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
                {lang === "en" ? "Location" : "Ubicacion"}
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ color: C.iBlue, flexShrink: 0, marginTop: 2 }}><IconMap /></span>
                <div>
                  <div style={{ fontFamily: F.body, fontSize: isMobile ? 15 : 16,
                    color: C.t2, lineHeight: 1.5 }}>{clinic.address}</div>
                  <div style={{ fontFamily: F.body, fontSize: isMobile ? 13 : 14,
                    color: C.t3, marginTop: 4 }}>
                    {clinic.distance} {lang === "en" ? "from your location" : "de su ubicacion"}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ background: C.iWhite, borderRadius: 6,
              border: "1px solid " + C.border, padding: "20px 24px" }}>
              <div style={{ fontFamily: F.heading, fontSize: 14, fontWeight: 600,
                color: C.t3, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
                {lang === "en" ? "Hours" : "Horario"}
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ color: C.iBlue }}><IconClock /></span>
                <div>
                  <div style={{ fontFamily: F.body, fontSize: isMobile ? 15 : 16, color: C.t2 }}>
                    {lang === "en" ? "Monday - Friday: 8:00 AM - 5:00 PM" : "Lunes - Viernes: 8:00 AM - 5:00 PM"}
                  </div>
                  <div style={{ fontFamily: F.body, fontSize: isMobile ? 13 : 14, color: C.t3, marginTop: 4 }}>
                    {lang === "en" ? "Saturday: 9:00 AM - 12:00 PM  Sunday: Closed" : "Sabado: 9:00 AM - 12:00 PM  Domingo: Cerrado"}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ background: C.iWhite, borderRadius: 6,
              border: "1px solid " + C.border, padding: "20px 24px" }}>
              <div style={{ fontFamily: F.heading, fontSize: 14, fontWeight: 600,
                color: C.t3, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>
                {lang === "en" ? "Services Offered" : "Servicios Disponibles"}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {clinic.services.map(svc => (
                  <span key={svc} style={{ display: "inline-flex", alignItems: "center", gap: 6,
                    fontFamily: F.body, fontSize: isMobile ? 13 : 14,
                    color: C.iBlue, background: C.blueL,
                    padding: "6px 14px", borderRadius: 4, fontWeight: 500 }}>
                    <span style={{ color: C.iBlue }}><IconCheck /></span>{svc}
                  </span>
                ))}
              </div>
            </div>

            {clinic.telehealth && (
              <div style={{ background: "#EFF6FF", borderRadius: 6,
                border: "1px solid #BFDBFE", padding: "20px 24px",
                display: "flex", gap: 14, alignItems: "flex-start" }}>
                <span style={{ color: "#1D4ED8", flexShrink: 0, marginTop: 2 }}><IconVideo /></span>
                <div>
                  <div style={{ fontFamily: F.heading, fontSize: 16,
                    fontWeight: 700, color: "#1D4ED8", marginBottom: 4 }}>
                    {lang === "en" ? "Telehealth Available" : "Telesalud Disponible"}
                  </div>
                  <div style={{ fontFamily: F.body, fontSize: isMobile ? 13 : 14,
                    color: "#1E3A8A", lineHeight: 1.6 }}>
                    {lang === "en"
                      ? "You can schedule a virtual appointment with this clinic. No need to drive — meet with a provider from your phone or computer."
                      : "Puede programar una cita virtual. No necesita manejar — reunase con un proveedor desde su telefono o computadora."}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "insurance" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: C.iWhite, borderRadius: 6,
              border: "1px solid " + C.border, padding: "20px 24px" }}>
              <div style={{ fontFamily: F.heading, fontSize: 14, fontWeight: 600,
                color: C.t3, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>
                {lang === "en" ? "Accepted Insurance" : "Seguro Aceptado"}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {clinic.insurance.map(ins => (
                  <span key={ins} style={{ display: "inline-flex", alignItems: "center", gap: 6,
                    fontFamily: F.body, fontSize: isMobile ? 14 : 15,
                    color: "#166534", background: "#DCFCE7",
                    padding: "8px 16px", borderRadius: 4, fontWeight: 500 }}>
                    <IconCheck />{ins}
                  </span>
                ))}
              </div>
            </div>

            {clinic.sliding && (
              <div style={{ background: "#DCFCE7", borderRadius: 6,
                border: "1px solid #86EFAC", padding: "20px 24px" }}>
                <div style={{ fontFamily: F.heading, fontSize: 17,
                  fontWeight: 700, color: "#166534", marginBottom: 8 }}>
                  {lang === "en" ? "No Insurance? You Still Qualify" : "Sin Seguro? Aun Califica"}
                </div>
                <div style={{ fontFamily: F.body, fontSize: isMobile ? 14 : 15,
                  color: "#14532D", lineHeight: 1.7 }}>
                  {lang === "en"
                    ? "This clinic uses a sliding scale fee system. You pay based on your income level — even if you have no insurance at all. No one is turned away due to inability to pay."
                    : "Esta clinica usa un sistema de tarifas de escala movil. Usted paga segun su nivel de ingresos. No se rechaza a nadie por falta de pago."}
                </div>
              </div>
            )}

            <div style={{ background: C.card, borderRadius: 6,
              border: "1px solid " + C.border, padding: "16px 20px" }}>
              <div style={{ fontFamily: F.body, fontSize: isMobile ? 13 : 14,
                color: C.t3, lineHeight: 1.7 }}>
                {lang === "en"
                  ? "Insurance coverage may vary. We recommend calling the clinic ahead of your visit to confirm your specific plan is accepted."
                  : "La cobertura del seguro puede variar. Recomendamos llamar a la clinica antes de su visita para confirmar que su plan especifico es aceptado."}
              </div>
            </div>
          </div>
        )}

        {activeTab === "prep" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10,
              padding: "12px 16px", background: C.blueL,
              borderRadius: 6, border: "1px solid " + C.borderM }}>
              <div style={{ fontFamily: F.body, fontSize: isMobile ? 13 : 14,
                color: C.iBlue, lineHeight: 1.5 }}>
                {lang === "en"
                  ? "Prep checklist based on this clinic type. Always confirm details with the clinic directly."
                  : "Lista de preparacion segun este tipo de clinica. Confirme siempre los detalles directamente con la clinica."}
              </div>
            </div>

            <div style={{ display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
              <div style={{ background: C.iWhite, borderRadius: 6,
                border: "1px solid " + C.border, padding: "20px 24px" }}>
                <div style={{ fontFamily: F.heading, fontSize: 16, fontWeight: 700,
                  color: C.iBlue, marginBottom: 14, letterSpacing: "0.01em" }}>
                  {lang === "en" ? "What to Bring" : "Que Llevar"}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {prep.bring.map((item, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <div style={{ width: 22, height: 22, borderRadius: 4, background: C.blueL,
                        flexShrink: 0, display: "flex", alignItems: "center",
                        justifyContent: "center", color: C.iBlue, marginTop: 1 }}>
                        <IconCheck />
                      </div>
                      <span style={{ fontFamily: F.body, fontSize: isMobile ? 14 : 15,
                        color: C.t2, lineHeight: 1.5 }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: C.iWhite, borderRadius: 6,
                border: "1px solid " + C.border, padding: "20px 24px" }}>
                <div style={{ fontFamily: F.heading, fontSize: 16, fontWeight: 700,
                  color: C.iBlue, marginBottom: 14, letterSpacing: "0.01em" }}>
                  {lang === "en" ? "Questions to Ask" : "Preguntas para Hacer"}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {prep.ask.map((q, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <div style={{ width: 22, height: 22, borderRadius: 4, background: C.goldL,
                        flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                        fontFamily: F.heading, fontSize: 12, fontWeight: 700,
                        color: "#7A5E00", marginTop: 1 }}>?</div>
                      <span style={{ fontFamily: F.body, fontSize: isMobile ? 14 : 15,
                        color: C.t2, lineHeight: 1.5 }}>{q}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* EMERGENCY FOOTER */}
      <div style={{ background: C.iWhite, borderTop: "1px solid " + C.border,
        padding: isMobile ? "16px 18px" : "20px 48px",
        display: "flex", flexDirection: isMobile ? "column" : "row", gap: 12, marginTop: 20 }}>
        <a href="tel:911" style={{ textDecoration: "none", flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
            borderRadius: 6, background: C.redL, border: "1.5px solid " + C.iRed }}>
            <div style={{ width: 40, height: 40, borderRadius: 4, background: C.iRed,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontFamily: F.heading, fontSize: 13, fontWeight: 700, color: C.iWhite }}>911</span>
            </div>
            <div>
              <div style={{ fontFamily: F.heading, fontSize: 15, fontWeight: 700, color: C.iRed }}>
                {lang === "en" ? "Physical Emergency" : "Emergencia Fisica"}
              </div>
              <div style={{ fontFamily: F.body, fontSize: 13, color: "#8B0000", marginTop: 1 }}>
                {lang === "en" ? "Immediate danger - Call 911" : "Peligro inmediato - Llame al 911"}
              </div>
            </div>
          </div>
        </a>
        <a href="tel:988" style={{ textDecoration: "none", flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
            borderRadius: 6, background: C.blueL, border: "1.5px solid " + C.iBlue }}>
            <div style={{ width: 40, height: 40, borderRadius: 4, background: C.iBlue,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontFamily: F.heading, fontSize: 13, fontWeight: 700, color: C.iWhite }}>988</span>
            </div>
            <div>
              <div style={{ fontFamily: F.heading, fontSize: 15, fontWeight: 700, color: C.iBlue }}>
                {lang === "en" ? "Mental Health Crisis" : "Crisis de Salud Mental"}
              </div>
              <div style={{ fontFamily: F.body, fontSize: 13, color: C.t2, marginTop: 1 }}>
                {lang === "en" ? "Call or text 988" : "Llame o escriba al 988"}
              </div>
            </div>
          </div>
        </a>
      </div>
    </main>
  );
}

export default function ClinicDetailPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center",
        justifyContent: "center", fontFamily: "'Roboto', sans-serif", color: "#5A6A8A" }}>
        Loading...
      </div>
    }>
      <ClinicDetailInner />
    </Suspense>
  );
}
