# Upstream References

NightClaw uses working reference code where the license and compatibility allow it. Substantial reuse is credited here and in `THIRD_PARTY_NOTICES.md`.

## Used In This Rebuild

| Project | License | Current Use |
| --- | --- | --- |
| OpenMaiWaifu | MIT | Primary desktop companion core: Tauri backend, React app, VRM renderer, motion/emotion hooks, screen awareness, memory systems, setup/settings, tray, and OpenClaw bridge. |
| OpenClaw-Windows | MIT | Windows/OpenClaw desktop patterns and future PTT/wake-word reference. |
| Utsuwa | MIT | Room-mode concept, relationship/space inspiration, and 3D companion presence ideas. Direct Svelte/Threlte code was not copied into React. |
| Project AIRI | MIT | Future reference for speech, game adapters, and multi-platform companion systems. |

## Not Copied

| Project | Reason |
| --- | --- |
| Fish Speech / Fish Audio S2-Pro | Fish Audio Research License, not MIT. NightClaw provides an optional connector only. |
| WebWaifu local clone | No clear local license at review time, so it is idea-only unless license is confirmed. |
| Private/bought VRM models | Mixed seller licenses. NightClaw is BYO model by design. |

## Policy

- Use reference code exactly when it already works and the license allows it.
- Change copied reference code only when NightClaw compatibility requires it.
- Do not bundle restricted models, voices, or seller assets.
- Keep future Unity/Unreal support as export/bridge workflows unless a direct, licensed runtime path exists.
