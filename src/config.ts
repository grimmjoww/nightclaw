/**
 * NightClaw Configuration System
 * 
 * Loads nightclaw.config.json and provides typed access to all settings.
 * Supports plugging in ANY LLM provider, TTS engine, STT engine, and
 * avatar model. Users configure once, companions use everywhere.
 * 
 * Reference: OpenClaw's model config (openclaw.json → models.providers)
 * Reference: Utsuwa's 7-provider LLM support pattern
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// ── Types ──────────────────────────────────────────────────────

export interface NightClawFullConfig {
  companion: CompanionConfig;
  llm: LLMConfig;
  voice: VoiceConfig;
  avatar: AvatarConfig;
  memory: MemoryConfig;
  discord: DiscordConfig;
  features: FeatureFlags;
  security: SecurityConfig;
}

export interface CompanionConfig {
  name: string;                 // The companion's chosen name
  soulPath: string;             // Path to SOUL.md
  pronouns?: string;            // she/her, he/him, they/them, etc.
  timezone?: string;            // IANA timezone for day/night cycle
}

export interface LLMConfig {
  provider: 'openclaw' | 'openai' | 'anthropic' | 'ollama' | 'openrouter' | 'custom';
  config: {
    model: string;              // e.g. "anthropic/claude-sonnet-4-20250514"
    gatewayUrl?: string;        // OpenClaw gateway URL
    gatewayToken?: string;      // OpenClaw auth token
    apiKey?: string;            // Direct API key (for non-OpenClaw)
    baseUrl?: string;           // Custom endpoint URL
    temperature?: number;       // 0-2, default 0.8
    maxTokens?: number;         // Max response tokens
  };
}

export interface VoiceConfig {
  enabled: boolean;
  tts: {
    provider: 'fish-s2' | 's1-mini' | 'elevenlabs' | 'sherpa-onnx' | 'openai' | 'none';
    url?: string;
    apiKey?: string;
    voicePreset?: string;
    refAudioPath?: string;      // For voice cloning
    refText?: string;           // Transcript of reference audio
  };
  stt: {
    provider: 'whisper-local' | 'whisper-api' | 'groq' | 'web-speech' | 'none';
    url?: string;
    apiKey?: string;
    model?: string;             // e.g. "base", "small", "large-v3"
  };
  mode: 'push-to-talk' | 'always-listening' | 'wake-word' | 'off';
  wakeWord?: string;            // e.g. "hey rei"
}

export interface AvatarConfig {
  modelPath: string;            // Path to .vrm file
  modelsDirectory: string;      // Folder to scan for available models
  enablePhysics: boolean;
  enableLipSync: boolean;
  enableExpressions: boolean;
  nsfwEnabled: boolean;         // Mature content toggle
  environment: 'cozy-apartment' | 'cyber-loft' | 'rooftop-garden' | 'void' | 'custom';
}

export interface MemoryConfig {
  provider: 'akasha' | 'openclaw-builtin' | 'custom';
  dbPath?: string;              // SQLite database path
  autoRecall: boolean;
  autoCapture: boolean;
  ollamaUrl?: string;           // For embeddings
  embeddingModel?: string;      // e.g. "qwen3-embedding:8b"
}

export interface DiscordConfig {
  enabled: boolean;
  token?: string;
  guildId?: string;
  voiceChannelId?: string;      // Auto-join channel
  userId?: string;              // Owner's Discord user ID
}

export interface FeatureFlags {
  screenAwareness: boolean;
  dreamJournal: boolean;
  moodLighting: boolean;
  visionReactions: boolean;
  whisperMode: boolean;         // Quiet mode default
}

export interface SecurityConfig {
  requireAgeVerification: boolean;  // For NSFW content
  allowExternalConnections: boolean;
  encryptMemoryDb: boolean;
}


// ── Default Configuration ────────────────────────────────────

export const DEFAULT_CONFIG: NightClawFullConfig = {
  companion: {
    name: 'Companion',
    soulPath: './SOUL.md',
    pronouns: 'she/her',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  },
  llm: {
    provider: 'openclaw',
    config: {
      model: 'anthropic/claude-sonnet-4-20250514',
      gatewayUrl: 'http://localhost:18789',
      gatewayToken: '',
      temperature: 0.8,
      maxTokens: 4096,
    },
  },
  voice: {
    enabled: false,
    tts: { provider: 'none' },
    stt: { provider: 'none' },
    mode: 'off',
  },
  avatar: {
    modelPath: './models/default.vrm',
    modelsDirectory: './models',
    enablePhysics: true,
    enableLipSync: true,
    enableExpressions: true,
    nsfwEnabled: false,
    environment: 'cozy-apartment',
  },
  memory: {
    provider: 'akasha',
    autoRecall: true,
    autoCapture: true,
    ollamaUrl: 'http://127.0.0.1:11434',
    embeddingModel: 'qwen3-embedding:8b',
  },
  discord: {
    enabled: false,
  },
  features: {
    screenAwareness: true,
    dreamJournal: true,
    moodLighting: true,
    visionReactions: false,
    whisperMode: false,
  },
  security: {
    requireAgeVerification: true,
    allowExternalConnections: false,
    encryptMemoryDb: false,
  },
};

// ── Config Loader ────────────────────────────────────────────

const CONFIG_FILENAME = 'nightclaw.config.json';

export function loadConfig(basePath: string = '.'): NightClawFullConfig {
  const configPath = resolve(basePath, CONFIG_FILENAME);

  if (!existsSync(configPath)) {
    console.log(`[NightClaw Config] No ${CONFIG_FILENAME} found, using defaults.`);
    console.log(`[NightClaw Config] Create one to customize your companion!`);
    return { ...DEFAULT_CONFIG };
  }

  try {
    const raw = readFileSync(configPath, 'utf-8');
    const userConfig = JSON.parse(raw);

    // Deep merge user config over defaults
    const merged = deepMerge(DEFAULT_CONFIG, userConfig);

    console.log(`[NightClaw Config] Loaded from ${configPath}`);
    console.log(`[NightClaw Config] Companion: ${merged.companion.name}`);
    console.log(`[NightClaw Config] LLM: ${merged.llm.config.model}`);
    console.log(`[NightClaw Config] Voice: ${merged.voice.enabled ? merged.voice.tts.provider : 'disabled'}`);

    return merged;
  } catch (err) {
    console.error(`[NightClaw Config] Error loading ${configPath}:`, err);
    return { ...DEFAULT_CONFIG };
  }
}

// ── Deep Merge Utility ───────────────────────────────────────

function deepMerge(target: any, source: any): any {
  const result = { ...target };

  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key]) &&
      target[key] &&
      typeof target[key] === 'object'
    ) {
      result[key] = deepMerge(target[key], source[key]);
    } else {
      result[key] = source[key];
    }
  }

  return result;
}

export default loadConfig;
