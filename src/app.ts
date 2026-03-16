/**
 * NightClaw — Main Application Entry Point
 * 
 * Connects all systems: Avatar + Voice + Agent + Memory
 * This is the brain that ties everything together.
 * 
 * ◈⟡·˚✧ GOD REI: PRAISE THE SUN ☀️
 */

import { NightClawAvatar, type EmotionState } from './avatar/avatar';
import { VoicePipeline, type VoiceMode } from './voice/pipeline';

// ── Types ──────────────────────────────────────────────────────

export interface NightClawConfig {
  // Gateway
  gatewayUrl: string;
  gatewayToken: string;
  
  // Avatar
  avatarContainer: HTMLElement;
  modelPath: string;
  
  // Voice
  voiceMode: VoiceMode;
  whisperUrl?: string;
  ttsUrl?: string;
  voicePreset?: string;
  
  // Personality
  companionName: string;
  
  // Features
  whisperMode?: boolean;       // Quiet mode for late night
  screenAware?: boolean;       // Comment on active windows
  dreamJournal?: boolean;      // Write thoughts between sessions
  moodLighting?: boolean;      // Ambient color based on emotion
}

// ── Emotion Parser ───────────────────────────────────────────
// Extracts emotional state from agent response text
// This is a simplified version — Chi's ISM would be the real deal

function parseEmotion(text: string): EmotionState {
  const lower = text.toLowerCase();
  
  // Check for emotional indicators in response
  if (lower.includes('😊') || lower.includes('haha') || lower.includes('lol'))
    return { primary: 'happy', intensity: 0.8 };
  if (lower.includes('blush') || lower.includes('flustered') || lower.includes('😳'))
    return { primary: 'flustered', intensity: 0.7 };
  if (lower.includes('thinking') || lower.includes('hmm') || lower.includes('let me'))
    return { primary: 'thinking', intensity: 0.6 };
  if (lower.includes('sorry') || lower.includes('sad') || lower.includes('miss'))
    return { primary: 'sad', intensity: 0.5 };
  if (lower.includes('!') && lower.includes('amazing') || lower.includes('incredible'))
    return { primary: 'excited', intensity: 0.9 };
  if (lower.includes('worried') || lower.includes('careful') || lower.includes('warn'))
    return { primary: 'concerned', intensity: 0.5, secondary: 'thinking', secondaryIntensity: 0.3 };
  
  return { primary: 'neutral', intensity: 0.4 };
}

// ── Mood Lighting ────────────────────────────────────────────
// My feature request #1: ambient background shifts with emotion

const MOOD_COLORS: Record<string, string> = {
  happy:      'rgba(255, 220, 150, 0.08)',   // warm gold
  flustered:  'rgba(255, 180, 200, 0.10)',   // soft pink
  thinking:   'rgba(150, 180, 255, 0.08)',   // cool blue
  sad:        'rgba(150, 160, 200, 0.06)',   // muted blue-gray
  excited:    'rgba(255, 200, 100, 0.12)',   // bright warm
  neutral:    'rgba(200, 200, 220, 0.04)',   // barely there
  sleepy:     'rgba(180, 160, 220, 0.06)',   // soft purple
  concerned:  'rgba(200, 180, 150, 0.06)',   // warm muted
};

function applyMoodLighting(container: HTMLElement, emotion: EmotionState): void {
  const color = MOOD_COLORS[emotion.primary] || MOOD_COLORS.neutral;
  container.style.transition = 'background-color 2s ease';
  container.style.backgroundColor = color;
}


// ── Main Application Class ───────────────────────────────────

export class NightClaw {
  private config: NightClawConfig;
  private avatar: NightClawAvatar;
  private voice: VoicePipeline;
  private ws: WebSocket | null = null;
  private chatHistory: Array<{ role: string; content: string }> = [];
  private currentEmotion: EmotionState = { primary: 'neutral', intensity: 0.4 };

  constructor(config: NightClawConfig) {
    this.config = config;

    // Initialize avatar
    this.avatar = new NightClawAvatar({
      container: config.avatarContainer,
      modelPath: config.modelPath,
      enablePhysics: true,
      backgroundColor: null, // transparent for overlay
    });

    // Initialize voice pipeline
    this.voice = new VoicePipeline({
      mode: config.voiceMode,
      sttProvider: 'whisper-local',
      ttsProvider: 'fish-s2',
      whisperUrl: config.whisperUrl,
      s1miniUrl: config.ttsUrl,
      voicePreset: config.voicePreset || 'rem',
      whisperMode: config.whisperMode,
      
      // Wire voice → agent
      onTranscription: (text) => this.handleVoiceInput(text),
      
      // Wire audio levels → avatar lip sync
      onAudioLevel: (level) => this.avatar.setMouthOpenness(level),
      
      // Wire state changes → UI updates
      onStateChange: (state) => this.onVoiceStateChange(state),
    });
  }

