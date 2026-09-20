"use client";

import { useState, FormEvent } from "react";
import { COLORS as C, FONTS as F } from "../lib/constants";
import Modal from "./Modal";
import { inputStyle, labelStyle, primaryButtonStyle, errorTextStyle } from "./formStyles";
import { submitToWeb3Forms } from "../lib/web3forms";

// Web3Forms access key for "Iowa Rural Reach - Feedback".
const FEEDBACK_ACCESS_KEY = "b3a5ce2d-4e9e-461f-9f92-5ab9474d7db3";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: "en" | "es";
}

export default function FeedbackModal({ isOpen, onClose, lang }: FeedbackModalProps) {
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  const t = {
    title: lang === "en" ? "Give Feedback" : "Danos tu Opinion",
    ratingLabel: lang === "en" ? "How's the app working for you?" : "Como le esta funcionando la app?",
    messageLabel: lang === "en" ? "What's on your mind? *" : "Que tiene en mente? *",
    messagePlaceholder:
      lang === "en"
        ? "Tell us what's working, what's confusing, or what you wish the app did..."
        : "Cuentenos que funciona bien, que es confuso, o que le gustaria que la app hiciera...",
    emailLabel: lang === "en" ? "Email (optional, if you'd like a reply)" : "Correo (opcional, si desea una respuesta)",
    submit: lang === "en" ? "Submit Feedback" : "Enviar Comentario",
    sending: lang === "en" ? "Sending..." : "Enviando...",
    thanks:
      lang === "en"
        ? "Thanks — your feedback helps us improve Iowa Rural Reach."
        : "Gracias — su opinion nos ayuda a mejorar Iowa Rural Reach.",
    done: lang === "en" ? "Done" : "Listo",
  };

  const reset = () => {
    setRating(0);
    setMessage("");
    setEmail("");
    setStatus("idle");
    setError("");
  };

  const handleClose = () => {
    onClose();
    setTimeout(reset, 200);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setStatus("sending");
    setError("");
    try {
      await submitToWeb3Forms(FEEDBACK_ACCESS_KEY, {
        subject: "New Feedback - Iowa Rural Reach",
        rating: rating || "Not rated",
        message,
        email: email || "Not provided",
        page: typeof window !== "undefined" ? window.location.href : "",
      });
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Submission failed.");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t.title}>
      {status === "done" ? (
        <div style={{ textAlign: "center", padding: "12px 0" }}>
          <p style={{ fontFamily: F.body, color: C.iBlue, fontSize: 16 }}>{t.thanks}</p>
          <button onClick={handleClose} style={primaryButtonStyle}>
            {t.done}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>{t.ratingLabel}</label>
            <div style={{ display: "flex", gap: 6 }}>
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  type="button"
                  key={n}
                  onClick={() => setRating(n)}
                  aria-label={`${n} star${n > 1 ? "s" : ""}`}
                  aria-pressed={n <= rating}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 4,
                    color: n <= rating ? C.iBlue : C.border,
                  }}
                >
                  <svg
                    width="26"
                    height="26"
                    viewBox="0 0 24 24"
                    fill={n <= rating ? "currentColor" : "none"}
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle} htmlFor="fb-message">
              {t.messageLabel}
            </label>
            <textarea
              id="fb-message"
              required
              rows={4}
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder={t.messagePlaceholder}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle} htmlFor="fb-email">
              {t.emailLabel}
            </label>
            <input
              id="fb-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
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
