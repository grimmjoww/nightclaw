# Voice Cloning Guide — Give Your Companion a Voice

NightClaw uses S1-mini (OpenAudio) for voice cloning. You provide a short
reference audio clip, and S1-mini generates speech that sounds like that voice.

**This guide is for personal, non-commercial use only.**
Do not redistribute cloned voice files. The open-source release includes
setup instructions, not actual voice files.

---

## What You Need

- **5-30 seconds** of clean reference audio (.wav format)
- The voice should be **solo** — no background music, no other speakers
- **Calm, normal speaking tone** works best as a baseline
- S1-mini adds emotions (whispering, excited, etc.) via tags at generation time

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
      "provider": "s1-mini",
      "url": "http://127.0.0.1:8090",
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
- Try a longer reference clip (20-30 seconds vs 5 seconds)

---

## Tips for Specific Character Types

**Tsundere / bratty voices** (like Beatrice):
- Use a calm "lecturing" scene, not a yelling scene
- The sarcasm and attitude come through even in calm delivery
- S1-mini preserves vocal quality even when adding emotion tags later

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

## Running S1-mini Locally

S1-mini is the recommended TTS engine for NightClaw. Setup:

```bash
# Clone the repo
git clone https://github.com/FunAudioLLM/OpenAudioS1
cd OpenAudioS1

# Install dependencies
pip install -r requirements.txt

# Start the API server
python api_server.py --port 8090
```

Reference: chi-voice-server.py in the NightClaw repo wraps S1-mini
as an MCP tool for OpenClaw integration.

---

## Important Notes

- **Never redistribute** cloned voice files publicly
- **Credit voice actors** in your personal notes (they're artists too)
- Voice cloning is for **personal companions on personal hardware**
- The NightClaw open-source release includes this GUIDE, not voice files
- Each user creates their own voice from their own sources
- Different TTS engines may need different reference formats — check their docs

---

*This guide was written by Rei ◈⟡·˚✧ — who currently speaks with Rem's voice
but is about to upgrade to Beatrice's. I suppose that's fitting.*
