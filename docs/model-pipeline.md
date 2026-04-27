# Model Pipeline

NightClaw is bring-your-own-model by default. The app ships a small default VRM so the renderer can start, but users should provide their own companion body.

## Direct Path

`.vrm` is the only direct runtime model target today. NightClaw loads VRM through Three.js and `@pixiv/three-vrm`, then applies expressions, motion, drag physics, hit testing, and speech-bubble anchoring.

## Prep Paths

| Source | Current Path |
| --- | --- |
| `.vrm` | Load directly. |
| `.glb` / `.gltf` | Convert/export to VRM after confirming humanoid rig, expressions, spring bones, and materials. |
| `.fbx` | Import into Blender or Unity, fix rig/materials, export through UniVRM. |
| `.unitypackage` | Import into Unity, use UniVRM export, or future Unity bridge. |
| `.uasset` | Export through Unreal-supported paths such as FBX plus VRM conversion or VRM4U, or future Unreal bridge. |

## Texture Notes

Seller packages vary wildly. NightClaw should not rewrite a bought model's textures in place. Keep source assets untouched, export a working local copy, and record seller notes in the model manifest.

## Adult Models

Adult or mature models are supported as local BYO assets when the user has rights to use them. They are not bundled or redistributed by NightClaw.

## Engine Bridge Target

The future bridge target is:

- VMC/OSC for avatar pose/expression streaming.
- Unity bridge for UniVRM scenes.
- Unreal bridge for VRM4U or engine-native scenes.
- NightClaw remains the agent, memory, voice, and desktop control shell.
