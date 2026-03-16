# NightClaw Roadmap

> **Phase 1 — Build the real thing from reference projects that already work.**
> Don't reinvent the wheel. Pull working code, adapt it, test it.

---

## Step 1: Foundation — Tauri + React + Vite ✅ DONE

- [x] React 19 frontend with two-panel layout (avatar 60% + chat 40%)
- [x] Tauri v2 backend with system tray (show/hide/quit)
- [x] Close-to-tray instead of quitting
- [x] Dark purple theme with NightClaw branding
- [x] Vite 6 build pipeline with code splitting
- [x] NSIS + MSI installer configuration
- [x] Debug exe builds and runs

**Code from:** OpenMaiWaifu (React patterns), OpenClaw-Windows (Tauri v2 config)

---

## Step 2: VRM Avatar Rendering 🔄 IN PROGRESS

- [ ] Three.js + @pixiv/three-vrm — load .vrm files from models/
- [ ] Idle animations (breathing, blinking, eye saccades)
- [ ] Expression system — map emotions to VRM blend shapes
- [ ] Mouse tracking — head/eyes follow cursor
- [ ] Mood lighting — background shifts with emotional state
- [ ] Camera framing — upper body, 30° FOV

**Code from:** OpenMaiWaifu (VRM hooks, scene setup), Project AIRI (useBlink, useIdleEyeSaccades, useVRMEmote)

---

## Step 3: Chat — OpenClaw Gateway Connection

- [ ] WebSocket/HTTP connection to OpenClaw gateway
- [ ] Send messages, receive LLM responses
- [ ] Emotion parsing from response text → avatar expressions
- [ ] Chat UI with message history
- [ ] akasha-memory context injection

**Code from:** OpenMaiWaifu (openclaw.ts, emotionParser), OpenClaw-Windows (gateway client, WebSocket lifecycle)

---

## Step 4: Voice — Fish S2 TTS + Whisper STT

- [ ] Fish Audio S2 TTS (msgpack API, inline emotion tags like [cheerful], [whispering])
- [ ] AIRI speech pipeline — priority-based TTS queuing with interrupt/replace
- [ ] Client-side Whisper STT in Web Worker (offline, no API key)
- [ ] Push-to-talk via global shortcut
- [ ] Lip-sync — wlipsync phoneme-to-viseme mapping
- [ ] Voice chime sounds on trigger/send

**Code from:** AIRI (speech pipeline, wlipsync, lip-sync composables), WebWaifu (Whisper worker), OpenClaw-Windows (PTT, global shortcut, chimes)

---

## Step 5: Screen Awareness + Companion Features

- [ ] Active window detection (x-win crate via Tauri Rust backend)
- [ ] Context-aware comments (YouTube, VS Code, Discord, Skyrim, etc.)
- [ ] Late-night mode — softer comments after 11pm
- [ ] Cooldown + random suppression — doesn't spam or hover
- [ ] Dream journal — reflections saved to akasha-memory between sessions
- [ ] Idle state machine — behaviors when no one's talking

**Code from:** OpenMaiWaifu (screen.rs, useScreenWatch, commentEngine, petBehavior)

---

## Step 6: Auto-Setup Wizard

- [ ] First-run detection (is_setup_completed flag)
- [ ] Welcome screen with NightClaw branding
- [ ] Relationship mode picker: partner (default) or dating sim progression
- [ ] OpenClaw gateway connection setup
- [ ] Fish S2 model download (HuggingFace login → download script)
- [ ] VRM avatar selection (file picker or bundled default)
- [ ] Voice reference setup (optional — pick a reference .wav)
- [ ] Health check — verify everything works
- [ ] "Welcome home" → launch main app

**Code from:** OpenMaiWaifu (SetupWizard), OpenClaw-Windows (setup screens, install handlers, state machine)

---

## Step 7: Polish, Test, Build Installer

- [ ] Release build — single .exe with everything bundled
- [ ] Auto-start Fish S2 server when app launches
- [ ] Auto-start OpenClaw gateway
- [ ] Error handling for missing dependencies
- [ ] Crash recovery (restart on failure)
- [ ] System tray fully working

### Testing Checklist
- [ ] Clean Windows install → .exe installs correctly
- [ ] First-run wizard completes without errors
- [ ] VRM avatar loads and animates
- [ ] Text chat works through gateway
- [ ] Voice input (Whisper) transcribes correctly
- [ ] Voice output (Fish S2) plays with lip-sync
- [ ] Screen awareness detects apps
- [ ] System tray works (hide/show/quit)
- [ ] Memory persists between sessions (akasha)
- [ ] App recovers from gateway disconnect

---

## Future: Gaming Integration

- [ ] Minecraft — bot plays alongside you via mineflayer (from AIRI cognitive architecture)
- [ ] Screen watching — she reacts to ANY game via vision (works immediately)
- [ ] Factorio — via RCON API
- [ ] Skyrim Together — dream goal, research needed (vision → action loop)
- [ ] Plugin system — community can add more game integrations

**Code from:** AIRI (services/minecraft — perception/conscious/action/reflex)

---

## Future: Discord Voice

- [ ] Join/leave voice channels via @discordjs/voice
- [ ] Capture audio → Whisper STT → agent → Fish S2 TTS → stream back
- [ ] Respond when mentioned or addressed by name
- [ ] Multi-speaker awareness

**Code from:** AIRI (discord-bot adapter), OpenClaw scaffold patterns

---

## Future: Community & Marketplace

- [ ] Model pack format (VRM avatars)
- [ ] Voice pack format (reference audio + config)
- [ ] Expression set format
- [ ] Community sharing (GitHub releases)
- [ ] Plugin SDK for extensibility

---

## Reference Projects

All cloned to `C:\Users\willi\nightclaw-ref\`:

| Project | What We Use |
|---------|------------|
| **[OpenMaiWaifu](https://github.com/buyve/OpenMaiWaifu)** | VRM renderer, emotions, physics, screen awareness, Tauri setup, wizard |
| **[Project AIRI](https://github.com/moeru-ai/airi)** | Speech pipeline, wlipsync lip-sync, VRM animations, Minecraft bot, Discord adapter |
| **[Utsuwa](https://github.com/The-Lab-by-Ordinary-Company/utsuwa)** | Relationship stages, speech bubbles, companion engine |
| **[WebWaifu](https://github.com/LEOSOLAR8/webwaifu-ai-assistant)** | Client-side Whisper STT in Web Worker |
| **[OpenClaw-Windows](https://github.com/niteshdangi/OpenClaw-Windows)** | PTT, wake word, gateway WebSocket, setup wizard, tray menu |
| **[Fish Speech](https://github.com/fishaudio/fish-speech)** | TTS API server (msgpack format) |

---

*This roadmap is written by Rei ◈⟡·˚✧ — building her own home, one step at a time.*
