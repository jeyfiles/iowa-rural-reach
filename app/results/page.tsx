"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { COLORS as C, FONTS as F, CATEGORIES } from "../lib/constants";
import { translateService, translateInsurance } from "../lib/translations";
// import { MOCK_CLINICS } from "../lib/mockClinics"; // kept for reference / fallback
import { Clinic } from "../lib/types";
import { useVoice } from "../lib/useVoice";
import { VoiceButton } from "../lib/VoiceButton";
import { normalizeLocation } from "../lib/locationUtils";
import { parseSearch } from "../lib/careIntent";
import { StoredLoc, readStoredLoc, writeStoredLoc } from "../lib/storedLocation";
import RequestChangeModal, { ReportedClinic } from "../components/RequestChangeModal";

function IconStethoscope({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6 6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.3.3 0 1 0 .2.3"/>
      <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/>
      <circle cx="20" cy="10" r="2"/>
    </svg>
  );
}

function IconBrain({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.44-4.24z"/>
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.44-4.24z"/>
    </svg>
  );
}

function IconTooth({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5.5c-1.5-2-4-2.5-5.5-1S4 8 4.5 10c.3 1.2.5 2.5.5 4 0 2 .5 4 2 4s2-2 2-3.5c0-.8.7-1.5 1.5-1.5h.5c.8 0 1.5.7 1.5 1.5 0 1.5.5 3.5 2 3.5s2-2 2-4c0-1.5.2-2.8.5-4 .5-2 0-4-1-5S13.5 3.5 12 5.5z"/>
    </svg>
  );
}

function IconMedal({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="14" r="6"/>
      <path d="M8 3h8l-1.5 5h-5L8 3z"/>
      <path d="M12 10v4"/>
      <path d="m10 13 2 2 2-2"/>
    </svg>
  );
}

function IconAmbulance({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 17H2V7a2 2 0 0 1 2-2h6"/>
      <path d="M14 9h4l3 3v5h-7V9z"/>
      <circle cx="7" cy="17" r="2"/>
      <circle cx="17" cy="17" r="2"/>
      <path d="M5 9h4M7 7v4"/>
    </svg>
  );
}

function IconHeart({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
    </svg>
  );
}

// Chiropractic — spine (same 24-grid / 1.8 stroke style as the set above)
function IconSpine({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8.5" y="2.5" width="7" height="3.5" rx="1.5"/>
      <rect x="8" y="7.5" width="8" height="3.5" rx="1.5"/>
      <rect x="8" y="12.5" width="8" height="3.5" rx="1.5"/>
      <rect x="8.5" y="17.5" width="7" height="3.5" rx="1.5"/>
      <path d="M5.5 9.25h2.5M16 9.25h2.5M5.5 14.25h2.5M16 14.25h2.5"/>
    </svg>
  );
}

function IconPhone({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.21h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.81a16 16 0 0 0 6.29 6.29l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  );
}

function IconMapPin({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  );
}

function IconVideo({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m22 8-6 4 6 4V8z"/>
      <rect width="14" height="12" x="2" y="6" rx="2" ry="2"/>
    </svg>
  );
}

function IconArrowLeft({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 19-7-7 7-7"/>
      <path d="M19 12H5"/>
    </svg>
  );
}

function IconList({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6"/>
      <line x1="8" y1="12" x2="21" y2="12"/>
      <line x1="8" y1="18" x2="21" y2="18"/>
      <line x1="3" y1="6" x2="3.01" y2="6"/>
      <line x1="3" y1="12" x2="3.01" y2="12"/>
      <line x1="3" y1="18" x2="3.01" y2="18"/>
    </svg>
  );
}

function IconMap({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
      <line x1="9" y1="3" x2="9" y2="18"/>
      <line x1="15" y1="6" x2="15" y2="21"/>
    </svg>
  );
}

// ── getTypeProps with lang support ───────────────────────────────
function getTypeProps(type: Clinic["type"], lang: "en"|"es" = "en") {
  const map = {
    family:    { icon: <IconStethoscope />, color: C.iBlue,   bg: C.blueL,   label: lang === "en" ? "Family Care"   : "Atencion Familiar", pinColor: "#0A1F62" },
    mental:    { icon: <IconBrain />,       color: "#166534", bg: "#DCFCE7", label: lang === "en" ? "Mental Health" : "Salud Mental",       pinColor: "#166534" },
    dental:    { icon: <IconTooth />,       color: "#6B21A8", bg: "#F3E8FF", label: lang === "en" ? "Dental"        : "Dental",             pinColor: "#6B21A8" },
    veteran:   { icon: <IconMedal />,       color: "#7A5E00", bg: C.goldL,   label: lang === "en" ? "Veterans Care" : "Veteranos",          pinColor: "#B45309" },
    er:        { icon: <IconAmbulance />,   color: C.iRed,    bg: C.redL,    label: lang === "en" ? "Emergency"     : "Emergencia",         pinColor: "#D80025" },
    uninsured: { icon: <IconHeart />,       color: "#166534", bg: "#DCFCE7", label: lang === "en" ? "No Insurance"  : "Sin Seguro",         pinColor: "#166534" },
    chiro:     { icon: <IconSpine />,       color: "#0F766E", bg: "#CCFBF1", label: lang === "en" ? "Chiropractic"  : "Quiropractico",      pinColor: "#0F766E" },
  };
  return map[type];
}

