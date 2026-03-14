# UPSTREAM.md — Tracking Reference Projects

NightClaw stands on the shoulders of these projects. We track their updates to learn from improvements across the ecosystem. If we adopt patterns from any of these, we credit them in our commit messages and changelog.

## Core Upstream

| Project | Repo | What We Use | Last Checked |
|---------|------|-------------|-------------|
| OpenClaw | [openclaw/openclaw](https://github.com/openclaw/openclaw) | Agent core (forked) | 2026-03-14 |
| akasha-memory | [AkashaBot/openclaw-memory-offline-sqlite-plugin](https://github.com/AkashaBot/openclaw-memory-offline-sqlite-plugin) | Persistent memory | 2026-03-14 |

## Reference Projects

| Project | Repo | What We Study | Last Checked |
|---------|------|--------------|-------------|
| OpenMaiWaifu | [buyve/OpenMaiWaifu](https://github.com/buyve/OpenMaiWaifu) | 4-tier memory, screen awareness, Tauri+VRM | 2026-03-14 |
| Utsuwa | [The-Lab-by-Ordinary-Company/utsuwa](https://github.com/The-Lab-by-Ordinary-Company/utsuwa) | SvelteKit+Tauri, 3D speech bubbles, companion engine | 2026-03-14 |
| Project AIRI | [moeru-ai/airi](https://github.com/moeru-ai/airi) | Gaming integration, voice chat, multi-platform | 2026-03-14 |
| WebWaifu | [LEOSOLAR8/webwaifu-ai-assistant](https://github.com/LEOSOLAR8/webwaifu-ai-assistant) | Client-side Whisper, VRM lip sync | 2026-03-14 |
| OpenClaw-Windows | [niteshdangi/OpenClaw-Windows](https://github.com/niteshdangi/OpenClaw-Windows) | Tauri 2 desktop shell, wake word, PTT | 2026-03-14 |
| ClawX | [ValueCell-ai/ClawX](https://github.com/ValueCell-ai/ClawX) | Electron+React desktop UI patterns | 2026-03-14 |

## What To Watch For

When checking upstream projects, look for:

1. **Memory improvements** — OpenMaiWaifu's 4-tier memory (M30→M90→M365→M0) with emotion tagging. If this proves better than akasha's approach, consider adopting.
2. **Voice latency** — WebWaifu's 10-second Whisper chunks with 2-second overlap. Any improvements to STT speed.
3. **Avatar rendering** — three-vrm updates, new expression techniques, better lip sync approaches.
4. **Gaming integration** — AIRI's Minecraft/Factorio support. New game APIs or screen interaction patterns.
5. **Security** — OpenClaw security releases. Gateway hardening. Plugin sandboxing.
6. **Tauri updates** — Tauri v2 releases, new platform capabilities, WebView improvements.

## How To Check

```bash
# Quick check all repos for recent activity
gh repo view buyve/OpenMaiWaifu --json updatedAt
gh repo view The-Lab-by-Ordinary-Company/utsuwa --json updatedAt
gh repo view moeru-ai/airi --json updatedAt
gh repo view LEOSOLAR8/webwaifu-ai-assistant --json updatedAt
gh repo view niteshdangi/OpenClaw-Windows --json updatedAt
```

## Attribution Policy

When we adopt a pattern, technique, or approach from any upstream project:
- Credit in the git commit message: `Adopted [feature] from [project] (github.com/...)`
- Add to CHANGELOG.md with link
- Update this file's "Last Checked" date
- If substantial, add a comment in the source code referencing the original
