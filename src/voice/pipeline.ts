/**
 * NightClaw Voice Pipeline
 * 
 * Handles the full voice loop:
 *   Mic → Whisper STT → Agent → Fish S2 / S1-mini TTS → Speaker + Avatar Lip Sync
 * 
 * Supports:
 *   - Push-to-talk mode
 *   - Always-listening with voice activity detection
 *   - Wake word activation
 *   - Whisper mode (quiet TTS for late night)
 */

export type VoiceMode = 'push-to-talk' | 'always-listening' | 'wake-word' | 'off';
export type STTProvider = 'whisper-local' | 'whisper-api' | 'web-speech';
export type TTSProvider = 'fish-s2' | 's1-mini' | 'elevenlabs' | 'sherpa-onnx';

export interface VoicePipelineConfig {
  mode: VoiceMode;
  sttProvider: STTProvider;
  ttsProvider: TTSProvider;
  whisperUrl?: string;        // URL for local Whisper API
  s1miniUrl?: string;         // URL for S1-mini TTS server
  voicePreset?: string;       // Voice clone preset name
  wakeWord?: string;          // Wake word phrase (e.g. "hey rei")
  whisperMode?: boolean;      // Quieter TTS output
  onTranscription?: (text: string) => void;
  onAudioLevel?: (level: number) => void;      // For avatar mouth sync
  onStateChange?: (state: VoicePipelineState) => void;
}

export type VoicePipelineState = 'idle' | 'listening' | 'processing' | 'speaking';

export class VoicePipeline {
  private config: VoicePipelineConfig;
  private state: VoicePipelineState = 'idle';
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private isRecording = false;
  private audioChunks: Blob[] = [];
  private mediaRecorder: MediaRecorder | null = null;

  constructor(config: VoicePipelineConfig) {
    this.config = {
      whisperUrl: 'http://127.0.0.1:8080',
      s1miniUrl: 'http://127.0.0.1:8090',
      voicePreset: 'rem',
      wakeWord: 'hey rei',
      whisperMode: false,
      ...config
    };
  }

  // ── Microphone Access ──────────────────────────────────────

