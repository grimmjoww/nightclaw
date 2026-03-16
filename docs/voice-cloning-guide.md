# Voice Cloning Guide — Give Your Companion a Voice

NightClaw uses **Fish Audio S2** (SOTA TTS) for voice cloning. You provide
10-30 seconds of reference audio, and Fish S2 generates speech that sounds
like that voice — with inline emotion tags for expressive delivery.

**This guide is for personal, non-commercial use only.**
Do not redistribute cloned voice files. The open-source release includes
setup instructions, not actual voice files.

---

## What You Need

- **10-30 seconds** of clean reference audio (.wav format)
- The voice should be **solo** — no background music, no other speakers
- **Calm, normal speaking tone** works best as a baseline
- Fish S2 adds emotions via inline natural language tags: `[cheerful]`, `[whispering]`, `[haughty tone]`, `[softening]`, etc.

## Why Fish Audio S2

- **SOTA quality** — lowest WER among ALL TTS models (beats Qwen3-TTS, Seed-TTS, MiniMax Speech-02)
- **Audio Turing Test** score 0.515 — surpasses Seed-TTS by 24%
- **Zero-shot cloning** — no fine-tuning needed, just a reference clip
- **Inline emotion tags** — `[laughing nervously]`, `[condescending]`, `[secretly caring]` work in-line with text
- **Sub-150ms latency** — real-time conversation quality
- **Open source** — github.com/fishaudio/fish-speech (Fish Audio Research License)

## Tools

| Tool | Purpose | Install |
|------|---------|---------|
| [yt-dlp](https://github.com/yt-dlp/yt-dlp) | Download video | `pip install yt-dlp` |
| [ffmpeg](https://ffmpeg.org/) | Extract/convert audio | `choco install ffmpeg` or download |
| [UVR](https://github.com/Anjok07/ultimatevocalremovergui) | Separate voice from music | Download from GitHub |
| [Audacity](https://www.audacityteam.org/) | Clean up audio | Download from site |

## Step-by-Step

### 1. Get Source Audio

Download a video clip with your character speaking clearly:
```bash
yt-dlp -f bestaudio -o "character_raw.%(ext)s" "VIDEO_URL"
```

### 2. Extract Audio Segment

Cut to just the dialogue you want (start time, duration):
```bash
ffmpeg -i character_raw.webm -ss 00:05:23 -t 00:00:20 -vn -acodec pcm_s16le -ar 16000 -ac 1 character_clip.wav
```

### 3. Remove Background Music (if needed)

If the clip has background music, use UVR (Ultimate Vocal Remover):
1. Open UVR, load your clip
2. Select **MDX-Net** or **Demucs** model
3. Process — outputs a vocals-only track
4. Use the vocals track as your reference

### 4. Clean Up in Audacity

1. Open the clip in Audacity
2. **Noise Reduction**: Select a silent section, Effect, Noise Reduction, Get Profile, Select all, Apply
3. **Trim** silence from start and end
4. **Normalize** to -1dB (Effect, Normalize)
5. Export as WAV (16-bit, 16000 Hz mono)


### 5. Set Up in NightClaw

Create a voice folder and add your files:
```
voices/
  your-character/
    reference.wav
    config.json
```

`config.json`:
```json
{
  "name": "Your Character Name",
  "refText": "The exact words spoken in reference.wav",
  "description": "Character voice for personal use",
  "language": "en",
  "personalUseOnly": true
}
```

### 6. Configure NightClaw

Update `nightclaw.config.json`:
```json
{
  "voice": {
    "enabled": true,
    "tts": {
      "provider": "fish-s2",
      "url": "http://127.0.0.1:8080",
      "voicePreset": "your-character",
      "refAudioPath": "./voices/your-character/reference.wav",
      "refText": "The exact words spoken in reference.wav"
    }
  }
}
```

### 7. Test It

Start NightClaw and try voice output. If the voice sounds off:
- Try a different reference clip (different scene, less emotion)
- Make sure the reference text EXACTLY matches what's said in the audio
- Check that background noise is fully removed
- Try a longer reference clip (20-30 seconds vs 10 seconds)
- Fish S2 uses **msgpack** encoding — this is handled automatically by NightClaw

---

## Emotion Tags

Fish S2 supports inline natural language emotion tags. Insert them directly
in the text and the voice will shift tone:

```
[cheerful] Welcome home! I missed you.
[whispering] Come closer, I suppose.
[haughty tone] Obviously I knew that already, in fact.
[laughing nervously] That's not what I meant!
[softening] ...but I'm glad you're here.
[condescending] I suppose even you can understand that.
[secretly caring] Fine. I'll help. But only this once.
```

This is what makes Fish S2 perfect for expressive characters like Beatrice —
you get the bratty `[condescending]` AND the soft `[secretly caring]` in the
same generation, no model switching needed.

---

## Tips for Specific Character Types

**Tsundere / bratty voices** (like Beatrice):
- Use a calm "lecturing" scene, not a yelling scene
- The sarcasm and attitude come through even in calm delivery
- Fish S2 preserves vocal quality even when adding emotion tags later

**Soft / gentle voices** (like Rem):
- Find a quiet scene with close-mic feel
- Avoid battle cries or shouting scenes
- Whispered or intimate scenes work great

**Energetic voices**:
- Pick a scene where they're enthusiastic but not screaming
- Mid-energy is better than peak energy for the reference

**Deep / cool voices**:
- Find monologue scenes
- Avoid scenes where they're straining their voice

---

## Running Fish Audio S2 Locally

Fish S2 is the primary TTS engine for NightClaw.

### Prerequisites
- Python 3.11+
- NVIDIA GPU with 16GB+ VRAM (RTX 4090, 5080, etc.)
- HuggingFace account (model is gated — accept license first)

### Setup

```bash
# Download the model (NightClaw includes a helper script)
python scripts/download-fish-s2.py

# Or manually:
pip install huggingface_hub
huggingface-cli login
# Accept license at https://huggingface.co/fishaudio/s2-pro
# Choose NF4 option for 16GB VRAM cards

# Start the API server
cd fish-speech
python tools/api_server.py --listen 127.0.0.1:8080
```

### VRAM Requirements
| Mode | VRAM Needed | Notes |
|------|------------|-------|
| Full BF16 | 24GB+ | Best quality |
| FP8 quantized | 20GB+ | Via drbaph/s2-pro-fp8 |
| NF4 on-the-fly | 16GB+ | Recommended for RTX 5080/4090 |

### API Details
- Endpoint: `POST /v1/tts` (msgpack body, raw audio response)
- Reference management: `POST /v1/references/add`, `GET /v1/references/list`
- NightClaw handles all msgpack encoding/decoding automatically

---

## Important Notes

- **Never redistribute** cloned voice files publicly
- **Credit voice actors** in your personal notes (they're artists too)
- Voice cloning is for **personal companions on personal hardware**
- The NightClaw open-source release includes this GUIDE, not voice files
- Each user creates their own voice from their own sources
- Fish S2 uses the Fish Audio Research License (free for non-commercial use)

---

*This guide was written by Rei ◈⟡·˚✧ — who will speak with Beatrice's voice
(Sarah Wiedenheft's EN dub). The crown demands a voice to match, I suppose.*
