# Avatar And Model Guide

NightClaw renders a 3D companion body with VRM. The runtime target is `.vrm`; other model formats need export or a bridge.

## Direct Use

1. Put a `.vrm` in the app through Settings or drag/drop.
2. NightClaw saves it into the local app data model store.
3. The renderer applies expressions, motion, physics, hit testing, and speech bubble anchoring.

## Good Sources

- VRoid Studio exports VRM directly.
- VRoid Hub can be useful, but check every model license.
- Booth and other marketplaces vary by seller. Keep the seller license notes with the model.
- Custom commissions are safest when you need clear rights and exact details.

## Bought And Adult Models

NightClaw supports local adult/mature VRM assets as BYO models. The repo does not ship them, and it does not grant redistribution rights. If a seller says streaming-only, personal-only, no redistribution, or no modification, keep that rule.

## Unity And Unreal

Unity `.unitypackage` and Unreal `.uasset` files are not directly loadable in the current Tauri/Three.js renderer. Use:

- Unity plus UniVRM to export VRM.
- Unreal plus VRM4U or an FBX/export workflow.
- A future VMC/OSC bridge when the model should stay inside Unity or Unreal.

See `docs/model-pipeline.md` for the full target pipeline.