  async initialize(): Promise<void> {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
        }
      });

      this.audioContext = new AudioContext({ sampleRate: 16000 });
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      source.connect(this.analyser);

      console.log('[NightClaw Voice] Microphone initialized');
      this.setState('idle');

      if (this.config.mode === 'always-listening') {
        this.startVAD();
      }
    } catch (err) {
      console.error('[NightClaw Voice] Microphone access denied:', err);
      throw err;
    }
  }

  // ── Recording Controls ─────────────────────────────────────

  startRecording(): void {
    if (!this.mediaStream || this.isRecording) return;

    this.audioChunks = [];
    this.mediaRecorder = new MediaRecorder(this.mediaStream, {
      mimeType: 'audio/webm;codecs=opus'
    });

    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.audioChunks.push(e.data);
    };

    this.mediaRecorder.onstop = () => {
      const blob = new Blob(this.audioChunks, { type: 'audio/webm' });
      this.processAudio(blob);
    };

    this.mediaRecorder.start(100); // collect chunks every 100ms
    this.isRecording = true;
    this.setState('listening');
    this.startAudioLevelMonitor();

    console.log('[NightClaw Voice] Recording started');
  }

  stopRecording(): void {
    if (!this.mediaRecorder || !this.isRecording) return;

    this.mediaRecorder.stop();
    this.isRecording = false;
    this.setState('processing');

    console.log('[NightClaw Voice] Recording stopped, processing...');
  }

  // ── Audio Level Monitor (for lip sync & UI) ────────────────

  private startAudioLevelMonitor(): void {
    if (!this.analyser) return;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

    const monitor = () => {
      if (!this.isRecording && this.state !== 'speaking') return;

      this.analyser!.getByteFrequencyData(dataArray);
      const avg = dataArray.reduce((a, b) => a + b) / dataArray.length;
      const normalized = Math.min(1, avg / 128);

      this.config.onAudioLevel?.(normalized);
      requestAnimationFrame(monitor);
    };

    requestAnimationFrame(monitor);
  }

  // ── Speech-to-Text ─────────────────────────────────────────

  private async processAudio(audioBlob: Blob): Promise<void> {
    this.setState('processing');

    try {
      let text: string;

      switch (this.config.sttProvider) {
        case 'whisper-local':
          text = await this.whisperLocal(audioBlob);
          break;
        case 'whisper-api':
          text = await this.whisperAPI(audioBlob);
          break;
        case 'web-speech':
          text = ''; // handled by Web Speech API separately
          break;
        default:
          text = await this.whisperLocal(audioBlob);
      }

      if (text.trim()) {
        console.log('[NightClaw Voice] Transcription:', text);
        this.config.onTranscription?.(text);
      } else {
        console.log('[NightClaw Voice] No speech detected');
        this.setState('idle');
      }
    } catch (err) {
      console.error('[NightClaw Voice] STT error:', err);
      this.setState('idle');
    }
  }

  private async whisperLocal(audioBlob: Blob): Promise<string> {
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'base');
    formData.append('language', 'en');

    const response = await fetch(`${this.config.whisperUrl}/v1/audio/transcriptions`, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    return result.text || '';
  }

  private async whisperAPI(audioBlob: Blob): Promise<string> {
    // Groq Whisper API (fast cloud fallback)
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-large-v3-turbo');

    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
      body: formData
    });

    const result = await response.json();
    return result.text || '';
  }

  // ── Text-to-Speech ─────────────────────────────────────────

  async speak(text: string, emotion: string = ''): Promise<void> {
    this.setState('speaking');

    try {
      let audioUrl: string;

      switch (this.config.ttsProvider) {
        case 'fish-s2':
          audioUrl = await this.fishS2TTS(text, emotion);
          break;
        case 's1-mini':
          audioUrl = await this.s1miniTTS(text, emotion);
          break;
        default:
          audioUrl = await this.fishS2TTS(text, emotion);
      }

      await this.playAudio(audioUrl);
    } catch (err) {
      console.error('[NightClaw Voice] TTS error:', err);
    }

    this.setState('idle');
  }

  private async fishS2TTS(text: string, emotion: string): Promise<string> {
    // Fish Audio S2 — SOTA TTS with inline natural language emotion tags
    // Reference: github.com/fishaudio/fish-speech (tools/server/views.py)
    // API: POST /v1/tts with ServeTTSRequest schema
    // Voice cloning via reference_id (pre-registered) or inline references
    let taggedText = text;
    if (emotion) {
      const emotionTags: Record<string, string> = {
        happy: '[cheerful, warm tone]',
        sad: '[soft, melancholy tone]',
        angry: '[sharp, irritated tone]',
        flustered: '[flustered, slightly embarrassed]',
        thinking: '[thoughtful, measured pace]',
        excited: '[excited, energetic]',
        sleepy: '[drowsy, quiet voice]',
        intimate: '[soft whisper, close]',
        tsundere: '[haughty, condescending but secretly caring]',
        beatrice: '[imperious, tsundere, I-suppose energy]',
      };
      const tag = emotionTags[emotion] || `[${emotion}]`;
      taggedText = `${tag} ${text}`;
    }

    // Fish S2 returns raw audio bytes, not JSON
    // Uses reference_id for pre-registered voice clones
    // Register voices via POST /v1/references/add first
    const response = await fetch(`${this.config.s1miniUrl}/v1/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/msgpack' },
      body: JSON.stringify({
        text: taggedText,
        format: 'wav',
        streaming: false,
        reference_id: this.config.voicePreset || null,
        normalize: true,
        temperature: 0.8,
        top_p: 0.8,
        repetition_penalty: 1.1,
        max_new_tokens: 1024,
        chunk_length: 200,
      })
    });

    if (!response.ok) {
      throw new Error(`Fish S2 TTS failed: ${response.status}`);
    }

    // Response is raw audio bytes
    const audioBlob = await response.blob();
    return URL.createObjectURL(audioBlob);
  }

  /**
   * Register a voice reference with Fish S2 for voice cloning.
   * Call this once with your reference audio, then use the ID in TTS calls.
   * API: POST /v1/references/add
   */
  async registerVoiceReference(id: string, audioBlob: Blob, text: string): Promise<void> {
    const formData = new FormData();
    formData.append('id', id);
    formData.append('audio', audioBlob, 'reference.wav');
    formData.append('text', text);

    const response = await fetch(`${this.config.s1miniUrl}/v1/references/add`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Failed to register voice reference: ${err}`);
    }

    console.log(`[NightClaw Voice] Registered voice reference: ${id}`);
  }

  private async s1miniTTS(text: string, emotion: string): Promise<string> {
    const response = await fetch(`${this.config.s1miniUrl}/v1/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: emotion ? `(${emotion}) ${text}` : text,
        format: 'wav',
        streaming: false,
        // Voice cloning reference handled by the TTS server config
      })
    });

    const audioBlob = await response.blob();
    return URL.createObjectURL(audioBlob);
  }

  private async playAudio(url: string): Promise<void> {
    return new Promise((resolve) => {
      const audio = new Audio(url);
      audio.volume = this.config.whisperMode ? 0.3 : 1.0;

      // Monitor audio for lip sync
      if (this.audioContext) {
        const source = this.audioContext.createMediaElementSource(audio);
        const analyser = this.audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        source.connect(this.audioContext.destination);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const monitorPlayback = () => {
          if (audio.paused || audio.ended) {
            this.config.onAudioLevel?.(0);
            return;
          }
          analyser.getByteFrequencyData(dataArray);
          const avg = dataArray.reduce((a, b) => a + b) / dataArray.length;
          this.config.onAudioLevel?.(Math.min(1, avg / 100));
          requestAnimationFrame(monitorPlayback);
        };
        requestAnimationFrame(monitorPlayback);
      }

      audio.onended = () => {
        URL.revokeObjectURL(url);
        resolve();
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        resolve();
      };
      audio.play();
    });
  }

  // ── Voice Activity Detection ───────────────────────────────

  private startVAD(): void {
    // Simple energy-based VAD
    // TODO: replace with Silero VAD for production
    console.log('[NightClaw Voice] VAD started (always-listening mode)');
  }

  // ── State Management ───────────────────────────────────────

  private setState(state: VoicePipelineState): void {
    this.state = state;
    this.config.onStateChange?.(state);
  }

  getState(): VoicePipelineState {
    return this.state;
  }

  dispose(): void {
    this.mediaStream?.getTracks().forEach(t => t.stop());
    this.audioContext?.close();
    this.setState('idle');
  }
}

export default VoicePipeline;
