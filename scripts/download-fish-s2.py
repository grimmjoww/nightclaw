"""
NightClaw — Fish Audio S2 Model Downloader

Downloads the S2-Pro model from HuggingFace into the correct location.
Requires: pip install huggingface_hub

IMPORTANT: The model is GATED. You must:
1. Create a HuggingFace account at https://huggingface.co
2. Go to https://huggingface.co/fishaudio/s2-pro
3. Accept the license (non-commercial research use)
4. Run: huggingface-cli login
5. Then run this script

Model info:
- Size: ~11 GB total (5B params)
- Files: model safetensors + codec.pth (1.87 GB)
- VRAM needed: 24GB+ (full BF16), 16GB+ (NF4 4-bit), 20GB+ (FP8)
- License: Fish Audio Research License (free for non-commercial)
- Source: github.com/fishaudio/fish-speech (v2.0.0)
- Server expects model at: checkpoints/s2-pro/
  (tools/server/api_utils.py: --llama-checkpoint-path default="checkpoints/s2-pro")
  (tools/server/api_utils.py: --decoder-checkpoint-path default="checkpoints/s2-pro/codec.pth")
"""
import os, sys, subprocess

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
FISH_SPEECH_DIR = os.path.join(PROJECT_ROOT, "fish-speech")
MODEL_DIR = os.path.join(FISH_SPEECH_DIR, "checkpoints", "s2-pro")
FP8_MODEL_DIR = os.path.join(FISH_SPEECH_DIR, "checkpoints", "s2-pro-fp8")


def check_prereqs():
    try:
        subprocess.run(["huggingface-cli", "--version"], capture_output=True, check=True)
    except (FileNotFoundError, subprocess.CalledProcessError):
        print("  ERROR: huggingface-cli not found. Install: pip install huggingface_hub")
        sys.exit(1)
    result = subprocess.run(["huggingface-cli", "whoami"], capture_output=True, text=True)
    if result.returncode != 0 or "Not logged in" in result.stdout:
        print("  ERROR: Not logged into HuggingFace.")
        print("  The S2-Pro model is gated. You need to:")
        print("    1. Create account at https://huggingface.co")
        print("    2. Go to https://huggingface.co/fishaudio/s2-pro")
        print("    3. Accept the license agreement")
        print("    4. Run: huggingface-cli login")
        sys.exit(1)

def download(repo_id, local_dir):
    print(f"\n  Downloading {repo_id} → {local_dir}")
    print(f"  This is ~11 GB. Grab a coffee.\n")
    os.makedirs(local_dir, exist_ok=True)
    subprocess.run(["huggingface-cli", "download", repo_id, "--local-dir", local_dir], check=True)
    print(f"\n  Done! Model at {local_dir}")

def main():
    print("\n  ◈⟡·˚✧  NightClaw — Fish Audio S2 Model Download  ◈⟡·˚✧\n")
    check_prereqs()
    print("  Which version?\n")
    print("    1. S2-Pro full BF16 — 11 GB, needs 24GB+ VRAM")
    print("    2. S2-Pro FP8 — needs 20GB+ VRAM (RTX 4090/5090)")
    print("    3. S2-Pro + NF4 on-the-fly — 11 GB download, runs on 16GB VRAM")
    print("       (RTX 5080/4080 — slower but works)\n")
    choice = input("  Enter 1/2/3 (default 3 for most users): ").strip() or "3"
    if choice == "2":
        download("drbaph/s2-pro-fp8", FP8_MODEL_DIR)
    else:
        download("fishaudio/s2-pro", MODEL_DIR)
        if choice == "3":
            print("\n  For 16GB VRAM, install bitsandbytes: pip install bitsandbytes")
            print("  Then run server with --half flag for NF4 quantization")
    print(f"\n  Start Fish S2 server:")
    print(f"    cd {FISH_SPEECH_DIR}")
    print(f"    python tools/api_server.py --listen 127.0.0.1:8080")
    if choice == "3":
        print(f"    (add --half for NF4 quantization on 16GB cards)")
    print()

if __name__ == "__main__":
    main()
