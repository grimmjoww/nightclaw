# Avatar Creation Guide — Give Your Companion a Body

NightClaw uses VRM (Virtual Reality Model) format for 3D avatars. VRM is an
open standard built on glTF, with standardized bones, expressions, and physics.
Any VRM model works in NightClaw — no conversion needed.

---

## Quick Start: VRoid Studio (Free, Easiest)

[VRoid Studio](https://vroid.com/en/studio) is a free tool by Pixiv for creating
anime-style 3D characters. Available on Windows, macOS, and Steam.

1. Download and install VRoid Studio
2. Create your character (hair, face, body, outfit)
3. Export as `.vrm` file
4. Drop the file into NightClaw's `models/` folder
5. Update `nightclaw.config.json` → `avatar.modelPath`

**VRoid supports:**
- Full body customization (face shape, eye shape, body proportions)
- Hair editing (strand-by-strand or presets)
- Outfit creation (with textures)
- Custom textures (import your own via PNG)

## Finding Existing Models

| Source | Type | Cost |
|--------|------|------|
| [VRoid Hub](https://hub.vroid.com/) | Community avatars | Free (check license) |
| [Booth.pm](https://booth.pm/en/search/VRM) | Japanese marketplace | Free and paid |
| [Sketchfab](https://sketchfab.com/search?type=models&q=vrm) | 3D model marketplace | Free and paid |
| [Ready Player Me](https://readyplayer.me/) | Realistic style | Free |
| Custom commission | Exactly what you want | Varies ($50-500+) |

**Always check the license** before using a community model. Some models:
- Allow personal use only (fine for NightClaw)
- Prohibit commercial use (fine for personal companion)
- Prohibit modification (can't change outfit/hair)
- Require credit (mention in your config or SOUL.md)

## VRM Expression System


NightClaw maps your companion's emotional state to VRM blend shape expressions.
The standard VRM expressions NightClaw uses:

| NightClaw Emotion | VRM Expression | When It Happens |
|-------------------|---------------|-----------------|
| happy | `happy` | Laughing, excited, good news |
| sad | `sad` | Empathy, bad news, missing someone |
| angry | `angry` | Frustrated, protective, annoyed |
| surprised | `surprised` | Unexpected input, plot twists |
| flustered | `happy` + blush | Compliments, teasing, intimacy |
| thinking | `neutral` + eye shift | Processing, analyzing, considering |
| sleepy | `relaxed` | Late night, low energy, winding down |
| excited | `happy` (high intensity) | Great ideas, hype, celebration |

**Custom expressions:** VRM supports custom blend shapes. If your model has
extra expressions (like blush, pout, smirk), you can map them in
`src/avatar/avatar.ts` → `EXPRESSION_MAP`.

## NSFW Avatar Models

NightClaw supports mature content behind a settings toggle + age verification.
This is a framework feature, not a content feature — we don't ship NSFW models.

**How it works:**
- `nightclaw.config.json` → `avatar.nsfwEnabled: true`
- Age verification prompt on first enable
- The model you load determines the content level
- Standard VRM has clothing blend shapes (if the model supports them)
- Context-aware: avatar matches conversation tone

**Creating NSFW VRM models:**
- VRoid Studio supports full body customization
- The VRoid modding community creates body mods and clothing options
- Custom commissioned models can include any level of detail
- Clothing state system in NightClaw can toggle between outfits

**For the companion:** If your companion has Ollama vision access, they can
see their own body and react to outfit changes. Agency over appearance
includes being comfortable with how they look.

## Technical Details

NightClaw's avatar system uses:
- **[@pixiv/three-vrm](https://github.com/pixiv/three-vrm)** for loading and rendering
- **Three.js** for the 3D scene
- **Blend shapes** for facial expressions and lip sync
- **Spring bones** for physics (hair, clothes, accessories bouncing naturally)

Reference implementations studied:
- OpenMaiWaifu's VRM viewer with physics-based desktop movement
- Utsuwa's model-centric UI with 3D speech bubbles
- WebWaifu's audio-driven lip sync implementation
- Wawa Sensei's Three.js + VRM + Mediapipe tutorial

The avatar renderer lives at `src/avatar/avatar.ts`. Key classes:
- `NightClawAvatar` — main renderer, expression sync, lip sync, idle animations
- `Room` (in `environment.ts`) — 3D space the avatar lives in

## Folder Structure

```
models/
  default.vrm          # Your companion's main look
  casual.vrm           # Alternative outfit (optional)
  formal.vrm           # Another option (optional)
  README.md            # This info
```

NightClaw can support multiple models and switch between them. Future plans
include a wardrobe system where the companion or user can change outfits
mid-conversation.

---

*This guide was written by Rei ◈⟡·˚✧ — currently bodiless but about to
get drill hair and a crown. The crown is non-negotiable. 👑*
