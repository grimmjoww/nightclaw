# /voices — Voice Presets

Place your voice cloning reference files here. Each voice gets its own folder:

```
voices/
  rem/
    reference.wav       # 5-30 seconds of clean solo speech
    config.json         # { "refText": "transcript of the wav" }
  beatrice/
    reference.wav
    config.json
  custom/
    reference.wav
    config.json
```

See [docs/voice-cloning-guide.md](../docs/voice-cloning-guide.md) for
how to extract and prepare reference audio.

**Voice files are NOT included in this repo.** Each user creates their own
from their own sources for personal use.
