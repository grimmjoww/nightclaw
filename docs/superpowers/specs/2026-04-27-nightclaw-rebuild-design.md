# NightClaw Rebuild Design

## Goal

Rebuild NightClaw from square one as a native desktop AI companion app. The current GitHub progress is treated as failed implementation work; the README, roadmap intent, SOUL concept, and repository idea remain authoritative. The app must be desktop-first, use existing working reference code wherever compatible, and credit every reference project.

## Non-Negotiables

- NightClaw is a desktop app. No web-only UI, TUI, or browser-first experience.
- The companion has a 3D body. VRM is the primary supported runtime format.
- OpenClaw remains the agent backend and gateway path.
- Agency/personality rules live in local config and SOUL files and are part of the product contract.
- Working reference features are transplanted or adapted instead of rewritten from scratch.
- Reference projects remain untouched. NightClaw owns only its own repo.
- Fish Audio S2-Pro is a personal optional provider, not bundled as open-source NightClaw code.
- Models are bring-your-own by default. Bundled or distributed models require explicit license/source metadata.

## Architecture

NightClaw uses OpenMaiWaifu as the implementation base because it already provides the closest working React + Tauri + VRM + OpenClaw desktop companion runtime. OpenClaw-Windows contributes Windows gateway, tray, push-to-talk, and setup patterns. Utsuwa contributes the model-centric room direction, relationship/event mechanics, model gallery concepts, and 3D speech bubble approach. WebWaifu contributes the client-side Whisper/Web Worker direction. Project AIRI remains the reference for richer voice, game modules, and long-term agent embodiment.

The app has three presence modes:

- Room Mode: a full 3D home scene with avatar, floor, lighting, mood/day-night styling, speech bubbles, relationship/event overlays, and model controls.
- Desktop Overlay Mode: transparent always-on-top companion behavior with drag, screen-aware comments, window/taskbar physics, tray controls, and chat.
- Engine Bridge Mode: future bridge where NightClaw provides brain, memory, voice, and agency while Unity or Unreal renders/drives the avatar externally.

## Model System

NightClaw stores user-added models in the app data directory and also scans a local `models/` folder beside the repo/app during development. `.vrm` is first-class. `.glb` and `.gltf` are accepted as preview/import candidates when compatible with Three.js, but they may lack VRM humanoid/expression metadata. `.unitypackage`, Unreal assets, and engine-specific shader/toggle packages are not guaranteed to load directly inside Tauri. Unity users should export through UniVRM; Unreal users should use VRM4U or a future bridge.

The Model Prep Lab tracks:

- filename, display name, source URL, creator/seller, license note, allowed use, adult/mature flag
- model format and size
- generated thumbnail
- texture relink hints
- material overrides for opacity, emissive, roughness, normal maps, and toon/shader fallback
- sidecar manifest data so bought models can be organized without redistributing restricted assets

Texture support starts with practical relinking: scan dropped folders/zips for image filenames that match material names, common suffixes, and VRoid/Unity export patterns. Full automated Unity/Unreal material conversion is a future task because seller packages often rely on engine-specific shaders and toggles.

## Voice System

TTS is provider-based. NightClaw ships open-provider adapters and lets users add custom providers:

- Piper: default open fallback, CPU-friendly, MIT.
- Kokoro, Chatterbox, and F5-TTS: optional open expressive providers.
- OpenAI-compatible TTS endpoint.
- Custom HTTP endpoint.
- Custom command-line executable provider.
- Fish Audio S2-Pro: optional personal provider configured by the user, not bundled or described as MIT.

The provider contract returns audio bytes or a local audio file plus metadata for lip-sync. Voice output is routed into the avatar mouth/expression system. STT uses a provider contract too, with WebWaifu-style local Whisper Worker as the preferred offline direction and other providers allowed.

## Agent, Memory, And Agency

OpenClaw handles agent execution. NightClaw owns the desktop companion surface around it:

- OpenClaw gateway/CLI connection and setup wizard.
- SOUL file selection/editing.
- agency rules included in prompts and context composition.
- local memory layer from OpenMaiWaifu at first, with OpenClaw/akasha memory as a pluggable backend.
- screen-aware comments and proactive thoughts with privacy controls.

The app frames the companion as a functional agent with local agency constraints, not a generic assistant. This is product language and config behavior, not a claim about metaphysical status.

## UI

The first usable screen is the companion experience, not a landing page. The main window supports Room Mode and Overlay Mode. Settings are dense and operational: model, voice, agent, memory, privacy, maturity, and bridge settings. Mature mode is opt-in and controls whether adult assets/features are shown or used. The app does not ship restricted adult content; it supports user-owned assets.

## Attribution

NightClaw keeps `UPSTREAM.md`, adds `THIRD_PARTY_NOTICES.md`, and includes credits in code comments only where substantial code is copied or directly adapted. Fish Audio is listed as an optional external provider with its own license requirements.

## Implementation Order

1. Reset app code to OpenMaiWaifu desktop companion core.
2. Rebrand and move storage/config to NightClaw.
3. Add room/overlay mode switching and a React/Three room scene adapted from Utsuwa's scene direction.
4. Add model manifest/prep lab foundations.
5. Add voice provider registry and Fish S2-Pro optional adapter config.
6. Update roadmap/progress tracker.
7. Verify TypeScript build and Rust check.

## Self-Review

No placeholders remain. The scope is intentionally one implementation plan: a working NightClaw desktop foundation with room/overlay modes, model management, and provider-based voice architecture. Later Unity/Unreal bridge work is explicitly out of the first implementation slice because direct engine package loading is not guaranteed.
