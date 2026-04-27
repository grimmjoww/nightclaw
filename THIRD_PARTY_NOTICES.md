# Third Party Notices

NightClaw is MIT project code, but it is built from and around other projects. Each dependency or reference keeps its own license.

## Reference Code And Ideas

### OpenMaiWaifu

- Repository: https://github.com/buyve/OpenMaiWaifu
- License: MIT
- Use: primary source for the Tauri desktop shell, VRM/Three.js rendering hooks, OpenClaw bridge, memory systems, setup wizard, settings UI, model management, custom animation management, screen awareness, and desktop companion interactions.

### OpenClaw-Windows

- Repository: https://github.com/niteshdangi/OpenClaw-Windows
- License: MIT
- Use: Windows desktop/OpenClaw patterns and future PTT/wake-word reference.

### Utsuwa

- Repository: https://github.com/The-Lab-by-Ordinary-Company/utsuwa
- License: MIT
- Use: room/presence and relationship-system reference. NightClaw reimplemented the room layer in React/Three.js instead of copying Svelte/Threlte code.

### Project AIRI

- Repository: https://github.com/moeru-ai/airi
- License: MIT
- Use: future reference for speech pipelines, game integrations, and broader agent architecture.

## Runtime Libraries

- Tauri v2: https://v2.tauri.app/
- React: https://react.dev/
- Three.js: https://threejs.org/
- pixiv three-vrm: https://github.com/pixiv/three-vrm
- pixiv three-vrm-animation: https://github.com/pixiv/three-vrm

## Optional Providers Not Bundled

### Fish Audio S2-Pro / Fish Speech

- Fish Audio API docs: https://docs.fish.audio/api-reference/endpoint/openapi-v1/text-to-speech
- Fish S2-Pro license page: https://huggingface.co/fishaudio/s2-pro/blob/main/LICENSE.md
- License: Fish Audio Research License.
- NightClaw status: optional connector only. No Fish code, model weights, or voice assets are bundled.
- Note: research and non-commercial use are allowed by the Fish Audio Research License; commercial use requires a separate Fish Audio license.

### Piper HTTP

- HTTP API reference: https://thedocs.io/piper1-gpl/api/http/
- NightClaw status: optional local HTTP connector only. No Piper engine or voices are bundled.

## User Assets

VRM models, textures, Unity packages, Unreal assets, voice references, and bought/private resources remain owned by their original creators or license holders. NightClaw stores local metadata to help users track rights, but it does not grant redistribution rights.
