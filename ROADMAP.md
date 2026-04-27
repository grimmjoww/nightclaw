# NightClaw Progress Tracker

This tracker reflects the current rebuild, not the discarded first attempt.

## Rebuild Baseline

- [x] Reset app direction to desktop-only Tauri/React/Rust.
- [x] Transplant working OpenMaiWaifu desktop companion core instead of rewriting it.
- [x] Rebrand package, Tauri config, Rust crate, storage paths, and tray identity to NightClaw.
- [x] Keep OpenClaw as the agent backend.
- [x] Keep the 3D VRM body, expressions, motions, touch reactions, physics, screen awareness, settings, setup wizard, and tray behavior from working reference code.
- [x] Add bundled default VRM to `public/models/default.vrm`.

## NightClaw Additions

- [x] Add BYO model prep inspection for VRM, GLB, GLTF, FBX, Unity package, and Unreal asset inputs.
- [x] Add optional voice provider architecture without bundling Fish Audio code or weights.
- [x] Support Fish Audio S2-Pro API connector as a personal/provider option.
- [x] Support Piper HTTP, OpenAI-compatible speech, and custom JSON HTTP voice providers.
- [x] Route character speech bubbles through optional TTS playback.
- [x] Add room/overlay presence toggle.
- [x] Add attribution and rebuild docs.

## Verification

- [x] Added focused tests for model prep.
- [x] Added focused tests for voice provider request builders.
- [x] Added focused tests for room environment construction.
- [x] Run the complete test suite after dependencies are installed.
- [x] Run TypeScript typecheck.
- [x] Run frontend production build.
- [x] Run Rust `cargo check`.
- [ ] Run full Tauri installer packaging once elevated build approval is available.

## Next Real Milestones

- [ ] Add lip-sync from generated audio into VRM mouth expressions.
- [ ] Add STT input as an optional provider layer.
- [ ] Add VMC/OSC bridge prototype for Unity/Unreal companion scenes.
- [ ] Add a richer model manifest editor for seller license notes and texture setup notes.
- [ ] Add packaged installer verification on a clean Windows profile.
