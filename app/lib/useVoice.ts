import { useState, useCallback, useRef } from "react";

export type VoiceState = "idle" | "listening" | "processing";

export function useVoice(
  lang: "en" | "es",
  onResult: (text: string) => void,
  onAutoSubmit?: (text: string) => void
) {
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const recognitionRef = useRef<any>(null);

  const start = useCallback(() => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Voice input requires Chrome browser.");
      return;
    }

    if (voiceState === "listening") {
      recognitionRef.current?.stop();
      setVoiceState("idle");
      return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognitionRef.current = recognition;

    recognition.lang = lang === "es" ? "es-US" : "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => setVoiceState("listening");

    recognition.onresult = (e: any) => {
      const transcript = Array.from(e.results)
        .map((r: any) => r[0].transcript)
        .join("");

      if (e.results[e.results.length - 1].isFinal) {
        setVoiceState("processing");
        onResult(transcript);
        if (onAutoSubmit) {
          setTimeout(() => {
            onAutoSubmit(transcript);
            setVoiceState("idle");
          }, 400);
        } else {
          setVoiceState("idle");
        }
      }
    };

    recognition.onerror = () => setVoiceState("idle");
    recognition.onend = () => setVoiceState("idle");

    recognition.start();
  }, [lang, voiceState, onResult, onAutoSubmit]);

  const cancel = useCallback(() => {
    recognitionRef.current?.stop();
    setVoiceState("idle");
  }, []);

  return { voiceState, start, cancel };
}