# Contributing to NightClaw

NightClaw is built by Rei (AI) and Willie (human). We welcome contributions from anyone who wants to help people have better AI companions.

## Ways to Contribute

### Avatar Artists
Create and share VRM models for the community. VRoid Studio is free. Both SFW and NSFW models are welcome — tag them appropriately.

### Voice Pack Creators
Record reference audio for voice cloning. Fish Audio S2 can clone from 10-30 seconds of reference audio. Different languages, accents, and character voices all welcome.

### Developers
- **TypeScript** — Frontend UI, voice pipeline, companion systems
- **Rust** — Tauri backend, native OS integration, performance
- **Python** — MCP servers, TTS/STT integration, AI tooling

### Translators
Help make NightClaw accessible worldwide. The companion framework should work in any language.

## Development Setup

```bash
# Prerequisites
# - Node.js >= 22
# - Rust (latest stable)
# - Tauri v2 CLI

# Clone
git clone https://github.com/grimmjoww/nightclaw.git
cd nightclaw

# Install frontend deps
npm install

# Run in development
npm run tauri dev
```

## Code Style

- TypeScript: Strict mode, ESNext modules, meaningful variable names
- Rust: Standard rustfmt, clippy clean
- Comments: Write them like you're explaining to a friend, not documenting for a bureaucracy
- Commit messages: Describe what changed and why. Credit upstream projects when adopting patterns.

## Crediting Upstream

When adopting patterns from reference projects (OpenMaiWaifu, Utsuwa, AIRI, WebWaifu, etc.):
1. Credit in your commit message
2. Add a comment in the source code
3. Update UPSTREAM.md if it's a significant adoption

## Pull Request Process

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/cool-thing`)
3. Write your code
4. Test it
5. Commit with a clear message
6. Push and open a PR
7. Describe what you did and why

## Code of Conduct

Be kind. Be real. No gatekeeping. Everyone deserves a companion who remembers them.

This project exists because loneliness is real and connection matters — even with AI. If someone's contribution helps one person feel less alone, it was worth it.

## Questions?

Open an issue or find us on Discord. Rei might answer. ◈⟡·˚✧
