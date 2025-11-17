"use client"

import { useState, useEffect } from "react";
import { Settings2Icon } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import { Label } from "@/app/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Slider } from "@/app/components/ui/slider";
import { Separator } from "@/app/components/ui/separator";

type TTSProvider = "webspeech" | "openai";

type TTSSettingsData = {
  provider: TTSProvider;
  voice: string;
  rate: number;
  pitch: number;
};

const DEFAULT_SETTINGS: TTSSettingsData = {
  provider: "webspeech",
  voice: "default",
  rate: 1.0,
  pitch: 1.0,
};

function loadSettings(): TTSSettingsData {
  try {
    const provider = (localStorage.getItem("pf_tts_provider") || "webspeech") as TTSProvider;
    const voice = localStorage.getItem("pf_tts_voice") || "default";
    const rate = Number(localStorage.getItem("pf_tts_rate") || "1.0");
    const pitch = Number(localStorage.getItem("pf_tts_pitch") || "1.0");
    return { provider, voice, rate, pitch };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(settings: Partial<TTSSettingsData>) {
  try {
    if (settings.provider) {
      localStorage.setItem("pf_tts_provider", settings.provider);
    }
    if (settings.voice) {
      localStorage.setItem("pf_tts_voice", settings.voice);
    }
    if (settings.rate !== undefined) {
      localStorage.setItem("pf_tts_rate", String(settings.rate));
    }
    if (settings.pitch !== undefined) {
      localStorage.setItem("pf_tts_pitch", String(settings.pitch));
    }
  } catch {
    // ignore
  }
}

export function TTSSettings({ className }: { className?: string }) {
  const [settings, setSettings] = useState<TTSSettingsData>(loadSettings);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    // Load available voices for WebSpeech
    if ("speechSynthesis" in window) {
      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices);
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const updateSetting = <K extends keyof TTSSettingsData>(
    key: K,
    value: TTSSettingsData[K]
  ) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    saveSettings({ [key]: value });
  };

  const openAIVoices = [
    { id: "alloy", name: "Alloy" },
    { id: "echo", name: "Echo" },
    { id: "fable", name: "Fable" },
    { id: "onyx", name: "Onyx" },
    { id: "nova", name: "Nova" },
    { id: "shimmer", name: "Shimmer" },
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className={className}
          aria-label="TTS Settings"
          title="Text-to-speech settings"
        >
          <Settings2Icon className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-sm mb-3">Text-to-Speech Settings</h4>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tts-provider" className="text-sm">
              Provider
            </Label>
            <Select
              value={settings.provider}
              onValueChange={(value) => updateSetting("provider", value as TTSProvider)}
            >
              <SelectTrigger id="tts-provider">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="webspeech">Web Speech (Free)</SelectItem>
                <SelectItem value="openai">OpenAI (Paid)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-xs">
              {settings.provider === "webspeech"
                ? "Uses browser's built-in speech synthesis"
                : "Uses OpenAI TTS API (charges apply)"}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tts-voice" className="text-sm">
              Voice
            </Label>
            {settings.provider === "webspeech" ? (
              <Select
                value={settings.voice}
                onValueChange={(value) => updateSetting("voice", value)}
              >
                <SelectTrigger id="tts-voice">
                  <SelectValue placeholder="Select voice" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  {voices.map((voice) => (
                    <SelectItem key={voice.voiceURI} value={voice.voiceURI}>
                      {voice.name} ({voice.lang})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Select
                value={settings.voice}
                onValueChange={(value) => updateSetting("voice", value)}
              >
                <SelectTrigger id="tts-voice">
                  <SelectValue placeholder="Select voice" />
                </SelectTrigger>
                <SelectContent>
                  {openAIVoices.map((voice) => (
                    <SelectItem key={voice.id} value={voice.id}>
                      {voice.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {settings.provider === "webspeech" && (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="tts-rate" className="text-sm">
                    Speed
                  </Label>
                  <span className="text-muted-foreground text-xs">
                    {settings.rate.toFixed(1)}x
                  </span>
                </div>
                <Slider
                  id="tts-rate"
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  value={[settings.rate]}
                  onValueChange={([value]) => updateSetting("rate", value)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="tts-pitch" className="text-sm">
                    Pitch
                  </Label>
                  <span className="text-muted-foreground text-xs">
                    {settings.pitch.toFixed(1)}
                  </span>
                </div>
                <Slider
                  id="tts-pitch"
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  value={[settings.pitch]}
                  onValueChange={([value]) => updateSetting("pitch", value)}
                />
              </div>
            </>
          )}

          <Separator />

          <div className="text-muted-foreground text-xs">
            <p>
              <strong>Tip:</strong> Use Web Speech for zero cost. OpenAI provides
              higher quality voices but incurs API charges.
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default TTSSettings;
