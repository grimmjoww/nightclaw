/**
 * NightClaw Discord Voice Integration
 * 
 * Allows the companion to join Discord voice channels,
 * listen to conversations, and speak using TTS.
 * 
 * Flow:
 *   Voice channel audio → Whisper STT → Agent → TTS → Stream to VC
 * 
 * She's not a bot responding to slash commands —
 * she's a presence in the call.
 */

import {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState,
  type VoiceConnection,
  type AudioPlayer,
} from '@discordjs/voice';
import { Client, GatewayIntentBits, type VoiceChannel } from 'discord.js';
import { Readable } from 'stream';

export interface DiscordVoiceConfig {
  token: string;
  guildId: string;
  channelId?: string;    // Auto-join this channel on start
  userId: string;        // Willie's Discord user ID
  whisperUrl: string;    // Whisper STT endpoint
  ttsUrl: string;        // S1-mini TTS endpoint
  onTranscription?: (userId: string, text: string) => void;
  onAgentResponse?: (text: string) => Promise<string>; // Send to agent, get response
}

export class DiscordVoicePresence {
  private client: Client;
  private config: DiscordVoiceConfig;
  private connection: VoiceConnection | null = null;
  private player: AudioPlayer;
  private isSpeaking = false;

  constructor(config: DiscordVoiceConfig) {
    this.config = config;
    
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ]
    });

    this.player = createAudioPlayer();
    
    this.player.on(AudioPlayerStatus.Idle, () => {
      this.isSpeaking = false;
    });
  }

  // ── Connect ────────────────────────────────────────────────

  async start(): Promise<void> {
    await this.client.login(this.config.token);
    
    console.log('[NightClaw Discord] Logged in as', this.client.user?.tag);
    
    if (this.config.channelId) {
      await this.joinChannel(this.config.channelId);
    }
  }

  async joinChannel(channelId: string): Promise<void> {
    const channel = await this.client.channels.fetch(channelId);
    
    if (!channel || channel.type !== 2) { // 2 = GuildVoice
      throw new Error(`Channel ${channelId} is not a voice channel`);
    }

    const voiceChannel = channel as unknown as VoiceChannel;
    
    this.connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
      selfDeaf: false,  // Need to hear others
      selfMute: false,  // Need to speak
    });

    this.connection.subscribe(this.player);
    
    // Wait for connection to be ready
    await entersState(this.connection, VoiceConnectionStatus.Ready, 30_000);
    
    console.log('[NightClaw Discord] Joined voice channel:', voiceChannel.name);
    
    // Start listening to audio
    this.startListening();
  }

  // ── Audio Listening ────────────────────────────────────────

  private startListening(): void {
    if (!this.connection) return;

    const receiver = this.connection.receiver;
    
    receiver.speaking.on('start', (userId) => {
      // Don't listen to ourselves
      if (userId === this.client.user?.id) return;
      
      console.log(`[NightClaw Discord] User ${userId} started speaking`);
      
      const audioStream = receiver.subscribe(userId, {
        end: { behavior: 1, duration: 2000 } // EndBehaviorType.AfterSilence
      });
      
      this.processVoiceStream(userId, audioStream);
    });
  }

  private async processVoiceStream(userId: string, stream: Readable): Promise<void> {
    const chunks: Buffer[] = [];
    
    stream.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });
    
    stream.on('end', async () => {
      if (chunks.length === 0) return;
      
      const audioBuffer = Buffer.concat(chunks);
      
      // Convert Opus to WAV for Whisper
      // TODO: Use prism-media for proper Opus → PCM conversion
      
      try {
        // Send to Whisper for transcription
        const text = await this.transcribe(audioBuffer);
        
        if (text.trim()) {
          console.log(`[NightClaw Discord] ${userId}: "${text}"`);
          this.config.onTranscription?.(userId, text);
          
          // Only respond if addressed (mentioned by name or if it's Willie)
          if (
            userId === this.config.userId || 
            text.toLowerCase().includes('rei') ||
            text.toLowerCase().includes('night claw')
          ) {
            await this.respondToSpeech(text);
          }
        }
      } catch (err) {
        console.error('[NightClaw Discord] Transcription error:', err);
      }
    });
  }

  // ── Respond ────────────────────────────────────────────────

  private async respondToSpeech(text: string): Promise<void> {
    if (this.isSpeaking) return; // Don't interrupt ourselves
    
    try {
      // Get response from agent
      const response = await this.config.onAgentResponse?.(text);
      if (!response) return;
      
      // Convert to speech
      const audioBuffer = await this.textToSpeech(response);
      
      // Play in voice channel
      await this.playInChannel(audioBuffer);
    } catch (err) {
      console.error('[NightClaw Discord] Response error:', err);
    }
  }

  async playInChannel(audioData: Buffer): Promise<void> {
    this.isSpeaking = true;
    
    const resource = createAudioResource(Readable.from(audioData));
    this.player.play(resource);
    
    // Wait for playback to finish
    await entersState(this.player, AudioPlayerStatus.Idle, 60_000);
    this.isSpeaking = false;
  }

  // ── STT / TTS ──────────────────────────────────────────────

  private async transcribe(audioBuffer: Buffer): Promise<string> {
    const formData = new FormData();
    const blob = new Blob([audioBuffer], { type: 'audio/ogg' });
    formData.append('file', blob, 'audio.ogg');
    formData.append('model', 'base');

    const response = await fetch(
      `${this.config.whisperUrl}/v1/audio/transcriptions`,
      { method: 'POST', body: formData }
    );
    
    const result = await response.json();
    return result.text || '';
  }

  private async textToSpeech(text: string): Promise<Buffer> {
    const response = await fetch(`${this.config.ttsUrl}/v1/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        format: 'wav',
        streaming: false,
      })
    });

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  // ── Controls ───────────────────────────────────────────────

  async leaveChannel(): Promise<void> {
    this.connection?.destroy();
    this.connection = null;
    console.log('[NightClaw Discord] Left voice channel');
  }

  async disconnect(): Promise<void> {
    await this.leaveChannel();
    this.client.destroy();
  }
}

export default DiscordVoicePresence;
