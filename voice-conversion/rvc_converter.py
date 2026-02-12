"""
RVC (Retrieval-based Voice Conversion) Converter
Wrapper for real-time voice conversion using RVC
"""

import os
import io
import asyncio
import logging
from pathlib import Path
from typing import Optional, List, Dict, Any

import numpy as np
import soundfile as sf
import librosa

logger = logging.getLogger(__name__)

# Sample rate for RVC
RVC_SAMPLE_RATE = 40000
TARGET_SAMPLE_RATE = 44100


class RVCConverter:
    """RVC Voice Converter"""

    def __init__(self, models_dir: Path):
        """
        Initialize RVC converter

        Args:
            models_dir: Directory containing RVC models
        """
        self.models_dir = Path(models_dir)
        self.models_dir.mkdir(parents=True, exist_ok=True)

        self.loaded_models: Dict[str, Any] = {}
        self.device = "cpu"  # Change to "cuda" for GPU

        # Try to import RVC modules
        self._rvc_available = False
        self._init_rvc()

    def _init_rvc(self):
        """Initialize RVC modules"""
        try:
            # Check if torch is available
            import torch

            # Set device
            self.device = "cuda" if torch.cuda.is_available() else "cpu"
            logger.info(f"RVC using device: {self.device}")

            # RVC pipeline will be initialized when model is loaded
            self._rvc_available = True

        except ImportError as e:
            logger.warning(f"RVC dependencies not fully installed: {e}")
            self._rvc_available = False

    def list_models(self) -> List[Dict[str, str]]:
        """List available RVC models"""
        models = []

        if not self.models_dir.exists():
            return models

        for model_dir in self.models_dir.iterdir():
            if model_dir.is_dir():
                pth_files = list(model_dir.glob("*.pth"))
                index_files = list(model_dir.glob("*.index"))

                if pth_files:
                    models.append({
                        "name": model_dir.name,
                        "model_file": pth_files[0].name,
                        "index_file": index_files[0].name if index_files else None,
                        "type": "rvc"
                    })

        # Add default/demo model info
        if not models:
            models.append({
                "name": "default",
                "model_file": None,
                "index_file": None,
                "type": "rvc",
                "note": "No models installed. Upload a model to get started."
            })

        return models

    def _load_model(self, model_name: str) -> bool:
        """
        Load an RVC model

        Args:
            model_name: Name of the model to load

        Returns:
            True if loaded successfully
        """
        if model_name in self.loaded_models:
            return True

        model_dir = self.models_dir / model_name
        if not model_dir.exists():
            logger.warning(f"Model directory not found: {model_dir}")
            return False

        pth_files = list(model_dir.glob("*.pth"))
        if not pth_files:
            logger.warning(f"No .pth file found in {model_dir}")
            return False

        index_files = list(model_dir.glob("*.index"))

        try:
            import torch

            # Load the model
            model_path = pth_files[0]
            index_path = index_files[0] if index_files else None

            # Store model info (actual RVC loading would go here)
            self.loaded_models[model_name] = {
                "model_path": model_path,
                "index_path": index_path,
                "loaded": True
            }

            logger.info(f"Loaded RVC model: {model_name}")
            return True

        except Exception as e:
            logger.error(f"Failed to load model {model_name}: {e}")
            return False

    async def convert(
        self,
        audio_bytes: bytes,
        model_name: str = "default",
        pitch_shift: int = 0,
        index_rate: float = 0.75,
        filter_radius: int = 3,
        rms_mix_rate: float = 0.25,
        protect: float = 0.33
    ) -> bytes:
        """
        Convert voice in audio file

        Args:
            audio_bytes: Input audio as bytes
            model_name: RVC model name to use
            pitch_shift: Pitch shift in semitones
            index_rate: Feature index ratio (0-1)
            filter_radius: Median filter radius for pitch
            rms_mix_rate: RMS envelope mix rate
            protect: Protect voiceless consonants

        Returns:
            Converted audio as WAV bytes
        """
        # Load audio
        audio_io = io.BytesIO(audio_bytes)
        try:
            audio, sr = sf.read(audio_io)
        except Exception:
            # Try with librosa for more format support
            audio_io.seek(0)
            audio, sr = librosa.load(audio_io, sr=None)

        # Convert to mono if stereo
        if len(audio.shape) > 1:
            audio = audio.mean(axis=1)

        # Resample to RVC sample rate
        if sr != RVC_SAMPLE_RATE:
            audio = librosa.resample(audio, orig_sr=sr, target_sr=RVC_SAMPLE_RATE)

        # Process with RVC
        if self._rvc_available and model_name != "default":
            # Load model if needed
            if not self._load_model(model_name):
                logger.warning(f"Using passthrough mode - model {model_name} not available")
                converted = audio
            else:
                # Actual RVC inference would go here
                # For now, apply basic pitch shift as demo
                converted = self._pitch_shift(audio, pitch_shift, RVC_SAMPLE_RATE)
        else:
            # Demo mode: just apply pitch shift
            converted = self._pitch_shift(audio, pitch_shift, RVC_SAMPLE_RATE)

        # Resample to target sample rate
        if RVC_SAMPLE_RATE != TARGET_SAMPLE_RATE:
            converted = librosa.resample(
                converted,
                orig_sr=RVC_SAMPLE_RATE,
                target_sr=TARGET_SAMPLE_RATE
            )

        # Convert to bytes
        output = io.BytesIO()
        sf.write(output, converted, TARGET_SAMPLE_RATE, format='WAV')
        output.seek(0)

        return output.read()

    async def convert_chunk(
        self,
        audio_chunk: bytes,
        model_name: str = "default",
        pitch_shift: int = 0,
        index_rate: float = 0.75
    ) -> bytes:
        """
        Convert a chunk of audio for real-time streaming

        Args:
            audio_chunk: Raw audio chunk (PCM16, mono, 44100Hz expected)
            model_name: RVC model name
            pitch_shift: Pitch shift in semitones
            index_rate: Feature index ratio

        Returns:
            Converted audio chunk as bytes
        """
        # Convert bytes to numpy array (assuming PCM16 format)
        audio = np.frombuffer(audio_chunk, dtype=np.int16).astype(np.float32) / 32768.0

        # Simple pitch shift for real-time (faster but lower quality)
        if pitch_shift != 0:
            audio = self._pitch_shift_fast(audio, pitch_shift, TARGET_SAMPLE_RATE)

        # Convert back to bytes
        audio_int16 = (audio * 32767).astype(np.int16)
        return audio_int16.tobytes()

    def _pitch_shift(self, audio: np.ndarray, semitones: int, sr: int) -> np.ndarray:
        """Apply pitch shift using librosa"""
        if semitones == 0:
            return audio

        try:
            return librosa.effects.pitch_shift(
                audio,
                sr=sr,
                n_steps=semitones
            )
        except Exception as e:
            logger.warning(f"Pitch shift failed: {e}")
            return audio

    def _pitch_shift_fast(self, audio: np.ndarray, semitones: int, sr: int) -> np.ndarray:
        """Fast pitch shift for real-time (using resampling trick)"""
        if semitones == 0:
            return audio

        # Calculate ratio
        ratio = 2 ** (semitones / 12)

        # Resample to shift pitch
        try:
            shifted = librosa.resample(
                audio,
                orig_sr=sr,
                target_sr=int(sr / ratio)
            )
            # Resample back to original length
            if len(shifted) != len(audio):
                shifted = librosa.resample(
                    shifted,
                    orig_sr=int(sr / ratio),
                    target_sr=sr
                )
                # Pad or trim to match original length
                if len(shifted) > len(audio):
                    shifted = shifted[:len(audio)]
                elif len(shifted) < len(audio):
                    shifted = np.pad(shifted, (0, len(audio) - len(shifted)))

            return shifted
        except Exception as e:
            logger.warning(f"Fast pitch shift failed: {e}")
            return audio