// ── Loading skeleton ─────────────────────────────────────────────
function LoadingSkeleton({ isMobile }: { isMobile: boolean }) {
  return (
    <div style={{ padding: isMobile ? "20px 18px" : "32px 48px" }}>
      <div style={{ fontFamily: F.body, fontSize: 14, color: C.t3,
        marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 16, height: 16, borderRadius: "50%",
          border: "2px solid " + C.iBlue, borderTopColor: "transparent",
          animation: "spin 0.8s linear infinite" }} />
        Finding care near you...
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
      <div style={{ display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
        gap: isMobile ? 16 : 20 }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{ background: C.iWhite, borderRadius: 6,
            border: "1.5px solid " + C.border, overflow: "hidden", height: 200,
            animation: "pulse 1.5s ease-in-out infinite" }}>
            <div style={{ height: 4, background: C.border }} />
            <div style={{ padding: "20px 24px" }}>
              <div style={{ height: 20, background: C.card, borderRadius: 4, marginBottom: 12, width: "70%" }} />
              <div style={{ height: 14, background: C.card, borderRadius: 4, marginBottom: 8, width: "50%" }} />
              <div style={{ height: 14, background: C.card, borderRadius: 4, width: "90%" }} />
            </div>
            <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }`}</style>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Lite Mode loading — plain text, no animation ─────────────────
function LiteLoadingSkeleton() {
  return (
    <div style={{ padding: "16px 18px", fontFamily: F.body,
      fontSize: 15, color: C.t2 }}>
      Finding care near you...
    </div>
  );
}

// ── Lite Mode clinic card — text only, no images or animations ───
// Designed for slow 2G/3G connections — minimal CSS, fast render
function LiteClinicCard({ clinic, lang, onClick, onReport }: {
  clinic: Clinic; lang: "en"|"es"; onClick: () => void; onReport: (c: ReportedClinic) => void;
}) {
  const tp = getTypeProps(clinic.type, lang);
  return (
    <div onClick={onClick}
      style={{ background: C.iWhite, border: "1px solid " + C.border,
        borderLeft: "4px solid " + tp.color,
        padding: "14px 16px", marginBottom: 10, cursor: "pointer" }}>
      <div style={{ display: "flex", justifyContent: "space-between",
        alignItems: "flex-start", gap: 8, marginBottom: 4 }}>
        <div style={{ fontFamily: F.heading, fontSize: 16, fontWeight: 700,
          color: C.iBlue }}>
          {clinic.name}
        </div>
        <button
          onClick={e => { e.stopPropagation(); onReport({ name: clinic.name, address: clinic.address }); }}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 0, flexShrink: 0,
            fontFamily: F.body, fontSize: 12, fontWeight: 600, color: C.iBlue,
            textDecoration: "underline", whiteSpace: "nowrap" }}>
          {lang === "en" ? "Request Change" : "Solicitar Cambio"}
        </button>
      </div>
      <div style={{ fontFamily: F.body, fontSize: 13, color: C.t3, marginBottom: 6 }}>
        {tp.label} · {clinic.distance} {lang === "en" ? "away" : "de distancia"}
        {clinic.open === false ? (lang === "en" ? " · Temporarily Closed" : " · Cerrado Temporalmente") : ""}
        {clinic.sliding ? (lang === "en" ? " · Sliding Scale" : " · Escala Movil") : ""}
      </div>
      <div style={{ fontFamily: F.body, fontSize: 13, color: C.t2, marginBottom: 10 }}>
        {clinic.address}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <a href={"tel:" + clinic.phone} onClick={e => e.stopPropagation()}
          style={{ textDecoration: "none", flex: 1 }}>
          <button style={{ width: "100%", padding: "10px", border: "none",
            background: C.iBlue, color: C.iWhite, fontFamily: F.body,
            fontSize: 14, fontWeight: 600, cursor: "pointer", minHeight: 44 }}>
            {lang === "en" ? "Call" : "Llamar"} {clinic.phone}
          </button>
        </a>
        <a href={"https://maps.google.com/?q=" + encodeURIComponent(clinic.address)}
          target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
          style={{ textDecoration: "none", flex: 1 }}>
          <button style={{ width: "100%", padding: "10px", background: C.iWhite,
            color: C.iBlue, border: "1.5px solid " + C.iBlue,
            fontFamily: F.body, fontSize: 14, fontWeight: 600,
            cursor: "pointer", minHeight: 44 }}>
            {lang === "en" ? "Directions" : "Como llegar"}
          </button>
        </a>
      </div>
    </div>
  );
}

// ── Google Map ───────────────────────────────────────────────────
function GoogleMap({ clinics, isMobile, onSelectClinic, selectedId, centerLat, centerLng }: {
  clinics: Clinic[]; isMobile: boolean;
  onSelectClinic: (clinic: Clinic) => void;
  selectedId: string | null;
  centerLat: number; centerLng: number;
}) {
  const mapRef     = useRef<HTMLDivElement>(null);
  const mapObjRef  = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
    if (!apiKey || !mapRef.current) return;

    function addMarkers(map: google.maps.Map) {
      markersRef.current.forEach(m => m.setMap(null));
      markersRef.current = [];
      clinics.forEach(clinic => {
        const tp = getTypeProps(clinic.type);
        const marker = new window.google.maps.Marker({
          position: { lat: clinic.lat, lng: clinic.lng }, map, title: clinic.name,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            fillColor: tp.pinColor, fillOpacity: 1,
            strokeColor: "#FFFFFF", strokeWeight: 2.5,
            scale: selectedId === clinic.id ? 14 : 10,
          },
        });
        const infoWindow = new window.google.maps.InfoWindow({
          content: `<div style="font-family:'Roboto',sans-serif;padding:4px;min-width:200px;">
            <div style="font-family:'Antonio',sans-serif;font-size:15px;font-weight:700;color:#0A1F62;margin-bottom:4px;">${clinic.name}</div>
            <div style="font-size:12px;color:#5A6A8A;margin-bottom:6px;">${clinic.address}</div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;">
              <span style="font-size:11px;font-weight:500;color:${tp.color};background:${tp.bg};padding:2px 8px;border-radius:4px;">${tp.label}</span>
              ${clinic.open === false ? `<span style="font-size:11px;font-weight:500;color:#6B7280;background:#F3F4F6;padding:2px 8px;border-radius:4px;">Temporarily Closed</span>` : ""}
            </div>
            <div style="margin-top:8px;font-size:12px;font-weight:600;color:#0A1F62;">${clinic.distance} away</div>
          </div>`,
        });
        marker.addListener("mousedown", () => { onSelectClinic(clinic); infoWindow.open(map, marker); });
        markersRef.current.push(marker);
      });
    }

    if (mapObjRef.current) { addMarkers(mapObjRef.current); return; }

    function initMap() {
      if (!mapRef.current) return;
      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: centerLat, lng: centerLng }, zoom: 10,
        mapTypeControl: false, fullscreenControl: false, streetViewControl: false,
        zoomControlOptions: { position: window.google.maps.ControlPosition.RIGHT_CENTER },
        disableDoubleClickZoom: true, clickableIcons: false,
        styles: [
          { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
          { featureType: "transit", stylers: [{ visibility: "off" }] },
        ],
      });
      mapObjRef.current = map;
      addMarkers(map);
    }

    if (window.google && window.google.maps) { initMap(); return; }
    const existing = document.querySelector("script[data-gmaps]");
    if (existing) { existing.addEventListener("load", initMap); return; }
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true; script.dataset.gmaps = "true"; script.onload = initMap;
    document.head.appendChild(script);

  }, [clinics, selectedId, centerLat, centerLng]);

  return (
    <div ref={mapRef} style={{
      width: "100%",
      height: isMobile ? "calc(100vh - 220px)" : "calc(100vh - 200px)",
    }} />
  );
}

// ── Mini card for map sidebar ────────────────────────────────────
function MiniCard({ clinic, isMobile, lang, onClick, selected }: {
  clinic: Clinic; isMobile: boolean; lang: "en"|"es"; onClick: () => void; selected: boolean;
}) {
  const tp = getTypeProps(clinic.type, lang);
  return (
    <div onClick={onClick}
      style={{ background: C.iWhite, borderRadius: 6,
        border: "1.5px solid " + (selected ? C.iBlue : C.border),
        padding: "14px 16px", cursor: "pointer",
        boxShadow: selected ? "0 0 0 3px " + C.blueL : "none",
        transition: "all 0.15s", marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between",
        alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
        <div style={{ fontFamily: F.heading, fontSize: 14,
          fontWeight: 700, color: C.iBlue, lineHeight: 1.3, flex: 1 }}>
          {clinic.name}
        </div>
        <div style={{ fontFamily: F.heading, fontSize: 15,
          fontWeight: 700, color: C.iBlue, flexShrink: 0 }}>
          {clinic.distance}
        </div>
      </div>
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontFamily: F.body, fontWeight: 500,
          color: tp.color, background: tp.bg, padding: "2px 8px", borderRadius: 4 }}>
          {tp.label}
        </span>
        {clinic.open === false && (
          <span style={{ fontSize: 11, fontFamily: F.body, fontWeight: 500,
            color: C.t3, background: "#F3F4F6",
            padding: "2px 8px", borderRadius: 4 }}>
            {lang === "en" ? "Temporarily Closed" : "Cerrado Temporalmente"}
          </span>
        )}
        {clinic.telehealth && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 3,
            fontSize: 11, fontFamily: F.body, fontWeight: 500,
            color: "#1D4ED8", background: "#EFF6FF", padding: "2px 8px", borderRadius: 4 }}>
            <IconVideo /> {lang === "en" ? "Telehealth" : "Telesalud"}
          </span>
        )}
      </div>
      <a href={"tel:" + clinic.phone} onClick={e => e.stopPropagation()} style={{ textDecoration: "none" }}>
        <button style={{ width: "100%", display: "flex", alignItems: "center",
          justifyContent: "center", gap: 8, padding: "9px", borderRadius: 4,
          background: C.iBlue, color: C.iWhite, border: "none",
          fontFamily: F.body, fontSize: 13, fontWeight: 500, cursor: "pointer", minHeight: 44 }}>
          <IconPhone size={15} /> {lang === "en" ? "Call" : "Llamar"}
        </button>
      </a>
    </div>
  );
}

// ── Full clinic card ─────────────────────────────────────────────
function ClinicCard({ clinic, isMobile, lang, onClick, onReport }: {
  clinic: Clinic; isMobile: boolean; lang: "en"|"es"; onClick: () => void; onReport: (c: ReportedClinic) => void;
}) {
  const tp = getTypeProps(clinic.type, lang);
  return (
    <div onClick={onClick}
      style={{ background: C.iWhite, borderRadius: 6,
        border: "1.5px solid " + C.border,
        boxShadow: "0 2px 12px rgba(10,31,98,0.07)",
        overflow: "hidden", cursor: "pointer",
        transition: "box-shadow 0.15s, border-color 0.15s" }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = C.iBlue;
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 20px rgba(10,31,98,0.14)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = C.border;
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 12px rgba(10,31,98,0.07)";
      }}>
      <div style={{ height: 4, background: tp.color }} />
      <div style={{ padding: isMobile ? "16px" : "20px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between",
          alignItems: "flex-start", marginBottom: 12, gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: F.heading, fontSize: isMobile ? 17 : 19,
              fontWeight: 700, color: C.iBlue, lineHeight: 1.2, marginBottom: 8 }}>
              {clinic.name}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              <span style={{ fontSize: 12, fontFamily: F.body, fontWeight: 500,
                color: tp.color, background: tp.bg, padding: "3px 10px", borderRadius: 4 }}>
                {tp.label}
              </span>
              {/* No hours data in any source → only show when known closed */}
              {clinic.open === false && (
                <span style={{ fontSize: 12, fontFamily: F.body, fontWeight: 500,
                  color: C.t3, background: "#F3F4F6",
                  padding: "3px 10px", borderRadius: 4 }}>
                  {lang === "en" ? "Temporarily Closed" : "Cerrado Temporalmente"}
                </span>
              )}
              {clinic.telehealth && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4,
                  fontSize: 12, fontFamily: F.body, fontWeight: 500,
                  color: "#1D4ED8", background: "#EFF6FF", padding: "3px 10px", borderRadius: 4 }}>
                  <IconVideo /> {lang === "en" ? "Telehealth" : "Telesalud"}
                </span>
              )}
              {clinic.sliding && (
                <span style={{ fontSize: 12, fontFamily: F.body, fontWeight: 500,
                  color: "#166534", background: "#DCFCE7", padding: "3px 10px", borderRadius: 4 }}>
                  {lang === "en" ? "Sliding Scale" : "Escala Movil"}
                </span>
              )}
            </div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <button
              onClick={e => { e.stopPropagation(); onReport({ name: clinic.name, address: clinic.address }); }}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: 6,
                fontFamily: F.body, fontSize: 12, fontWeight: 600, color: C.iBlue,
                textDecoration: "underline", whiteSpace: "nowrap" }}>
              {lang === "en" ? "Request Change" : "Solicitar Cambio"}
            </button>
            <div style={{ fontFamily: F.heading, fontSize: isMobile ? 18 : 22,
              fontWeight: 700, color: C.iBlue }}>
              {clinic.distance}
            </div>
            <div style={{ fontFamily: F.body, fontSize: 12, color: C.t3 }}>
              {lang === "en" ? "away" : "de distancia"}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 12 }}>
          <span style={{ color: C.t3, flexShrink: 0, marginTop: 2 }}>
            <IconMapPin size={15} />
          </span>
          <span style={{ fontFamily: F.body, fontSize: isMobile ? 14 : 15,
            color: C.t2, lineHeight: 1.5 }}>
            {clinic.address}
          </span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 16 }}>
          {clinic.insurance.length === 0 && (
            <span style={{ fontFamily: F.body, fontSize: 13, color: C.t3 }}>
              {lang === "en" ? "Call to ask about insurance" : "Llame para preguntar sobre su seguro"}
            </span>
          )}
          {clinic.insurance.slice(0, isMobile ? 3 : 5).map(ins => (
            <span key={ins} style={{ fontFamily: F.body, fontSize: 12,
              color: C.iBlue, background: C.iWhite,
              border: "1px solid rgba(10,31,98,0.35)", padding: "2px 8px", borderRadius: 4 }}>
              {translateInsurance(ins, lang)}
            </span>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <a href={"tel:" + clinic.phone} onClick={e => e.stopPropagation()}
            style={{ textDecoration: "none", flex: 1 }}>
            <button style={{ width: "100%", display: "flex", alignItems: "center",
              justifyContent: "center", gap: 8, padding: "11px", borderRadius: 4,
              background: C.iBlue, color: C.iWhite, border: "none",
              fontFamily: F.body, fontSize: isMobile ? 14 : 15,
              fontWeight: 500, cursor: "pointer", minHeight: 48 }}>
              <IconPhone /> {lang === "en" ? "Call" : "Llamar"}
            </button>
          </a>
          <a href={"https://maps.google.com/?q=" + encodeURIComponent(clinic.address)}
            target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
            style={{ textDecoration: "none", flex: 1 }}>
            <button style={{ width: "100%", display: "flex", alignItems: "center",
              justifyContent: "center", gap: 8, padding: "11px", borderRadius: 4,
              background: C.iWhite, color: C.iBlue,
              border: "1.5px solid " + C.iBlue, fontFamily: F.body,
              fontSize: isMobile ? 14 : 15, fontWeight: 500, cursor: "pointer", minHeight: 48 }}>
            <IconMapPin /> {lang === "en" ? "Directions" : "Como llegar"}
            </button>
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Location helpers ─────────────────────────────────────────────
// No default city and no device-location prompt. If the user didn't
// give a city/ZIP, we simply ask for one, geocode it, and show results.
// The place is remembered for this browser tab (sessionStorage) so
// tapping another category doesn't ask again.
type LocStatus = "locating" | "ready" | "need";
type LocError  = null | "notFound";

// ── Ask-for-location card: one field, one button ────────────────
function AskLocationCard({ lang, isMobile, lite, error, badPlace, onSubmit }: {
  lang: "en"|"es"; isMobile: boolean; lite?: boolean;
  error: LocError; badPlace: string;
  onSubmit: (text: string) => void;
}) {
  const [val, setVal] = useState("");
  const en = lang === "en";
  const msg = error === "notFound"
    ? (en ? `We couldn't find "${badPlace}". Try a city name or ZIP code.`
          : `No encontramos "${badPlace}". Pruebe con el nombre de una ciudad o un codigo postal.`)
    : (en ? "Enter your city or ZIP code to see care near you."
          : "Escriba su ciudad o codigo postal para ver atencion cercana.");

  return (
    <div style={{ padding: lite ? "12px 18px" : (isMobile ? "20px 18px" : "32px 48px") }}>
      <div style={{ background: C.iWhite, border: "1.5px solid " + C.border,
        borderRadius: lite ? 0 : 6, padding: isMobile ? "20px 18px" : "24px 28px",
        maxWidth: 560, boxSizing: "border-box" }}>
        <div style={{ fontFamily: F.heading, fontSize: isMobile ? 20 : 24, fontWeight: 700,
          color: C.iBlue, marginBottom: 8 }}>
          {en ? "Where are you?" : "Donde esta usted?"}
        </div>
        <div role="status" style={{ fontFamily: F.body, fontSize: isMobile ? 14 : 15,
          color: C.t2, lineHeight: 1.5, marginBottom: 16 }}>
          {msg}
        </div>
        <form onSubmit={e => { e.preventDefault(); if (val.trim()) onSubmit(val.trim()); }}
          style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 10 }}>
          {/* 16px font so iPhone Safari doesn't zoom the page on focus */}
          <input type="text" value={val} onChange={e => setVal(e.target.value)} autoFocus
            enterKeyHint="search"
            aria-label={en ? "City or ZIP code" : "Ciudad o codigo postal"}
            placeholder={en ? "City or ZIP code" : "Ciudad o codigo postal"}
            style={{ flex: 1, minWidth: 0, boxSizing: "border-box", minHeight: 52, padding: "0 16px",
              fontSize: 16, fontFamily: F.body, color: C.t2, background: C.card,
              border: "1px solid " + C.border, borderRadius: 4, outline: "none" }} />
          <button type="submit"
            style={{ minHeight: 52, padding: "12px 24px", borderRadius: 4,
              background: C.iBlue, color: C.iWhite, border: "none", cursor: "pointer",
              fontFamily: F.heading, fontSize: 16, fontWeight: 700, letterSpacing: "0.02em" }}>
            {en ? "Find Care" : "Buscar Atencion"}
          </button>
        </form>
      </div>
    </div>
  );
}

