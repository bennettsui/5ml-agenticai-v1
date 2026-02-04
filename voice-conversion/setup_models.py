#!/usr/bin/env python3
"""
Voice Model Setup Script
Downloads and sets up pre-trained voice models for RVC and so-vits-svc
"""

import os
import sys
import json
import shutil
import argparse
import urllib.request
from pathlib import Path

MODELS_DIR = Path(__file__).parent / "models"

# Example pre-trained model sources (users should replace with their own)
EXAMPLE_MODELS = {
    "rvc": {
        "hubert-base": {
            "description": "HuBERT base model (required for RVC)",
            "url": "https://huggingface.co/lj1995/VoiceConversionWebUI/resolve/main/hubert_base.pt",
            "filename": "hubert_base.pt",
            "required": True
        }
    },
    "sovits": {
        # so-vits-svc models are typically trained by users
    }
}


def download_file(url: str, dest: Path, desc: str = "Downloading"):
    """Download a file with progress"""
    print(f"{desc}: {url}")
    print(f"  -> {dest}")

    try:
        urllib.request.urlretrieve(url, dest)
        print("  Done!")
        return True
    except Exception as e:
        print(f"  Error: {e}")
        return False


def setup_rvc_models():
    """Set up RVC models directory and download base models"""
    rvc_dir = MODELS_DIR / "rvc"
    rvc_dir.mkdir(parents=True, exist_ok=True)

    print("\n=== Setting up RVC ===")
    print(f"Models directory: {rvc_dir}")

    # Download required base models
    for model_name, model_info in EXAMPLE_MODELS["rvc"].items():
        if model_info.get("required"):
            dest = rvc_dir / model_info["filename"]
            if not dest.exists():
                print(f"\nDownloading {model_name}...")
                download_file(model_info["url"], dest, model_info["description"])
            else:
                print(f"\n{model_name} already exists")

    print("\n--- RVC Setup Instructions ---")
    print("To add your own voice models:")
    print("1. Train a model using RVC WebUI or download a pre-trained model")
    print("2. Create a folder: voice-conversion/models/rvc/<model_name>/")
    print("3. Place files:")
    print("   - <model_name>.pth (the model weights)")
    print("   - <model_name>.index (optional, improves quality)")
    print("\nExample:")
    print("  models/rvc/old_peanut_uncle/")
    print("    ├── old_peanut_uncle.pth")
    print("    └── old_peanut_uncle.index")


def setup_sovits_models():
    """Set up so-vits-svc models directory"""
    sovits_dir = MODELS_DIR / "sovits"
    sovits_dir.mkdir(parents=True, exist_ok=True)

    print("\n=== Setting up so-vits-svc ===")
    print(f"Models directory: {sovits_dir}")

    print("\n--- so-vits-svc Setup Instructions ---")
    print("so-vits-svc models are typically trained from scratch.")
    print("\nTo add a trained model:")
    print("1. Train using so-vits-svc-fork or original so-vits-svc")
    print("2. Create a folder: voice-conversion/models/sovits/<model_name>/")
    print("3. Place files:")
    print("   - G_<steps>.pth (generator model)")
    print("   - config.json (model config)")
    print("\nExample:")
    print("  models/sovits/old_peanut_uncle/")
    print("    ├── G_40000.pth")
    print("    └── config.json")


def create_sample_config():
    """Create a sample configuration file"""
    config = {
        "default_converter": "rvc",
        "default_model": "default",
        "rvc_settings": {
            "pitch_shift": 0,
            "index_rate": 0.75,
            "filter_radius": 3,
            "rms_mix_rate": 0.25,
            "protect": 0.33
        },
        "sovits_settings": {
            "pitch_shift": 0,
            "speaker_id": 0,
            "cluster_ratio": 0.0,
            "noise_scale": 0.4
        }
    }

    config_path = MODELS_DIR / "config.json"
    with open(config_path, "w") as f:
        json.dump(config, f, indent=2)

    print(f"\nCreated sample config: {config_path}")


def main():
    parser = argparse.ArgumentParser(description="Setup voice conversion models")
    parser.add_argument("--rvc-only", action="store_true", help="Only setup RVC")
    parser.add_argument("--sovits-only", action="store_true", help="Only setup so-vits-svc")
    parser.add_argument("--skip-download", action="store_true", help="Skip downloading base models")

    args = parser.parse_args()

    print("=" * 50)
    print("Voice Conversion Model Setup")
    print("=" * 50)

    MODELS_DIR.mkdir(parents=True, exist_ok=True)

    if not args.sovits_only:
        setup_rvc_models()

    if not args.rvc_only:
        setup_sovits_models()

    create_sample_config()

    print("\n" + "=" * 50)
    print("Setup complete!")
    print("=" * 50)
    print("\nNext steps:")
    print("1. Add your voice models to the models/ directory")
    print("2. Start the server: python server.py")
    print("3. Or use Docker: docker-compose up")
    print("\nAPI will be available at: http://localhost:8765")
    print("WebSocket for real-time: ws://localhost:8765/ws/convert")


if __name__ == "__main__":
    main()
