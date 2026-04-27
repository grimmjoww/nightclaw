import { invoke } from "@tauri-apps/api/core";
import { log } from "./logger.ts";

export type VoiceProvider =
  | "disabled"
  | "fish_s2_pro"
  | "piper_http"
  | "openai_compatible_speech"
  | "custom_http_json";

export type VoiceLatency = "low" | "balanced" | "normal";

export interface VoiceSettings {
  provider: VoiceProvider;
  endpoint: string;
  apiKey: string;
  voiceId: string;
  model: string;
  format: string;
  speed: number;
  volume: number;
  latency: VoiceLatency;
  customHeaders: Record<string, string>;
  customBodyTemplate: string;
}

export interface VoiceHttpRequest {
  endpoint: string;
  method: "POST";
  headers: Record<string, string>;
  body: unknown;
  mimeType: string;
  extension: string;
}

export interface VoiceHttpResult {
  bytes: number[];
  mimeType: string;
  extension: string;
}

export const VOICE_SETTINGS_KEY = "nightclaw_voice_settings";

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  provider: "disabled",
  endpoint: "",
  apiKey: "",
  voiceId: "",
  model: "s2-pro",
  format: "mp3",
  speed: 1,
  volume: 0,
  latency: "normal",
  customHeaders: {},
  customBodyTemplate: "",
};

const FISH_TTS_ENDPOINT = "https://api.fish.audio/v1/tts";
const PIPER_ENDPOINT = "http://127.0.0.1:5000";
const OPENAI_SPEECH_ENDPOINT = "http://127.0.0.1:8000/v1/audio/speech";

export function normalizeVoiceSettings(
  partial: Partial<VoiceSettings> | null | undefined,
): VoiceSettings {
  const provider = partial?.provider ?? DEFAULT_VOICE_SETTINGS.provider;
  const normalized: VoiceSettings = {
    ...DEFAULT_VOICE_SETTINGS,
    ...partial,
    provider,
    customHeaders: partial?.customHeaders ?? {},
  };

  if (provider === "fish_s2_pro" && !normalized.model.trim()) {
    normalized.model = "s2-pro";
  }
  if (!normalized.format.trim()) {
    normalized.format = "mp3";
  }
  normalized.speed = Number.isFinite(normalized.speed) ? normalized.speed : 1;
  normalized.volume = Number.isFinite(normalized.volume) ? normalized.volume : 0;
  return normalized;
}

export function loadVoiceSettings(): VoiceSettings {
  try {
    const raw = localStorage.getItem(VOICE_SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_VOICE_SETTINGS };
    return normalizeVoiceSettings(JSON.parse(raw) as Partial<VoiceSettings>);
  } catch {
    return { ...DEFAULT_VOICE_SETTINGS };
  }
}

export function saveVoiceSettings(settings: VoiceSettings): void {
  localStorage.setItem(VOICE_SETTINGS_KEY, JSON.stringify(settings));
}

function mimeForFormat(format: string): string {
  switch (format.toLowerCase()) {
    case "wav":
    case "pcm":
      return "audio/wav";
    case "opus":
      return "audio/ogg";
    case "mp3":
    default:
      return "audio/mpeg";
  }
}

function extensionForFormat(format: string): string {
  const lower = format.toLowerCase();
  if (lower === "wav" || lower === "pcm" || lower === "opus") return lower;
  return "mp3";
}

function escapeTemplateString(value: string): string {
  return JSON.stringify(value).slice(1, -1);
}

export function renderJsonTemplate(
  template: string,
  settings: VoiceSettings,
  text: string,
): unknown {
  const rendered = template
    .replaceAll("{{text}}", escapeTemplateString(text))
    .replaceAll("{{voiceId}}", escapeTemplateString(settings.voiceId))
    .replaceAll("{{model}}", escapeTemplateString(settings.model))
    .replaceAll("{{format}}", escapeTemplateString(settings.format))
    .replaceAll("{{speed}}", String(settings.speed))
    .replaceAll("{{volume}}", String(settings.volume));

  return JSON.parse(rendered);
}

