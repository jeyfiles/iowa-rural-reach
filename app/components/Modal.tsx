"use client";

import { useEffect, ReactNode } from "react";
import { COLORS as C, FONTS as F } from "../lib/constants";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

// Shared bottom-sheet modal for the Feedback and Request-Change forms.
// Pulls COLORS/FONTS from app/lib/constants.ts (the same tokens the rest of
// the app uses) so this can't drift out of sync with the home page palette.
// Card corner radius (6px) matches ClinicCard's radius; buttons/inputs
// inside use 4px, matching the Call/Directions/search-box buttons.
export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(10, 31, 98, 0.5)",
        display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={title}
        style={{ background: C.iWhite, width: "min(480px, 100%)", maxHeight: "88dvh",
          borderRadius: "6px 6px 0 0", display: "flex", flexDirection: "column",
          fontFamily: F.body, boxShadow: "0 -4px 24px rgba(10,31,98,0.25)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px", borderBottom: "1.5px solid " + C.border, flexShrink: 0 }}>
          <h2 style={{ fontFamily: F.heading, fontWeight: 700, fontSize: 22,
            color: C.iBlue, margin: 0, letterSpacing: "0.01em" }}>
            {title}
          </h2>
          <button onClick={onClose} aria-label="Close"
            style={{ background: "none", border: "none", cursor: "pointer",
              color: C.iBlue, padding: 6, lineHeight: 0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" /><path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
        <div style={{ padding: 20, overflowY: "auto" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
