"use client";

import { VoiceState } from "./useVoice";
import { COLORS as C } from "./constants";

export function VoiceButton({
  voiceState,
  onStart,
  size = 48,
  label,
}: {
  voiceState: VoiceState;
  onStart: () => void;
  size?: number;
  label?: string;
}) {
  const isListening   = voiceState === "listening";
  const isProcessing  = voiceState === "processing";
  const isActive      = isListening || isProcessing;

  return (
    <div style={{ position: "relative", display: "inline-flex",
      alignItems: "center", gap: 8 }}>

      {/* Pulse ring when listening */}
      {isListening && (
        <>
          <div style={{
            position: "absolute", top: "50%", left: size / 2,
            transform: "translate(-50%, -50%)",
            width: size + 16, height: size + 16,
            borderRadius: "50%",
            border: "2px solid " + C.iRed,
            animation: "voicePulse 1s ease-out infinite",
            pointerEvents: "none",
          }} />
          <div style={{
            position: "absolute", top: "50%", left: size / 2,
            transform: "translate(-50%, -50%)",
            width: size + 30, height: size + 30,
            borderRadius: "50%",
            border: "1.5px solid " + C.iRed,
            animation: "voicePulse 1s ease-out 0.3s infinite",
            pointerEvents: "none",
            opacity: 0.5,
          }} />
        </>
      )}

      <style>{`
        @keyframes voicePulse {
          0%   { transform: translate(-50%, -50%) scale(0.9); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1.4); opacity: 0; }
        }
      `}</style>

      <button
        onClick={onStart}
        title={isListening ? "Click to stop" : "Click to speak"}
        style={{
          width: size, height: size, borderRadius: "50%",
          border: "none", cursor: "pointer",
          background: isListening ? C.iRed : isProcessing ? C.t4 : C.iBlue,
          color: "#fff", display: "flex", alignItems: "center",
          justifyContent: "center", flexShrink: 0,
          transition: "background 0.2s",
          boxShadow: isActive ? "0 0 0 3px rgba(220,38,38,0.2)" : "none",
        }}>
        {isProcessing ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
          </svg>
        ) : isListening ? (
          /* Stop icon */
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="6" width="12" height="12" rx="2"/>
          </svg>
        ) : (
          /* Mic icon */
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect width="8" height="14" x="8" y="2" rx="4"/>
            <path d="M4 13a8 8 0 0 0 16 0M12 19v4M8 23h8"/>
          </svg>
        )}
      </button>

      {/* Status label */}
      {label && (
        <span style={{
          fontSize: 13, fontFamily: "'Roboto', sans-serif",
          color: isListening ? C.iRed : isProcessing ? C.t3 : C.t3,
          fontWeight: isActive ? 600 : 400,
          whiteSpace: "nowrap",
        }}>
          {isListening ? "Listening..." : isProcessing ? "Processing..." : label}
        </span>
      )}
    </div>
  );
}