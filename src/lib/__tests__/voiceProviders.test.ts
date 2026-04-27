import { describe, expect, it } from "vitest";
import {
  DEFAULT_VOICE_SETTINGS,
  buildVoiceHttpRequest,
  normalizeVoiceSettings,
  renderJsonTemplate,
} from "../voiceProviders.ts";

describe("voiceProviders", () => {
  it("does not build an HTTP request when voice is disabled", () => {
    expect(buildVoiceHttpRequest("hello", DEFAULT_VOICE_SETTINGS)).toBeNull();
  });

  it("builds Fish Audio S2-Pro requests without bundling Fish code or weights", () => {
    const request = buildVoiceHttpRequest("hello", {
      provider: "fish_s2_pro",
      apiKey: "test-token",
      voiceId: "voice-model-id",
      endpoint: "",
      model: "",
      format: "mp3",
      speed: 1,
      volume: 0,
      latency: "balanced",
      customHeaders: {},
      customBodyTemplate: "",
    });

    expect(request?.endpoint).toBe("https://api.fish.audio/v1/tts");
    expect(request?.headers.Authorization).toBe("Bearer test-token");
    expect(request?.headers.model).toBe("s2-pro");
    expect(request?.body).toMatchObject({
      text: "hello",
      reference_id: "voice-model-id",
      format: "mp3",
      latency: "balanced",
    });
    expect(request?.extension).toBe("mp3");
  });

  it("builds Piper HTTP requests for a local server", () => {
    const request = buildVoiceHttpRequest("local speech", {
      ...DEFAULT_VOICE_SETTINGS,
      provider: "piper_http",
      endpoint: "http://127.0.0.1:5000",
      voiceId: "en_US-lessac-medium.onnx",
      speed: 0.8,
    });

    expect(request?.headers["Content-Type"]).toBe("application/json");
    expect(request?.body).toMatchObject({
      text: "local speech",
      voice: "en_US-lessac-medium.onnx",
      length_scale: 0.8,
    });
    expect(request?.extension).toBe("wav");
  });

  it("builds OpenAI-compatible speech requests for broad TTS compatibility", () => {
    const request = buildVoiceHttpRequest("compatible speech", {
      ...DEFAULT_VOICE_SETTINGS,
      provider: "openai_compatible_speech",
      endpoint: "http://127.0.0.1:8000/v1/audio/speech",
      apiKey: "optional-key",
      voiceId: "nova",
      model: "tts-1",
      format: "opus",
    });

    expect(request?.body).toMatchObject({
      input: "compatible speech",
      voice: "nova",
      model: "tts-1",
      response_format: "opus",
    });
    expect(request?.headers.Authorization).toBe("Bearer optional-key");
    expect(request?.mimeType).toBe("audio/ogg");
  });

  it("renders a custom JSON body template for unusual local providers", () => {
    const rendered = renderJsonTemplate(
      '{"prompt":"{{text}}","voice":"{{voiceId}}","speed":{{speed}}}',
      {
        ...DEFAULT_VOICE_SETTINGS,
        provider: "custom_http_json",
        voiceId: "speaker-a",
        speed: 1.15,
      },
      "say \"hi\"",
    );

    expect(rendered).toEqual({
      prompt: 'say "hi"',
      voice: "speaker-a",
      speed: 1.15,
    });
  });

  it("normalizes partial persisted settings", () => {
    expect(normalizeVoiceSettings({ provider: "fish_s2_pro" })).toMatchObject({
      provider: "fish_s2_pro",
      model: "s2-pro",
      format: "mp3",
    });
  });
});
