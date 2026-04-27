# NightClaw

NightClaw is a native desktop AI companion shell built around OpenClaw, a 3D VRM body, persistent companion memory, screen-aware reactions, optional voice output, and a room/overlay presence mode.

This rebuild intentionally starts from working MIT reference code instead of reinventing the basics. The current desktop core is based on OpenMaiWaifu's Tauri/React/VRM/OpenClaw implementation, then adapted into the NightClaw project shape.

## Current Shape

- Desktop app only: Tauri v2, React, Three.js, and Rust backend commands.
- 3D body required: loads VRM models, bundled default model, drag/drop model import, expressions, motions, physics, touch/headpat reactions, and screen-positioned speech bubbles.
- Agent backend: OpenClaw gateway/CLI integration, first-run setup, tray controls, screen awareness, reactive comments, memory tiers, personality islands, and SOUL-style identity state.
- Presence modes: transparent desktop overlay and a full room scene toggle.
- Voice: optional provider system with Fish Audio S2-Pro API support, Piper HTTP, OpenAI-compatible speech endpoints, and custom JSON HTTP providers.
- Model policy: bring your own VRM. Unity packages, Unreal assets, FBX, GLB, and GLTF are handled as prep/export workflows rather than pretending they are directly loadable VRM.

## What Is Not Bundled

- Fish Audio S2-Pro/Fish Speech code or weights are not bundled. They use the Fish Audio Research License, not MIT, so NightClaw only provides an optional connector.
- Bought/private VRM assets are not redistributed by this repo. The app supports local model manifests and import paths, but model rights stay with the asset owner/seller.
- Web UI, TUI, Discord, STT, and engine-native Unity/Unreal bridges are not part of this desktop rebuild yet.

## Run From Source

```bash
npm install
npm run tauri:dev
```

For tests:

```bash
npm run test:run
npm run typecheck
```

## Model Pipeline

NightClaw loads `.vrm` directly. For other formats:

- `.glb`, `.gltf`, `.fbx`: convert/export to VRM with Blender or Unity plus UniVRM.
- `.unitypackage`: import in Unity and export a VRM, or connect later through a Unity bridge.
- `.uasset`: export through Unreal-supported paths such as FBX plus VRM conversion or VRM4U, or connect later through an Unreal bridge.

See `docs/model-pipeline.md`.

## Voice Pipeline

Voice is disabled by default. In Settings, choose:

- Fish S2-Pro for a personal Fish Audio API setup.
- Piper HTTP for local open-source TTS servers.
- OpenAI-compatible speech for compatible local/cloud endpoints.
- Custom JSON HTTP for other local TTS apps.

See `docs/voice-providers.md`.

## Attribution

NightClaw uses or adapts MIT/open-source reference work with attribution. See `THIRD_PARTY_NOTICES.md` and `UPSTREAM.md`.

## License

NightClaw project code is MIT unless a file states otherwise. External models, voices, reference assets, and optional providers keep their own licenses.
