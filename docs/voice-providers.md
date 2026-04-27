# Voice Providers

NightClaw voice output is optional and provider-based. This keeps the app usable for people with different hardware, licenses, and content policies.

## Included Connectors

| Provider | Use Case | Bundled? |
| --- | --- | --- |
| Fish S2-Pro | Personal Fish Audio API setup with expressive voices. | No |
| Piper HTTP | Local TTS server that returns WAV. | No |
| OpenAI-compatible speech | Local or cloud endpoint following `/v1/audio/speech`. | No |
| Custom JSON HTTP | Local TTS apps with simple POST JSON APIs. | No |

## Fish S2-Pro

NightClaw uses the official HTTP API shape: `POST https://api.fish.audio/v1/tts`, `Authorization: Bearer <token>`, `Content-Type: application/json`, and `model: s2-pro`.

Fish S2-Pro is not bundled because its model/license are not MIT. Users must bring their own key, local server, or separately licensed deployment.

## Piper HTTP

Piper HTTP commonly accepts:

```json
{ "text": "Hello", "voice": "en_US-lessac-medium.onnx" }
```

and returns a WAV stream. NightClaw sends through the Rust backend to avoid browser CORS issues.

## Custom Providers

Custom JSON HTTP supports a body template with these placeholders:

- `{{text}}`
- `{{voiceId}}`
- `{{model}}`
- `{{format}}`
- `{{speed}}`
- `{{volume}}`

Example:

```json
{"prompt":"{{text}}","speaker":"{{voiceId}}","speed":{{speed}}}
```

## Current Limit

Voice playback is connected to character speech. Lip-sync and STT are the next milestones.