function requireEndpoint(endpoint: string, fallback: string): string {
  const value = endpoint.trim() || fallback;
  if (!/^https?:\/\//i.test(value)) {
    throw new Error("Voice provider endpoint must start with http:// or https://");
  }
  return value;
}

export function buildVoiceHttpRequest(
  text: string,
  inputSettings: VoiceSettings,
): VoiceHttpRequest | null {
  const cleanText = text.trim();
  if (!cleanText) return null;

  const settings = normalizeVoiceSettings(inputSettings);
  const format = settings.format || "mp3";
  const mimeType = mimeForFormat(format);
  const extension = extensionForFormat(format);

  switch (settings.provider) {
    case "disabled":
      return null;
    case "fish_s2_pro": {
      if (!settings.apiKey.trim()) {
        throw new Error("Fish Audio API key is required for Fish S2-Pro voice.");
      }
      const body: Record<string, unknown> = {
        text: cleanText,
        format,
        latency: settings.latency,
        normalize: true,
        prosody: {
          speed: settings.speed,
          volume: settings.volume,
          normalize_loudness: true,
        },
      };
      if (settings.voiceId.trim()) {
        body.reference_id = settings.voiceId.trim();
      }
      return {
        endpoint: requireEndpoint(settings.endpoint, FISH_TTS_ENDPOINT),
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${settings.apiKey.trim()}`,
          model: settings.model.trim() || "s2-pro",
        },
        body,
        mimeType,
        extension,
      };
    }
    case "piper_http":
      return {
        endpoint: requireEndpoint(settings.endpoint, PIPER_ENDPOINT),
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          text: cleanText,
          ...(settings.voiceId.trim() ? { voice: settings.voiceId.trim() } : {}),
          length_scale: settings.speed,
        },
        mimeType: "audio/wav",
        extension: "wav",
      };
    case "openai_compatible_speech":
      return {
        endpoint: requireEndpoint(settings.endpoint, OPENAI_SPEECH_ENDPOINT),
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(settings.apiKey.trim()
            ? { Authorization: `Bearer ${settings.apiKey.trim()}` }
            : {}),
        },
        body: {
          model: settings.model.trim() || "tts-1",
          input: cleanText,
          voice: settings.voiceId.trim() || "alloy",
          response_format: extension,
          speed: settings.speed,
        },
        mimeType,
        extension,
      };
    case "custom_http_json": {
      const body = settings.customBodyTemplate.trim()
        ? renderJsonTemplate(settings.customBodyTemplate, settings, cleanText)
        : { text: cleanText };
      return {
        endpoint: requireEndpoint(settings.endpoint, ""),
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...settings.customHeaders,
        },
        body,
        mimeType,
        extension,
      };
    }
  }
}

export async function synthesizeVoice(
  text: string,
  settings = loadVoiceSettings(),
): Promise<VoiceHttpResult | null> {
  const request = buildVoiceHttpRequest(text, settings);
  if (!request) return null;
  return invoke<VoiceHttpResult>("synthesize_voice_http", { request });
}

export class VoiceManager {
  private currentAudio: HTMLAudioElement | null = null;
  private currentUrl: string | null = null;

  async speak(text: string): Promise<void> {
    const settings = loadVoiceSettings();
    if (settings.provider === "disabled") return;

    try {
      const result = await synthesizeVoice(text, settings);
      if (!result) return;

      this.stop();
      const bytes = new Uint8Array(result.bytes);
      const blob = new Blob([bytes], {
        type: result.mimeType || mimeForFormat(settings.format),
      });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      this.currentAudio = audio;
      this.currentUrl = url;
      audio.addEventListener("ended", () => this.stop(), { once: true });
      await audio.play();
    } catch (err) {
      log.warn("[voiceProviders] Voice synthesis failed:", err);
    }
  }

  stop(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    if (this.currentUrl) {
      URL.revokeObjectURL(this.currentUrl);
      this.currentUrl = null;
    }
  }
}
