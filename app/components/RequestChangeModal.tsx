"use client";

import { useState, useEffect, FormEvent } from "react";
import { COLORS as C, FONTS as F } from "../lib/constants";
import Modal from "./Modal";
import { inputStyle, labelStyle, primaryButtonStyle, errorTextStyle } from "./formStyles";
import { submitToWeb3Forms } from "../lib/web3forms";

// Web3Forms access key for "Iowa Rural Reach - Request Change".
const REQUEST_CHANGE_ACCESS_KEY = "b4132aa2-80ff-4998-b53d-759e3f5fc480";

export interface ReportedClinic {
  name: string;
  address: string;
}

interface RequestChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  clinic: ReportedClinic | null;
  lang: "en" | "es";
}

const ISSUE_TYPES_EN = [
  "Address or phone number is wrong",
  "Permanently closed / no longer operating here",
  "Duplicate of another listing",
  "Insurance / services info is wrong",
  "Other",
];

const ISSUE_TYPES_ES = [
  "La direccion o el telefono son incorrectos",
  "Cerrado permanentemente / ya no opera aqui",
  "Es un duplicado de otra clinica",
  "La informacion de seguro o servicios es incorrecta",
  "Otro",
];

/**
 * `clinic` ties the report to a specific listing (name + address) instead of
 * free text -- that structure is what makes these reports usable for the
 * exclusion-list review process instead of just a pile of ambiguous emails.
 */
export default function RequestChangeModal({ isOpen, onClose, clinic, lang }: RequestChangeModalProps) {
  const issueTypes = lang === "en" ? ISSUE_TYPES_EN : ISSUE_TYPES_ES;
  const [issueType, setIssueType] = useState(issueTypes[0]);
  const [details, setDetails] = useState("");
  const [reporterName, setReporterName] = useState("");
  const [reporterEmail, setReporterEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setIssueType(issueTypes[0]);
      setDetails("");
      setReporterName("");
      setReporterEmail("");
      setStatus("idle");
      setError("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const t = {
    title: lang === "en" ? "Report an Issue" : "Reportar un Problema",
    reportingWith: lang === "en" ? "Reporting an issue with" : "Reportando un problema con",
    thisListing: lang === "en" ? "This listing" : "Esta clinica",
    issueLabel: lang === "en" ? "What's wrong? *" : "Cual es el problema? *",
    detailsLabel: lang === "en" ? "Details — what should it say instead? *" : "Detalles — que deberia decir en su lugar? *",
    detailsPlaceholder:
      lang === "en"
        ? "e.g. This clinic closed in 2025. The current CHC location is 1221 Park Ave."
        : "ej. Esta clinica cerro en 2025. La ubicacion actual de CHC es 1221 Park Ave.",
    nameLabel: lang === "en" ? "Your name (optional)" : "Su nombre (opcional)",
    emailLabel: lang === "en" ? "Email, in case we need to follow up (optional)" : "Correo, por si necesitamos contactarlo (opcional)",
    submit: lang === "en" ? "Submit Report" : "Enviar Reporte",
    sending: lang === "en" ? "Sending..." : "Enviando...",
    thanks:
      lang === "en"
        ? "Thanks for the report — we'll review it and update the listing if needed."
        : "Gracias por el reporte — lo revisaremos y actualizaremos la clinica si es necesario.",
    done: lang === "en" ? "Done" : "Listo",
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!details.trim()) return;
    setStatus("sending");
    setError("");
    try {
      await submitToWeb3Forms(REQUEST_CHANGE_ACCESS_KEY, {
        subject: `Request Change: ${clinic?.name || "Unknown listing"}`,
        clinic_name: clinic?.name || "Unknown",
        clinic_address: clinic?.address || "Unknown",
        issue_type: issueType,
        details,
        reporter_name: reporterName || "Not provided",
        email: reporterEmail || "Not provided",
        page: typeof window !== "undefined" ? window.location.href : "",
      });
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Submission failed.");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t.title}>
      {status === "done" ? (
        <div style={{ textAlign: "center", padding: "12px 0" }}>
          <p style={{ fontFamily: F.body, color: C.iBlue, fontSize: 16 }}>{t.thanks}</p>
          <button onClick={onClose} style={primaryButtonStyle}>
            {t.done}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div style={{ background: C.blueL, borderRadius: 4, padding: "10px 12px", marginBottom: 16 }}>
            <p
              style={{
                margin: 0,
                fontFamily: F.body,
                fontSize: 12,
                fontWeight: 600,
                color: C.t3,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              {t.reportingWith}
            </p>
            <p style={{ margin: "2px 0 0", fontFamily: F.heading, fontSize: 16, fontWeight: 700, color: C.iBlue }}>
              {clinic?.name || t.thisListing}
            </p>
            {clinic?.address && (
              <p style={{ margin: 0, fontFamily: F.body, fontSize: 13, color: C.t3 }}>{clinic.address}</p>
            )}
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle} htmlFor="rc-issue">
              {t.issueLabel}
            </label>
            <select id="rc-issue" value={issueType} onChange={e => setIssueType(e.target.value)} style={inputStyle}>
              {issueTypes.map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle} htmlFor="rc-details">
              {t.detailsLabel}
            </label>
            <textarea
              id="rc-details"
              required
              rows={4}
              value={details}
              onChange={e => setDetails(e.target.value)}
              placeholder={t.detailsPlaceholder}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle} htmlFor="rc-name">
              {t.nameLabel}
            </label>
            <input id="rc-name" value={reporterName} onChange={e => setReporterName(e.target.value)} style={inputStyle} />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle} htmlFor="rc-email">
              {t.emailLabel}
            </label>
            <input
              id="rc-email"
              type="email"
              value={reporterEmail}
              onChange={e => setReporterEmail(e.target.value)}
              style={inputStyle}
            />
          </div>

          {status === "error" && <p style={errorTextStyle}>{error}</p>}

          <button type="submit" disabled={status === "sending"} style={primaryButtonStyle}>
            {status === "sending" ? t.sending : t.submit}
          </button>
        </form>
      )}
    </Modal>
  );
}
