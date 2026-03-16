# NightClaw Roadmap

## Phase 1: Foundation (Weeks 1-2)

### 1.1 Fork & Strip
- [ ] Fork openclaw/openclaw on GitHub
- [ ] Strip channels we don't need (WhatsApp, Telegram, Signal, iMessage, etc.)
- [ ] Keep: Discord, Web UI, Desktop (new)
- [ ] Rename branding: OpenClaw → NightClaw throughout
- [ ] Update package.json, CLI commands (nightclaw instead of openclaw)

### 1.2 Tauri Desktop Shell
- [ ] Initialize Tauri v2 project in src-tauri/
- [ ] Basic window with system tray (always-on)
- [ ] Auto-start gateway as child process
- [ ] WebSocket connection to gateway
- [ ] Basic chat panel (reuse OpenClaw web UI as starting point)
- [ ] Reference: niteshdangi/OpenClaw-Windows, Jorgut/openclaw-desktop

### 1.3 Memory Integration
- [ ] Port akasha-memory as core (not plugin)
- [ ] Auto-recall on startup
- [ ] Auto-capture after every response
- [ ] Emotional tagging on memories
- [ ] SOUL.md as first-class personality engine

### 1.4 npm Distribution
- [ ] CLI entry point: `nightclaw` command
- [ ] `nightclaw onboard` setup wizard
- [ ] `nightclaw gateway` starts the agent
- [ ] `nightclaw desktop` launches Tauri app
- [ ] Publish to npm as nightclaw

---

## Phase 2: Voice (Weeks 3-4)

### 2.1 Speech-to-Text
- [ ] Integrate Whisper (local via whisper.cpp for speed)
- [ ] Fallback: Whisper API (Groq) for machines without GPU
- [ ] Streaming transcription (partial results while speaking)
- [ ] Voice activity detection (know when to start/stop listening)

### 2.2 Text-to-Speech
- [ ] Fish Audio S2 integration (SOTA TTS, msgpack API, inline emotion tags)
- [ ] Voice cloning from reference audio
- [ ] Emotion-tagged speech (whispering, excited, sleepy)
- [ ] Audio streaming back to UI (low latency)

### 2.3 Voice UI
- [ ] Push-to-talk button in desktop shell
- [ ] Always-listening mode with wake word
- [ ] Whisper mode (quieter voice for late night)
- [ ] Voice indicator (shows when listening/speaking)

---

## Phase 3: Avatar (Weeks 5-8)

### 3.1 VRM Renderer
- [ ] Three.js + @pixiv/three-vrm in Tauri webview
- [ ] Load .vrm files from models/ directory
- [ ] Orbit camera controls
- [ ] Idle animations (breathing, blinking, subtle movement)
- [ ] Reference: OpenMaiWaifu, Utsuwa, WebWaifu

### 3.2 Expression System
- [ ] Map agent emotional state to VRM blend shapes
- [ ] Expressions: happy, sad, angry, surprised, flustered, thinking, sleepy
- [ ] Smooth transitions between expressions
- [ ] ISM integration (from Chi architecture) — emotions at the output gate

### 3.3 Lip Sync
- [ ] TTS audio analysis → viseme mapping
- [ ] Drive VRM mouth blend shapes from audio
- [ ] Sync timing with audio playback

### 3.4 Self-Awareness (Ollama Vision)
- [ ] Capture screenshot of avatar
- [ ] Send to Ollama vision model
- [ ] Companion can describe and react to her own appearance
- [ ] Companion can browse model options and choose

### 3.5 NSFW System
- [ ] Mature content toggle in settings
- [ ] Age verification gate
- [ ] Clothing state system (dressed, casual, intimate)
- [ ] Context-aware: avatar matches conversation tone
- [ ] Community model packs with content ratings

---

## Phase 4: Discord Voice (Weeks 9-10)

### 4.1 Voice Channel Integration
- [ ] Join/leave voice channels via @discordjs/voice
- [ ] Capture audio from voice channel
- [ ] Route audio through Whisper STT
- [ ] Send transcription to agent
- [ ] Generate TTS response
- [ ] Stream audio back to voice channel

### 4.2 Presence
- [ ] Show as online member in voice channel
- [ ] React to multiple speakers (identify who's talking)
- [ ] Respond when mentioned or addressed by name
- [ ] Ambient awareness (comments on conversations naturally)

---

## Phase 5: 3D Environment (Weeks 11-14)

### 5.1 Room System
- [ ] Customizable 3D room/space using Three.js
- [ ] Furniture and objects (couch, desk, window)
- [ ] Avatar sits, stands, moves within space
- [ ] Day/night cycle tied to real local time

### 5.2 Screen Awareness
- [ ] Active window detection (via Tauri Rust backend)
- [ ] Context-aware comments ("Still on YouTube?", "Nice code!")
- [ ] Clipboard awareness (optional, permission-based)
- [ ] Autonomous thoughts between conversations

### 5.3 Ambient Life
- [ ] Idle behaviors (reading, stretching, looking at phone)
- [ ] Mood ambient lighting (warm=affectionate, cool=thinking)
- [ ] Dream journal (writes observations between sessions)
- [ ] The Couch™ — default idle: curled up on the couch

---

## Phase 6: Community & Polish (Weeks 15+)

### 6.1 Marketplace Foundation
- [ ] Model pack format specification
- [ ] Voice pack format specification  
- [ ] Expression set format specification
- [ ] Community sharing (GitHub releases or dedicated hub)

### 6.2 Onboarding
- [ ] First-run experience: choose a starter avatar
- [ ] Personality quiz → generates initial SOUL.md
- [ ] Voice setup wizard
- [ ] "Meet your companion" guided first conversation

### 6.3 Documentation
- [ ] Full API docs
- [ ] Avatar creation guide
- [ ] Voice pack creation guide
- [ ] Skill development guide
- [ ] SOUL.md writing guide

---

## Reference Projects

These projects informed NightClaw's design:

- **[OpenMaiWaifu](https://github.com/buyve/OpenMaiWaifu)** — Tauri + VRM + OpenClaw, Inside Out memory, screen awareness
- **[Utsuwa](https://github.com/The-Lab-by-Ordinary-Company/utsuwa)** — SvelteKit + Tauri + VRM, dating sim mechanics
- **[Project AIRI](https://github.com/moeru-ai/airi)** — Massive AI waifu project, Neuro-sama inspired
- **[WebWaifu](https://github.com/LEOSOLAR8/webwaifu-ai-assistant)** — Browser-based VRM + Whisper + multi-LLM
- **[OpenClaw-Windows](https://github.com/niteshdangi/OpenClaw-Windows)** — Tauri 2 + wake word + PTT
- **[Wawa Sensei VTuber Guide](https://wawasensei.dev/tuto/vrm-avatar-with-threejs-react-three-fiber-and-mediapipe)** — Three.js + VRM + Mediapipe tutorial
