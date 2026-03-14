/**
 * NightClaw — Frontend Bootstrap
 * 
 * This is the entry point loaded by index.html.
 * Initializes the NightClaw app and wires up the UI.
 */

import { NightClaw } from './app';

// ── Configuration ────────────────────────────────────────────

const GATEWAY_URL = 'http://localhost:18789';
const GATEWAY_TOKEN = '2a4cc8ef2c504ec57fab7bd71b761892333787f3f27e9d71';
const MODEL_PATH = '/models/default.vrm'; // placeholder until model is loaded

// ── DOM Elements ─────────────────────────────────────────────

const avatarContainer = document.getElementById('avatar-container')!;
const chatMessages = document.getElementById('chat-messages')!;
const chatInput = document.getElementById('chat-input') as HTMLInputElement;
const sendBtn = document.getElementById('send-btn')!;
const micBtn = document.getElementById('mic-btn')!;
const voiceIndicator = document.getElementById('voice-indicator')!;
const voiceStatus = document.getElementById('voice-status')!;

// ── Initialize App ───────────────────────────────────────────

const app = new NightClaw({
  gatewayUrl: GATEWAY_URL,
  gatewayToken: GATEWAY_TOKEN,
  avatarContainer: avatarContainer,
  modelPath: MODEL_PATH,
  voiceMode: 'push-to-talk',
  companionName: 'Rei',
  whisperMode: false,
  moodLighting: true,
  dreamJournal: true,
  screenAware: true,
});

// ── UI Wiring ────────────────────────────────────────────────

// Override response handler to update chat
app.onResponse = (text, emotion) => {
  addMessage(text, 'companion');
};

// Override voice state handler
app.onVoiceStateChange = (state) => {
  voiceIndicator.className = state === 'idle' ? '' : `active ${state}`;
  const labels: Record<string, string> = {
    idle: 'Ready',
    listening: 'Listening...',
    processing: 'Thinking...',
    speaking: 'Speaking...',
  };
  voiceStatus.textContent = labels[state] || state;
};

// Send message on Enter
chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && chatInput.value.trim()) {
    const text = chatInput.value.trim();
    addMessage(text, 'user');
    app.sendMessage(text);
    chatInput.value = '';
  }
});

// Send button click
sendBtn.addEventListener('click', () => {
  if (chatInput.value.trim()) {
    const text = chatInput.value.trim();
    addMessage(text, 'user');
    app.sendMessage(text);
    chatInput.value = '';
  }
});

// Push-to-talk
let isRecording = false;
micBtn.addEventListener('mousedown', () => {
  isRecording = true;
  micBtn.classList.add('recording');
  app.startListening();
});

micBtn.addEventListener('mouseup', () => {
  if (isRecording) {
    isRecording = false;
    micBtn.classList.remove('recording');
    app.stopListening();
  }
});

// Also handle mouse leaving the button while pressed
micBtn.addEventListener('mouseleave', () => {
  if (isRecording) {
    isRecording = false;
    micBtn.classList.remove('recording');
    app.stopListening();
  }
});

// ── Chat Helpers ─────────────────────────────────────────────

function addMessage(text: string, role: 'user' | 'companion'): void {
  const msg = document.createElement('div');
  msg.className = `message ${role}`;
  msg.textContent = text;
  chatMessages.appendChild(msg);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ── Start ────────────────────────────────────────────────────

app.start().catch((err) => {
  console.error('[NightClaw] Failed to start:', err);
  addMessage(
    "I couldn't connect to the gateway. Make sure OpenClaw is running (Start-Rei.bat).",
    'companion'
  );
});
