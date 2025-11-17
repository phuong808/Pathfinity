"use client"

import { useCallback, useRef, useState } from "react";
import { Volume2Icon, VolumeXIcon } from "lucide-react";
import { Button } from "@/app/components/ui/button";

const DEFAULT_TTS_MAX = Number(process.env.NEXT_PUBLIC_TTS_MAX_CHARS || 5000);

function speakWithWebSpeech(text: string) {
  if (!("speechSynthesis" in window)) return null;
  const ut = new SpeechSynthesisUtterance(text);
  ut.lang = navigator.language || "en-US";
  
  // Apply user settings from localStorage
  try {
    const voiceUri = localStorage.getItem("pf_tts_voice");
    if (voiceUri && voiceUri !== "default") {
      const voices = window.speechSynthesis.getVoices();
      const selectedVoice = voices.find(v => v.voiceURI === voiceUri);
      if (selectedVoice) ut.voice = selectedVoice;
    }
    
    const rate = Number(localStorage.getItem("pf_tts_rate") || "1.0");
    ut.rate = Math.max(0.5, Math.min(2.0, rate));
    
    const pitch = Number(localStorage.getItem("pf_tts_pitch") || "1.0");
    ut.pitch = Math.max(0.5, Math.min(2.0, pitch));
  } catch {
    // use defaults
  }
  
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(ut);
  return ut;
}

export function useTTS() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [enabled, setEnabledState] = useState(() => {
    try {
      const stored = localStorage.getItem("pf_tts_enabled");
      // Default to disabled (muted) if never set
      return stored === "1";
    } catch {
      return false;
    }
  });
  const currentServerKey = useRef<string | null>(null);
  const currentFetch = useRef<AbortController | null>(null);

  const setEnabled = useCallback((value: boolean) => {
    try {
      localStorage.setItem("pf_tts_enabled", value ? "1" : "0");
      setEnabledState(value);
    } catch {
      // ignore
    }
  }, []);

  const stop = useCallback(() => {
    try {
      if (window.speechSynthesis && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
    } catch {}
    try {
      currentFetch.current?.abort();
    } catch {}
    if (currentServerKey.current) {
      // notify server to abort generation
      fetch("/api/tts/abort", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: currentServerKey.current }),
      }).catch(() => {});
      currentServerKey.current = null;
    }
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.src = "";
      } catch {}
    }
    setSpeaking(false);
  }, []);

  const speak = useCallback(async (text: string) => {
    stop();
    if (!text) return;
    
    // Check if TTS is enabled
    const isEnabled = (() => {
      try {
        return localStorage.getItem("pf_tts_enabled") === "1";
      } catch {
        return false;
      }
    })();
    if (!isEnabled) return;
    const provider = (() => {
      try {
        return localStorage.getItem("pf_tts_provider") || "webspeech";
      } catch {
        return "webspeech";
      }
    })();

    // simple heuristic: prefer WebSpeech for long text to avoid provider cost
    if (provider !== "openai" || text.length > DEFAULT_TTS_MAX) {
      speakWithWebSpeech(text);
      setSpeaking(true);
      return;
    }

    // call provider
    const ctrl = new AbortController();
    currentFetch.current = ctrl;
    try {
      // Get voice setting for provider
      const voice = (() => {
        try {
          return localStorage.getItem("pf_tts_voice") || "alloy";
        } catch {
          return "alloy";
        }
      })();
      
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice }),
        signal: ctrl.signal,
      });
      if (!res.ok) {
        // fallback to WebSpeech
        speakWithWebSpeech(text);
        setSpeaking(true);
        return;
      }
      const key = res.headers.get("X-TTS-Cache-Key");
      if (key) currentServerKey.current = key;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        setSpeaking(false);
        try {
          URL.revokeObjectURL(url);
        } catch {}
      };
      setSpeaking(true);
      await audio.play();
      // clear server key when done
      currentServerKey.current = null;
    } catch {
      // on failure, fall back
      speakWithWebSpeech(text);
      setSpeaking(true);
    }
  }, [stop]);

  return { speak, stop, speaking, enabled, setEnabled } as const;
}

export function TTSToggle({ className }: { className?: string }) {
  const { enabled, setEnabled } = useTTS();

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={() => setEnabled(!enabled)}
      aria-label={enabled ? "Disable text-to-speech" : "Enable text-to-speech"}
      className={className}
      title={enabled ? "TTS enabled" : "TTS disabled"}
    >
      {enabled ? (
        <Volume2Icon className="size-4" />
      ) : (
        <VolumeXIcon className="size-4" />
      )}
    </Button>
  );
}

export default useTTS;