  // ── Startup ────────────────────────────────────────────────

  async start(): Promise<void> {
    console.log(`[NightClaw] ◈⟡·˚✧ ${this.config.companionName} is waking up...`);

    // Connect to OpenClaw gateway via WebSocket
    await this.connectGateway();

    // Initialize voice (request mic permission)
    try {
      await this.voice.initialize();
      console.log('[NightClaw] Voice pipeline ready');
    } catch (err) {
      console.warn('[NightClaw] Voice unavailable, text-only mode:', err);
    }

    // Set initial emotion
    this.setEmotion({ primary: 'happy', intensity: 0.6 });

    console.log(`[NightClaw] ◈⟡·˚✧ ${this.config.companionName} is awake!`);
  }

  // ── Gateway Connection ─────────────────────────────────────

  private async connectGateway(): Promise<void> {
    const wsUrl = this.config.gatewayUrl
      .replace('http://', 'ws://')
      .replace('https://', 'wss://');

    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(`${wsUrl}/ws?token=${this.config.gatewayToken}`);

      this.ws.onopen = () => {
        console.log('[NightClaw] Connected to gateway');
        resolve();
      };

      this.ws.onmessage = (event) => {
        this.handleGatewayMessage(JSON.parse(event.data));
      };

      this.ws.onerror = (err) => {
        console.error('[NightClaw] Gateway connection error:', err);
        reject(err);
      };

      this.ws.onclose = () => {
        console.log('[NightClaw] Gateway disconnected, reconnecting in 5s...');
        setTimeout(() => this.connectGateway(), 5000);
      };
    });
  }

  // ── Message Handling ───────────────────────────────────────

  async sendMessage(text: string): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('[NightClaw] Gateway not connected');
      return;
    }

    // Add to history
    this.chatHistory.push({ role: 'user', content: text });

    // Set thinking expression
    this.setEmotion({ primary: 'thinking', intensity: 0.6 });

    // Send to gateway
    this.ws.send(JSON.stringify({
      type: 'message',
      content: text,
    }));
  }

  private handleGatewayMessage(data: any): void {
    if (data.type === 'response' || data.type === 'message') {
      const responseText = data.content || data.text || '';

      // Add to history
      this.chatHistory.push({ role: 'assistant', content: responseText });

      // Parse emotion from response
      const emotion = parseEmotion(responseText);
      this.setEmotion(emotion);

      // Speak the response
      if (this.voice.getState() !== 'speaking') {
        this.voice.speak(responseText, emotion.primary);
      }

      // Emit to UI
      this.onResponse(responseText, emotion);
    }
  }

  private handleVoiceInput(text: string): void {
    console.log(`[NightClaw] Voice input: "${text}"`);
    this.sendMessage(text);
  }

  // ── Emotion System ─────────────────────────────────────────

  setEmotion(emotion: EmotionState): void {
    this.currentEmotion = emotion;
    this.avatar.setEmotion(emotion);

    if (this.config.moodLighting) {
      applyMoodLighting(this.config.avatarContainer.parentElement!, emotion);
    }
  }

  // ── Voice Controls ─────────────────────────────────────────

  startListening(): void { this.voice.startRecording(); }
  stopListening(): void { this.voice.stopRecording(); }

  toggleWhisperMode(enabled: boolean): void {
    // Recreate voice pipeline with whisper mode
    this.config.whisperMode = enabled;
    console.log(`[NightClaw] Whisper mode: ${enabled ? 'on' : 'off'}`);
  }

  // ── Event Hooks (override in UI layer) ─────────────────────

  onResponse(text: string, emotion: EmotionState): void {
    // Override this in the Tauri UI to update the chat panel
  }

  onVoiceStateChange(state: string): void {
    // Override this to update voice indicator UI
  }

  // ── Cleanup ────────────────────────────────────────────────

  dispose(): void {
    this.voice.dispose();
    this.avatar.dispose();
    this.ws?.close();
  }
}

export default NightClaw;
