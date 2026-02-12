#!/usr/bin/env python3
"""
Download and set up required AI models for the character server.

Models needed:
  1. InsightFace buffalo_l - Face detection & analysis
  2. inswapper_128.onnx - Face swapping model
  3. RVC base models (HuBERT, etc.) - Voice conversion

Run this script on the EC2 instance after initial setup.
"""

import os
import subprocess
import sys
import urllib.request


MODELS_DIR = "models"
FACES_DIR = os.path.join(MODELS_DIR, "faces")
VOICES_DIR = os.path.join(MODELS_DIR, "voices")


def ensure_dirs():
    """Create model directories."""
    for d in [MODELS_DIR, FACES_DIR, VOICES_DIR]:
        os.makedirs(d, exist_ok=True)
    print("✓ Directories created")


def download_file(url: str, dest: str, desc: str = ""):
    """Download a file with progress."""
    if os.path.exists(dest):
        print(f"  ✓ {desc or dest} already exists, skipping")
        return

    print(f"  ↓ Downloading {desc or url}...")
    try:
        urllib.request.urlretrieve(url, dest)
        print(f"  ✓ Saved to {dest}")
    except Exception as e:
        print(f"  ✗ Failed: {e}")


def setup_insightface():
    """Download InsightFace models."""
    print("\n=== InsightFace Models ===")

    # buffalo_l is auto-downloaded by insightface on first use
    # Just verify the package is installed
    try:
        import insightface
        print(f"  ✓ insightface {insightface.__version__} installed")
    except ImportError:
        print("  ✗ insightface not installed, installing...")
        subprocess.run([sys.executable, "-m", "pip", "install", "insightface"], check=True)

    # inswapper model - this needs manual download
    # Users must download from https://huggingface.co/deepinsight/inswapper/tree/main
    inswapper_path = os.path.join(MODELS_DIR, "inswapper_128.onnx")
    if not os.path.exists(inswapper_path):
        print(f"""
  ⚠ inswapper_128.onnx not found!

  Download manually from:
    https://huggingface.co/deepinsight/inswapper/resolve/main/inswapper_128.onnx

  Save to: {os.path.abspath(inswapper_path)}

  Or run:
    wget -O {inswapper_path} https://huggingface.co/deepinsight/inswapper/resolve/main/inswapper_128.onnx
""")
    else:
        print(f"  ✓ inswapper_128.onnx found")


def setup_reference_faces():
    """Guide for setting up character reference face images."""
    print("\n=== Character Reference Faces ===")
    print("  Place reference face images in models/faces/:")
    print()

    for char_id in ["uncle-peanut", "news-anchor", "anime-girl"]:
        path = os.path.join(FACES_DIR, f"{char_id}.jpg")
        if os.path.exists(path):
            print(f"  ✓ {char_id}.jpg found")
        else:
            print(f"  ✗ {char_id}.jpg missing")

    print("""
  Requirements for reference images:
    - Clear front-facing photo of the target face
    - Good lighting, no obstructions
    - JPEG format, at least 512x512px
    - One face per image

  For best results:
    - uncle-peanut.jpg  → Photo of a middle-aged HK uncle
    - news-anchor.jpg   → Photo of a professional female anchor
    - anime-girl.jpg    → Stylized anime-style face (real photo works better)
""")


def setup_rvc():
    """Guide for setting up RVC voice models."""
    print("\n=== RVC Voice Models ===")

    for char_id in ["uncle-peanut", "news-anchor", "anime-girl"]:
        path = os.path.join(VOICES_DIR, f"{char_id}.pth")
        if os.path.exists(path):
            print(f"  ✓ {char_id}.pth found")
        else:
            print(f"  ✗ {char_id}.pth missing")

    print("""
  To train RVC voice models:
    1. Collect 10-30 min of clean audio from target voice
    2. Use RVC WebUI to train:
       git clone https://github.com/RVC-Project/Retrieval-based-Voice-Conversion-WebUI
       cd Retrieval-based-Voice-Conversion-WebUI
       pip install -r requirements.txt
       python infer-web.py
    3. Export .pth model files
    4. Place in models/voices/<character-id>.pth

  Pre-trained models (community):
    - Search https://voice-models.com for character voices
    - Download .pth files directly
""")


def verify_gpu():
    """Check GPU availability."""
    print("\n=== GPU Status ===")
    try:
        import torch
        if torch.cuda.is_available():
            gpu_name = torch.cuda.get_device_name(0)
            gpu_mem = torch.cuda.get_device_properties(0).total_mem / 1e9
            print(f"  ✓ GPU: {gpu_name} ({gpu_mem:.1f} GB)")
        else:
            print("  ⚠ No CUDA GPU detected - will run on CPU (much slower)")
    except ImportError:
        print("  ✗ PyTorch not installed")

    try:
        import onnxruntime as ort
        providers = ort.get_available_providers()
        print(f"  ✓ ONNX Runtime providers: {providers}")
    except ImportError:
        print("  ✗ onnxruntime not installed")


def main():
    print("=" * 60)
    print("  AI Character Server - Model Setup")
    print("=" * 60)

    ensure_dirs()
    verify_gpu()
    setup_insightface()
    setup_reference_faces()
    setup_rvc()

    print("\n" + "=" * 60)
    print("  Setup complete! Review any ✗ items above.")
    print("  Start server with: python server.py")
    print("=" * 60)


if __name__ == "__main__":
    main()
