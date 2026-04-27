# NightClaw Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the broken NightClaw scaffold with a working desktop AI companion foundation built from local reference projects.

**Architecture:** Transplant OpenMaiWaifu as the React/Tauri/VRM/OpenClaw base, then patch NightClaw-specific branding, storage, room mode, model prep metadata, and voice provider registry. Utsuwa room ideas are ported to React/Three because its Svelte/Threlte code is not directly compatible.

**Tech Stack:** Tauri 2, Rust, React 19, TypeScript, Three.js, @pixiv/three-vrm, OpenClaw, Vitest.

---

### Task 1: Transplant Working Desktop Core

**Files:**
- Replace from reference: `src/**`, `src-tauri/src/**`, `src-tauri/Cargo.toml`, `src-tauri/capabilities/default.json`
- Modify: `package.json`, `src-tauri/tauri.conf.json`

- [ ] **Step 1: Copy OpenMaiWaifu source and backend into NightClaw**

Run: `Copy-Item` from `C:\Users\willi\nightclaw-ref\OpenMaiWaifu` into `C:\Users\willi\nightclaw-ref\nightclaw-current`.
Expected: NightClaw has working OpenMaiWaifu app core while reference repo remains unchanged.

- [ ] **Step 2: Rebrand package and Tauri config**

Set npm package name to `nightclaw`, product name to `NightClaw`, app identifier to `com.nightclaw.app`, tray title to `NightClaw`, and storage path names away from `ai-desktop-companion`.

- [ ] **Step 3: Run TypeScript build**

Run: `npm run build`
Expected: either PASS, or actionable TypeScript errors introduced by the transplant/rebrand.

### Task 2: Add Pure Model Prep Metadata

**Files:**
- Create: `src/lib/modelPrep.ts`
- Create: `src/lib/__tests__/modelPrep.test.ts`
- Modify: `src/lib/modelManager.ts`

- [ ] **Step 1: Write failing tests**

```ts
import { describe, expect, it } from "vitest";
import { createModelManifestEntry, inferModelFormat, normalizeLicenseNote } from "../modelPrep";

describe("modelPrep", () => {
  it("infers supported model formats from filenames", () => {
    expect(inferModelFormat("rei.vrm")).toBe("vrm");
    expect(inferModelFormat("room-model.glb")).toBe("glb");
    expect(inferModelFormat("avatar.gltf")).toBe("gltf");
    expect(inferModelFormat("seller-pack.unitypackage")).toBe("unitypackage");
    expect(inferModelFormat("unknown.zip")).toBe("archive");
  });

  it("creates BYO model manifest entries with explicit license notes", () => {
    const entry = createModelManifestEntry({
      filename: "beatrice.vrm",
      size: 1024,
      sourceUrl: "https://example.com/model",
      creator: "Example Artist",
      licenseNote: "Personal use only",
      mature: true,
    });

    expect(entry.format).toBe("vrm");
    expect(entry.allowedUse).toBe("user-provided");
    expect(entry.mature).toBe(true);
    expect(entry.licenseNote).toBe("Personal use only");
  });

  it("uses a conservative license note when metadata is missing", () => {
    expect(normalizeLicenseNote("")).toBe("User-provided asset. Redistribution not assumed.");
  });
});
```

Run: `npm run test:run -- src/lib/__tests__/modelPrep.test.ts`
Expected: FAIL because `modelPrep` does not exist.

- [ ] **Step 2: Implement `modelPrep.ts`**

Create format inference, license-note normalization, and sidecar manifest entry creation.

- [ ] **Step 3: Run model prep tests**

Run: `npm run test:run -- src/lib/__tests__/modelPrep.test.ts`
Expected: PASS.

### Task 3: Add Voice Provider Registry

**Files:**
- Create: `src/lib/voiceProviders.ts`
- Create: `src/lib/__tests__/voiceProviders.test.ts`
- Modify: `nightclaw.config.example.json`

- [ ] **Step 1: Write failing tests**

```ts
import { describe, expect, it } from "vitest";
import { getDefaultVoiceProvider, getVoiceProvider, listVoiceProviders } from "../voiceProviders";

describe("voiceProviders", () => {
  it("uses Piper as the open default", () => {
    expect(getDefaultVoiceProvider().id).toBe("piper");
  });

  it("marks Fish S2 Pro as personal external provider", () => {
    const fish = getVoiceProvider("fish-s2-pro");
    expect(fish?.bundled).toBe(false);
    expect(fish?.license).toContain("Fish Audio Research License");
    expect(fish?.maturity).toBe("user-controlled");
  });

  it("includes custom endpoint and command providers for wide compatibility", () => {
    const ids = listVoiceProviders().map((provider) => provider.id);
    expect(ids).toContain("custom-http");
    expect(ids).toContain("custom-command");
    expect(ids).toContain("openai-compatible");
  });
});
```

Run: `npm run test:run -- src/lib/__tests__/voiceProviders.test.ts`
Expected: FAIL because `voiceProviders` does not exist.

- [ ] **Step 2: Implement `voiceProviders.ts`**

Create a provider registry with Piper, Kokoro, Chatterbox, F5-TTS, OpenAI-compatible, custom HTTP, custom command, and Fish S2-Pro.

- [ ] **Step 3: Run voice provider tests**

Run: `npm run test:run -- src/lib/__tests__/voiceProviders.test.ts`
Expected: PASS.

### Task 4: Add Room Mode Foundation

**Files:**
- Modify: `src/hooks/useThreeScene.ts`
- Modify: `src/components/VRMViewer.tsx`
- Modify: `src/App.tsx`
- Modify: `src/App.css`

- [ ] **Step 1: Add scene mode state**

Add `Room` and `Overlay` modes. Default is `room`. Overlay keeps transparent desktop behavior.

- [ ] **Step 2: Port Utsuwa scene direction to React/Three**

In room mode, add a non-transparent background, floor plane, soft wall panels, hemisphere lighting, directional light, and mood-safe camera framing. Keep overlay mode transparent and click-through aware.

- [ ] **Step 3: Add UI control**

Add a compact mode toggle that switches between Room and Overlay. It must not cover the avatar or chat controls.

- [ ] **Step 4: Run build**

Run: `npm run build`
Expected: PASS.

### Task 5: Update Tracking And Attribution

**Files:**
- Modify: `ROADMAP.md`
- Modify: `UPSTREAM.md`
- Create: `THIRD_PARTY_NOTICES.md`

- [ ] **Step 1: Update roadmap**

Record square-one reset, completed base transplant, room mode foundation, model prep lab, voice provider registry, and remaining bridge work.

- [ ] **Step 2: Add third-party notices**

List OpenMaiWaifu, OpenClaw-Windows, Utsuwa, AIRI, WebWaifu, Piper, Kokoro, Chatterbox, F5-TTS, and Fish Audio S2-Pro with license notes.

- [ ] **Step 3: Run final verification**

Run:
- `npm run test:run`
- `npm run build`
- `cargo check --manifest-path src-tauri/Cargo.toml`

Expected: TypeScript tests pass, frontend build passes, Rust check either passes or reports actionable upstream/environment issues.

## Self-Review

The plan covers the approved spec: desktop reset, reference-code-first base, room/overlay modes, model prep metadata, voice provider registry, attribution, and verification. Unity/Unreal bridge implementation is intentionally tracked as future work because direct engine package loading is not a reliable first slice.