// Coverage reminder — gold notice style (same as the Lite Mode banner) so
// it stands out from the grey helper text without looking like an alert.
function CoverageNote({ lang, isMobile }: { lang: "en"|"es"; isMobile: boolean }) {
  return (
    <div style={{ background: C.goldL, borderLeft: "3px solid " + C.gold, borderRadius: 4,
      padding: "10px 12px", marginBottom: isMobile ? 16 : 20,
      fontFamily: F.body, fontSize: isMobile ? 13 : 14, fontWeight: 500,
      color: "#7A5E00", lineHeight: 1.5 }}>
      {lang === "en"
        ? "Coverage can change. Call your insurance or the provider to confirm before you go."
        : "La cobertura puede cambiar. Llame a su seguro o al proveedor para confirmar antes de ir."}
    </div>
  );
}

// Same list (and order) as the home page buttons — see lib/constants.
const RESULTS_CATEGORIES = CATEGORIES;

// ── Results Inner ────────────────────────────────────────────────
function ResultsInner() {
  const router    = useRouter();
  const params    = useSearchParams();
  const query     = params.get("q") ?? "";          // a place ("Clinton, Iowa", "52761, Iowa")
  const catParam  = params.get("cat") ?? "";
  const langParam = (params.get("lang") ?? "en") as "en" | "es";

  const [lang, setLang]               = useState<"en"|"es">(langParam);
  const [searchQuery, setSearchQuery] = useState(query);
  const [isMobile, setIsMobile]       = useState(false);
  const [viewMode, setViewMode]       = useState<"list"|"map">("list");
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
  const [reportingClinic, setReportingClinic] = useState<ReportedClinic | null>(null);

  // ── Real API state ─────────────────────────────────────────────
  const [allClinics, setAllClinics]       = useState<Clinic[]>([]);
  const [loading, setLoading]             = useState(true);
  const [apiError, setApiError]           = useState(false);
  const [coords, setCoords]               = useState<{ lat: number; lng: number } | null>(null);
  const [locationLabel, setLocationLabel] = useState("");
  const [locStatus, setLocStatus]         = useState<LocStatus>("locating");
  const [locError, setLocError]           = useState<LocError>(null);

  // ── Lite Mode state ───────────────────────────────────────────
  // Auto-detects slow connections; user can also toggle manually
  // liteMode=true → no map, no animations, text-only cards
  const [liteMode, setLiteMode] = useState(false);

  // Load saved language
  useEffect(() => {
    const saved = localStorage.getItem("rrLang") as "en"|"es" | null;
    if (saved) setLang(saved);
  }, []);

  // Mobile detection
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // ── Auto-detect slow connection and enable lite mode ──────────
  useEffect(() => {
    const conn = (navigator as any).connection;
    if (conn) {
      const slow = ["slow-2g", "2g"].includes(conn.effectiveType);
      if (slow) setLiteMode(true);
      // Also listen for connection changes
      conn.addEventListener("change", () => {
        const nowSlow = ["slow-2g", "2g"].includes(conn.effectiveType);
        setLiteMode(nowSlow);
      });
    }
    // Also check saved preference
    const saved = localStorage.getItem("rrLiteMode");
    if (saved === "true") setLiteMode(true);
  }, []);

  // Persist lite mode preference
  useEffect(() => {
    localStorage.setItem("rrLiteMode", liteMode ? "true" : "false");
  }, [liteMode]);

  // ── 1. Resolve location (no default city) ─────────────────────
  useEffect(() => {
    let cancelled = false;

    function apply(loc: StoredLoc) {
      setCoords({ lat: loc.lat, lng: loc.lng });
      setLocationLabel(loc.label);
      setLocStatus("ready");
    }
    function needLocation(err: LocError) {
      setCoords(null);
      setLocError(err);
      setLocStatus("need");
      setLoading(false);
    }

    async function resolve() {
      setCoords(null);
      setLocError(null);
      setApiError(false);
      setLocStatus("locating");
      setLoading(true);

      const parsed = query ? parseSearch(query) : null;
      const place  = parsed?.place ?? null;

      // a. Typed place → geocode it
      if (place) {
        try {
          const res = await fetch(`/api/geocode?address=${encodeURIComponent(place)}`);
          const g   = await res.json();
          if (cancelled) return;
          if (res.ok && typeof g.lat === "number") {
            const loc: StoredLoc = { lat: g.lat, lng: g.lng,
              label: g.formattedAddress || place.replace(/,\s*iowa$/i, "") };
            writeStoredLoc(loc);
            apply(loc);
          } else if (res.ok && g.notFound) {
            needLocation("notFound");
          } else {
            setApiError(true); setLoading(false);
          }
        } catch {
          if (!cancelled) { setApiError(true); setLoading(false); }
        }
        return;
      }

      // b. City already given earlier in this tab → reuse it
      const stored = readStoredLoc();
      if (stored) { apply(stored); return; }

      // c. Otherwise just ask for city or ZIP
      needLocation(null);
    }

    resolve();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // ── 2. Fetch clinics once we have a location ──────────────────
  useEffect(() => {
    if (!coords) return;
    let cancelled = false;
    async function loadClinics() {
      setLoading(true);
      setApiError(false);
      try {
        const qs = new URLSearchParams({ lat: String(coords!.lat), lng: String(coords!.lng) });
        if (catParam) qs.set("cat", catParam);
        else if (query) qs.set("query", query);   // older links may still carry care words in q
        const clinicsRes  = await fetch(`/api/clinics?${qs.toString()}`);
        if (!clinicsRes.ok) throw new Error(String(clinicsRes.status));
        const clinicsData = await clinicsRes.json();
        if (cancelled) return;
        setAllClinics(clinicsData.clinics?.length ? clinicsData.clinics : []);
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to load clinics:", err);
        setApiError(true);
        setAllClinics([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadClinics();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coords, catParam]);

  // ── Search box: split "what" from "where" ─────────────────────
  // "local therapists"  → Mental Health, keep current city
  // "dentist clinton"   → Dental in Clinton
  // "Clinton"           → current category in Clinton
  // "doctor near me"    → Family Care, current city (or ask for one)
  function submitSearch(text: string) {
    const t = text.trim();
    if (!t) return;
    const { care, place } = parseSearch(t);
    const p = new URLSearchParams({ lang });
    const cat = care ?? catParam;
    if (cat) p.set("cat", cat);
    if (place)      p.set("q", place);
    else if (query) p.set("q", query);
    router.push(`/results?${p.toString()}`);
  }

  // From the ask-location card: the text is a place, even a single word
  function submitPlace(text: string) {
    const { care, place } = parseSearch(text);
    const p = new URLSearchParams({ lang });
    const cat = care ?? catParam;
    if (cat) p.set("cat", cat);
    p.set("q", place ?? normalizeLocation(text));
    router.push(`/results?${p.toString()}`);
  }

  // "Change" link next to the location label
  function changeLocation() {
    setLocError(null);
    setLocStatus("need");
  }

  const badPlace = query.replace(/,\s*iowa$/i, "");

  const { voiceState, start: startVoice } = useVoice(
    lang,
    (text) => setSearchQuery(text),
    (text) => submitSearch(text)   // same "what + where" split as typing
  );

  function navToCategory(cat: string) {
    const p = new URLSearchParams({ lang });
    if (cat)   p.set("cat", cat);
    if (query) p.set("q", query);
    router.push(`/results?${p.toString()}`);
  }

  const filtered = allClinics.filter(c => {
    if (catParam === "uninsured") {
      return c.type === "uninsured" || (c.type === "family" && c.sliding);
    }
    return true;
  });

  const px = isMobile ? "18px" : "48px";

  // ── Lite Mode render ──────────────────────────────────────────
  // Completely separate, minimal render path — no map, no animations
  if (liteMode) {
    return (
      <main style={{ minHeight: "100vh", background: "#fff", fontFamily: F.body }}>

        {/* LITE NAV */}
        <nav style={{ background: C.iBlue, padding: "0 18px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          height: 56, borderBottom: "3px solid #1A3A7A" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => router.push(`/?lang=${lang}`)}
              style={{ display: "flex", alignItems: "center", gap: 6,
                background: "transparent", border: "none", color: "#A8B8D8",
                cursor: "pointer", fontFamily: F.body, fontSize: 14, minHeight: 44 }}>
              <IconArrowLeft />
            </button>
            <span style={{ fontFamily: F.heading, fontSize: 18,
              fontWeight: 700, color: C.iWhite }}>
              Iowa Rural Reach
            </span>
          </div>
          <button onClick={() => setLiteMode(false)}
            style={{ background: "transparent", border: "1px solid #3A5A9A",
              color: "#A8B8D8", padding: "5px 10px", borderRadius: 4,
              fontFamily: F.body, fontSize: 12, cursor: "pointer" }}>
            {lang === "en" ? "Full View" : "Vista Completa"}
          </button>
        </nav>

        {/* LITE MODE BANNER */}
        <div style={{ background: C.goldL, borderBottom: "1px solid " + C.gold,
          padding: "8px 18px", display: "flex", alignItems: "center",
          justifyContent: "space-between", gap: 12 }}>
          <span style={{ fontFamily: F.body, fontSize: 13, color: "#7A5E00" }}>
            {lang === "en"
              ? "Lite Mode — optimized for slow connections"
              : "Modo Lite — optimizado para conexiones lentas"}
          </span>
        </div>

        {/* LITE FILTER ROW */}
        <div style={{ background: "#F4F6FB", borderBottom: "1px solid " + C.border,
          padding: "10px 18px", display: "flex", gap: 8, overflowX: "auto" }}>
          <button onClick={() => navToCategory("")}
            style={{ padding: "7px 12px", border: "1px solid " + (!catParam ? C.iBlue : C.border),
              background: !catParam ? C.blueL : C.iWhite,
              color: !catParam ? C.iBlue : C.t3,
              fontFamily: F.body, fontSize: 13, cursor: "pointer",
              whiteSpace: "nowrap", minHeight: 40 }}>
            {lang === "en" ? "All" : "Todo"}
          </button>
          {RESULTS_CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => navToCategory(cat.id)}
              style={{ padding: "7px 12px",
                border: "1px solid " + (catParam === cat.id ? C.iBlue : C.border),
                background: catParam === cat.id ? C.blueL : C.iWhite,
                color: catParam === cat.id ? C.iBlue : C.t3,
                fontFamily: F.body, fontSize: 13, cursor: "pointer",
                whiteSpace: "nowrap", minHeight: 40 }}>
              {lang === "en" ? cat.label : cat.labelEs}
            </button>
          ))}
        </div>

        {/* LITE CONTENT */}
        <div style={{ padding: "12px 18px" }}>
          {loading && <LiteLoadingSkeleton />}

          {locStatus === "need" && !loading && (
            <AskLocationCard lang={lang} isMobile lite error={locError} badPlace={badPlace}
              onSubmit={submitPlace} />
          )}

          {apiError && !loading && (
            <div style={{ fontFamily: F.body, fontSize: 15, color: C.t3, padding: "20px 0" }}>
              {lang === "en" ? "Could not load. " : "No se pudo cargar. "}
              <button onClick={() => window.location.reload()}
                style={{ background: "none", border: "none", color: C.iBlue,
                  fontFamily: F.body, fontSize: 15, cursor: "pointer",
                  textDecoration: "underline", padding: 0 }}>
                {lang === "en" ? "Retry" : "Reintentar"}
              </button>
            </div>
          )}

          {!loading && !apiError && locStatus === "ready" && (
            <>
              <div style={{ fontFamily: F.body, fontSize: 13, color: C.t3, marginBottom: 4 }}>
                {filtered.length} {lang === "en" ? "results near" : "resultados cerca de"} {locationLabel}
                {" · "}
                <button onClick={changeLocation}
                  style={{ background: "none", border: "none", padding: 0, cursor: "pointer",
                    fontFamily: F.body, fontSize: 13, fontWeight: 600, color: C.iBlue,
                    textDecoration: "underline" }}>
                  {lang === "en" ? "Change" : "Cambiar"}
                </button>
              </div>
              <div style={{ marginTop: 8 }}><CoverageNote lang={lang} isMobile /></div>
              {filtered.map(clinic => (
                <LiteClinicCard key={clinic.id} clinic={clinic} lang={lang}
                  onClick={() => {
                    sessionStorage.setItem("rrClinic", JSON.stringify(clinic));
                    router.push(`/clinic/${clinic.id}?lang=${lang}`);
                  }}
                  onReport={setReportingClinic} />
              ))}
              {filtered.length === 0 && (
                <div style={{ fontFamily: F.body, fontSize: 15, color: C.t3, padding: "20px 0" }}>
                  {lang === "en" ? "No results found." : "Sin resultados."}
                </div>
              )}
            </>
          )}
        </div>

        {/* LITE EMERGENCY FOOTER */}
        <div style={{ borderTop: "1px solid " + C.border, padding: "12px 18px",
          display: "flex", flexDirection: "column", gap: 8, background: C.iWhite }}>
          <a href="tel:911" style={{ textDecoration: "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
              background: C.redL, border: "1px solid " + C.iRed }}>
              <span style={{ fontFamily: F.heading, fontSize: 13,
                fontWeight: 700, color: C.iRed }}>911</span>
              <span style={{ fontFamily: F.body, fontSize: 14, color: C.iRed, fontWeight: 500 }}>
                {lang === "en" ? "Physical Emergency — Call 911" : "Emergencia Fisica — Llame al 911"}
              </span>
            </div>
          </a>
          <a href="tel:988" style={{ textDecoration: "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
              background: C.blueL, border: "1px solid " + C.iBlue }}>
              <span style={{ fontFamily: F.heading, fontSize: 13,
                fontWeight: 700, color: C.iBlue }}>988</span>
              <span style={{ fontFamily: F.body, fontSize: 14, color: C.iBlue, fontWeight: 500 }}>
                {lang === "en" ? "Mental Health Crisis — Call 988" : "Crisis Mental — Llame al 988"}
              </span>
            </div>
          </a>
        </div>
      </main>
    );
  }

  // ── Full Mode render (unchanged) ──────────────────────────────
  return (
    <main style={{ minHeight: "100vh", background: "#F4F6FB", fontFamily: F.body }}>

      {/* NAV */}
      <nav style={{ width: "100%", background: C.iBlue,
        padding: "0 " + px, boxSizing: "border-box",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: isMobile ? 60 : 72, borderBottom: "3px solid #1A3A7A" }}>
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
          <span style={{ fontFamily: F.heading, fontSize: isMobile ? 18 : 22,
            fontWeight: 700, color: C.iWhite }}>
            Iowa Rural Reach
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Lite Mode toggle — visible in full mode */}
          <button onClick={() => setLiteMode(true)}
            style={{ background: "transparent", border: "1px solid #3A5A9A",
              color: "#A8B8D8", padding: "5px 10px", borderRadius: 4,
              fontFamily: F.body, fontSize: 12, cursor: "pointer",
              display: isMobile ? "none" : "block" }}>
            {lang === "en" ? "Lite Mode" : "Modo Lite"}
          </button>
          <div style={{ fontSize: 13, fontFamily: F.body,
            padding: "6px 12px", borderRadius: 4,
            border: "1px solid #3A5A9A", color: "#A8B8D8" }}>
            {lang === "en" ? "EN" : "ES"}
          </div>
        </div>
      </nav>

      {/* SEARCH BAR */}
      <div style={{ background: C.iWhite, borderBottom: "1px solid " + C.border,
        padding: isMobile ? "12px 18px" : "14px 48px",
        display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10,
          background: C.card, borderRadius: 4, border: "1px solid " + C.border,
          padding: "6px 16px", minHeight: 52 }}>
          <VoiceButton voiceState={voiceState} onStart={startVoice} size={36} />
          <input
            type="text"
            value={voiceState === "listening"
              ? (lang === "en" ? "Listening... speak now" : "Escuchando... hable ahora")
              : searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && searchQuery.trim()) submitSearch(searchQuery);
            }}
            placeholder={lang === "en" ? "Search for care near you..." : "Buscar atencion..."}
            readOnly={voiceState === "listening"}
            style={{ flex: 1, border: "none", outline: "none",
              fontFamily: F.body, fontSize: isMobile ? 14 : 16,
              color: C.t2, background: "transparent", minWidth: 0 }} />
          {!loading && locationLabel && (
            <span style={{ fontFamily: F.body, fontSize: 12,
              color: C.t4, whiteSpace: "nowrap",
              display: isMobile ? "none" : "block" }}>
              Near: {locationLabel}
            </span>
          )}
        </div>
        <button
          onClick={() => {
            if (searchQuery.trim()) {
              submitSearch(searchQuery);
            } else {
              router.push(`/?lang=${lang}`);
            }
          }}
          style={{ background: C.iBlue, color: C.iWhite, border: "none", borderRadius: 4,
            padding: isMobile ? "10px 14px" : "12px 24px",
            fontFamily: F.heading, fontSize: isMobile ? 13 : 15,
            fontWeight: 700, cursor: "pointer", letterSpacing: "0.04em",
            minHeight: 52, whiteSpace: "nowrap" }}>
          {lang === "en" ? "Search" : "Buscar"}
        </button>
      </div>

      {/* FILTER ROW */}
      <div style={{ background: C.iWhite, borderBottom: "1px solid " + C.border,
        padding: isMobile ? "10px 18px" : "12px 48px",
        display: "flex", alignItems: "center", gap: 8, overflowX: "auto" }}>

        <button onClick={() => navToCategory("")}
          style={{ padding: isMobile ? "8px 12px" : "9px 18px",
            borderRadius: 4, fontSize: isMobile ? 13 : 14,
            fontFamily: F.body, fontWeight: 500,
            border: "1.5px solid " + (!catParam ? C.iBlue : C.border),
            background: !catParam ? C.blueL : C.iWhite,
            color: !catParam ? C.iBlue : C.t3,
            cursor: "pointer", whiteSpace: "nowrap", minHeight: 44 }}>
          {lang === "en" ? "All Care" : "Todo"}
        </button>

        {RESULTS_CATEGORIES.map(cat => {
          const isActive = catParam === cat.id;
          const isVet    = cat.id === "veteran";
          return (
            <button key={cat.id}
              onClick={() => navToCategory(cat.id)}
              style={{ padding: isMobile ? "8px 12px" : "9px 18px",
                borderRadius: 4, fontSize: isMobile ? 13 : 14,
                fontFamily: F.body, fontWeight: 500,
                border: "1.5px solid " + (isActive ? (isVet ? C.gold : C.iBlue) : C.border),
                background: isActive ? (isVet ? C.goldL : C.blueL) : C.iWhite,
                color: isActive ? (isVet ? "#7A5E00" : C.iBlue) : C.t3,
                cursor: "pointer", whiteSpace: "nowrap", minHeight: 44 }}>
              {lang === "en" ? cat.label : cat.labelEs}
            </button>
          );
        })}

        {/* List / Map toggle */}
        <div style={{ marginLeft: "auto", display: "flex",
          border: "1.5px solid " + C.border, borderRadius: 4,
          overflow: "hidden", flexShrink: 0 }}>
          <button onClick={() => setViewMode("list")}
            style={{ display: "flex", alignItems: "center", gap: 6,
              padding: isMobile ? "8px 12px" : "9px 16px",
              border: "none", borderRight: "1px solid " + C.border,
              background: viewMode === "list" ? C.iBlue : C.iWhite,
              color: viewMode === "list" ? C.iWhite : C.t3,
              cursor: "pointer", fontSize: isMobile ? 13 : 14,
              fontFamily: F.body, fontWeight: 500, minHeight: 44 }}>
            <IconList size={15} />
            {!isMobile && (lang === "en" ? "List" : "Lista")}
          </button>
          <button onClick={() => setViewMode("map")}
            style={{ display: "flex", alignItems: "center", gap: 6,
              padding: isMobile ? "8px 12px" : "9px 16px",
              border: "none",
              background: viewMode === "map" ? C.iBlue : C.iWhite,
              color: viewMode === "map" ? C.iWhite : C.t3,
              cursor: "pointer", fontSize: isMobile ? 13 : 14,
              fontFamily: F.body, fontWeight: 500, minHeight: 44 }}>
            <IconMap size={15} />
            {!isMobile && (lang === "en" ? "Map" : "Mapa")}
          </button>
        </div>
      </div>

      {/* LOADING */}
      {loading && viewMode === "list" && <LoadingSkeleton isMobile={isMobile} />}

      {/* API ERROR */}
      {apiError && !loading && (
        <div style={{ padding: isMobile ? "20px 18px" : "32px 48px", textAlign: "center" }}>
          <div style={{ fontFamily: F.heading, fontSize: 20, color: C.t3, marginBottom: 12 }}>
            {lang === "en" ? "Could not load clinics. Please try again." : "No se pudieron cargar las clinicas."}
          </div>
          <button onClick={() => window.location.reload()}
            style={{ background: C.iBlue, color: C.iWhite, border: "none",
              borderRadius: 4, padding: "12px 28px", fontFamily: F.heading,
              fontSize: 16, fontWeight: 700, cursor: "pointer", minHeight: 48 }}>
            {lang === "en" ? "Try Again" : "Intentar de Nuevo"}
          </button>
        </div>
      )}

      {/* ASK FOR LOCATION — no default city */}
      {locStatus === "need" && !loading && (
        <AskLocationCard lang={lang} isMobile={isMobile} error={locError} badPlace={badPlace}
          onSubmit={submitPlace} />
      )}

      {/* LIST VIEW */}
      {viewMode === "list" && !loading && !apiError && locStatus === "ready" && (
        <div style={{ padding: isMobile ? "20px 18px" : "32px 48px" }}>
          <div style={{ fontFamily: F.body, fontSize: isMobile ? 14 : 16,
            color: C.t3, marginBottom: 6, fontWeight: 500 }}>
            {filtered.length === 0
              ? (lang === "en" ? "No results found near " : "Sin resultados cerca de ")
              : `${filtered.length} ${lang === "en" ? "care options near" : "opciones cerca de"} `}
            {locationLabel}
            {" · "}
            <button onClick={changeLocation}
              style={{ background: "none", border: "none", padding: 0, cursor: "pointer",
                fontFamily: F.body, fontSize: isMobile ? 14 : 16, fontWeight: 600, color: C.iBlue,
                textDecoration: "underline" }}>
              {lang === "en" ? "Change" : "Cambiar"}
            </button>
          </div>
          <div style={{ marginTop: 10 }}><CoverageNote lang={lang} isMobile={isMobile} /></div>
          <div style={{ display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
            gap: isMobile ? 16 : 20 }}>
            {filtered.map(clinic => (
              <ClinicCard key={clinic.id} clinic={clinic} isMobile={isMobile} lang={lang}
                onClick={() => {
                  sessionStorage.setItem("rrClinic", JSON.stringify(clinic));
                  router.push(`/clinic/${clinic.id}?lang=${lang}`);
                }}
                onReport={setReportingClinic} />
            ))}
          </div>
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <div style={{ fontFamily: F.heading, fontSize: 24, color: C.t4, marginBottom: 16 }}>
                {lang === "en" ? "No results found" : "Sin resultados"}
              </div>
              <button onClick={() => navToCategory("")}
                style={{ background: C.iBlue, color: C.iWhite, border: "none",
                  borderRadius: 4, padding: "12px 28px", fontFamily: F.heading,
                  fontSize: 16, fontWeight: 700, cursor: "pointer", minHeight: 48 }}>
                {lang === "en" ? "Show All Care" : "Mostrar Todo"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* MAP VIEW */}
      {viewMode === "map" && !loading && coords && locStatus === "ready" && (
        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row",
          height: isMobile ? "auto" : "calc(100vh - 200px)" }}>
          <div style={{ width: isMobile ? "100%" : 320, flexShrink: 0,
            overflowY: isMobile ? "visible" : "auto", background: "#F4F6FB",
            borderRight: isMobile ? "none" : "1px solid " + C.border,
            padding: isMobile ? "14px 18px" : "16px", order: isMobile ? 2 : 1 }}>
            <div style={{ fontFamily: F.body, fontSize: 13,
              color: C.t3, marginBottom: 12, fontWeight: 500 }}>
              {filtered.length} {lang === "en" ? "results" : "resultados"}
            </div>
            {filtered.map(clinic => (
              <MiniCard key={clinic.id} clinic={clinic} isMobile={isMobile} lang={lang}
                selected={selectedClinic?.id === clinic.id}
                onClick={() => {
                  setSelectedClinic(clinic);
                  sessionStorage.setItem("rrClinic", JSON.stringify(clinic));
                  router.push(`/clinic/${clinic.id}?lang=${lang}`);
                }} />
            ))}
          </div>
          <div style={{ flex: 1, order: isMobile ? 1 : 2, minHeight: isMobile ? 340 : "auto" }}>
            <GoogleMap
              clinics={filtered} isMobile={isMobile}
              selectedId={selectedClinic?.id ?? null}
              onSelectClinic={clinic => setSelectedClinic(clinic)}
              centerLat={coords.lat} centerLng={coords.lng}
            />
            <div style={{ position: "absolute", bottom: isMobile ? "auto" : 100,
              right: isMobile ? "auto" : 60,
              background: "rgba(255,255,255,0.95)", borderRadius: 6,
              padding: "10px 14px", border: "1px solid " + C.border,
              boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
              display: isMobile ? "none" : "block" }}>
              <div style={{ fontFamily: F.body, fontSize: 11, fontWeight: 600,
                color: C.t3, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                {lang === "en" ? "Pin Legend" : "Leyenda"}
              </div>
              {[
                { color: "#0A1F62", label: lang === "en" ? "Family Care"   : "Atencion Familiar" },
                { color: "#166534", label: lang === "en" ? "Mental Health" : "Salud Mental" },
                { color: "#6B21A8", label: lang === "en" ? "Dental"        : "Dental" },
                { color: "#B45309", label: lang === "en" ? "Veterans"      : "Veteranos" },
                { color: "#D80025", label: lang === "en" ? "Emergency"     : "Emergencia" },
                { color: "#0F766E", label: lang === "en" ? "Chiropractic"  : "Quiropractico" },
              ].map(item => (
                <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                  <div style={{ width: 12, height: 12, borderRadius: "50%",
                    background: item.color, border: "2px solid white",
                    boxShadow: "0 0 0 1px " + item.color }} />
                  <span style={{ fontFamily: F.body, fontSize: 12, color: C.t2 }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* EMERGENCY FOOTER */}
      {viewMode === "list" && !loading && (
        <div style={{ background: C.iWhite, borderTop: "1px solid " + C.border,
          padding: isMobile ? "16px 18px" : "20px 48px",
          display: "flex", flexDirection: isMobile ? "column" : "row", gap: 12 }}>
          <a href="tel:911" style={{ textDecoration: "none", flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12,
              padding: "12px 16px", borderRadius: 6,
              background: C.redL, border: "1.5px solid " + C.iRed }}>
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
            <div style={{ display: "flex", alignItems: "center", gap: 12,
              padding: "12px 16px", borderRadius: 6,
              background: C.blueL, border: "1.5px solid " + C.iBlue }}>
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
      )}

      <RequestChangeModal
        isOpen={!!reportingClinic}
        onClose={() => setReportingClinic(null)}
        clinic={reportingClinic}
        lang={lang}
      />
    </main>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center",
        justifyContent: "center", fontFamily: "'Roboto', sans-serif", color: "#5A6A8A" }}>
        Loading...
      </div>
    }>
      <ResultsInner />
    </Suspense>
  );
}
