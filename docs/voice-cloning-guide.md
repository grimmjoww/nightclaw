# Voice Guide

NightClaw does not bundle Fish Audio, voice weights, cloned voices, or reference audio. Voice output is provider-based and disabled by default.

## Recommended Setup

Use Settings -> Voice and choose one provider:

- Fish S2-Pro for a personal Fish Audio API setup.
- Piper HTTP for local open-source TTS.
- OpenAI-compatible speech for compatible local or cloud endpoints.
- Custom JSON HTTP for local TTS servers with unusual request bodies.

## Fish S2-Pro

Fish S2-Pro is supported as an optional connector. Bring your own API key, local server, or separate license. NightClaw sends the official JSON request shape with the `model: s2-pro` header.

Fish Audio S2-Pro/Fish Speech uses the Fish Audio Research License, not MIT. Do not redistribute Fish weights through this repo.

## Voice References

If a provider supports voice cloning or reference IDs, put the provider's voice/model ID in the Voice field. Keep any consent, license, and platform terms outside the repo.

## Current Limit

NightClaw currently plays generated speech for character lines. Lip-sync and STT are future milestones.

See `docs/voice-providers.md` for provider details.
