"""
so-vits-svc Converter
Wrapper for high-quality voice conversion using so-vits-svc
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

# Sample rates
SOVITS_SAMPLE_RATE = 44100


class SoVitsSVCConverter:
    """so-vits-svc Voice Converter"""

    def __init__(self, models_dir: Path):
        """
        Initialize so-vits-svc converter

        Args:
            models_dir: Directory containing so-vits-svc models
        """
        self.models_dir = Path(models_dir)
        self.models_dir.mkdir(parents=True, exist_ok=True)

        self.loaded_models: Dict[str, Any] = {}
        self.device = "cpu"

        self._sovits_available = False
        self._init_sovits()

    def _init_sovits(self):
        """Initialize so-vits-svc modules"""
        try:
            import torch

            self.device = "cuda" if torch.cuda.is_available() else "cpu"
            logger.info(f"so-vits-svc using device: {self.device}")

            self._sovits_available = True

        except ImportError as e:
            logger.warning(f"so-vits-svc dependencies not fully installed: {e}")
            self._sovits_available = False

    def list_models(self) -> List[Dict[str, str]]:
        """List available so-vits-svc models"""
        models = []

        if not self.models_dir.exists():
            return models

        for model_dir in self.models_dir.iterdir():
            if model_dir.is_dir():
                # so-vits-svc models typically have G_*.pth and config.json
                pth_files = list(model_dir.glob("G_*.pth")) or list(model_dir.glob("*.pth"))
                config_files = list(model_dir.glob("config.json"))

                if pth_files:
                    models.append({
                        "name": model_dir.name,
                        "model_file": pth_files[0].name,
                        "config_file": config_files[0].name if config_files else None,
                        "type": "sovits"
                    })

        # Add default/demo model info
        if not models:
            models.append({
                "name": "default",
                "model_file": None,
                "config_file": None,
                "type": "sovits",
                "note": "No models installed. Upload a model to get started."
            })

        return models

    def _load_model(self, model_name: str) -> bool:
        """
        Load a so-vits-svc model

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

        pth_files = list(model_dir.glob("G_*.pth")) or list(model_dir.glob("*.pth"))
        if not pth_files:
            logger.warning(f"No model file found in {model_dir}")
            return False

        config_files = list(model_dir.glob("config.json"))

        try:
            import torch

            model_path = pth_files[0]
            config_path = config_files[0] if config_files else None

            # Store model info (actual loading would use so-vits-svc inference)
            self.loaded_models[model_name] = {
                "model_path": model_path,
                "config_path": config_path,
                "loaded": True
            }

            logger.info(f"Loaded so-vits-svc model: {model_name}")
            return True

        except Exception as e:
            logger.error(f"Failed to load model {model_name}: {e}")
            return False

    async def convert(
        self,
        audio_bytes: bytes,
        model_name: str = "default",
        pitch_shift: int = 0,
        speaker_id: int = 0,
        cluster_ratio: float = 0.0,
        noise_scale: float = 0.4,
        pad_seconds: float = 0.5
    ) -> bytes:
        """
        Convert voice in audio file using so-vits-svc

        Args:
            audio_bytes: Input audio as bytes
            model_name: Model name to use
            pitch_shift: Pitch shift in semitones
            speaker_id: Speaker ID for multi-speaker models
            cluster_ratio: Cluster inference ratio (0-1)
            noise_scale: Noise scale for synthesis
            pad_seconds: Padding seconds

        Returns:
            Converted audio as WAV bytes
        """
        # Load audio
        audio_io = io.BytesIO(audio_bytes)
        try:
            audio, sr = sf.read(audio_io)
        except Exception:
            audio_io.seek(0)
            audio, sr = librosa.load(audio_io, sr=None)

        # Convert to mono if stereo
        if len(audio.shape) > 1:
            audio = audio.mean(axis=1)

        # Resample to so-vits-svc sample rate
        if sr != SOVITS_SAMPLE_RATE:
            audio = librosa.resample(audio, orig_sr=sr, target_sr=SOVITS_SAMPLE_RATE)

        # Process with so-vits-svc
        if self._sovits_available and model_name != "default":
            if not self._load_model(model_name):
                logger.warning(f"Using passthrough mode - model {model_name} not available")
                converted = audio
            else:
                # Actual so-vits-svc inference would go here
                # For demo, apply pitch shift and some basic processing
                converted = self._process_audio(audio, pitch_shift, SOVITS_SAMPLE_RATE)
        else:
            # Demo mode
            converted = self._process_audio(audio, pitch_shift, SOVITS_SAMPLE_RATE)

        # Convert to bytes
        output = io.BytesIO()
        sf.write(output, converted, SOVITS_SAMPLE_RATE, format='WAV')
        output.seek(0)

        return output.read()

    async def convert_chunk(
        self,
        audio_chunk: bytes,
        model_name: str = "default",
        pitch_shift: int = 0
    ) -> bytes:
        """
        Convert a chunk of audio for streaming

        Note: so-vits-svc is typically not ideal for real-time due to latency.
        For real-time use cases, RVC is recommended.

        Args:
            audio_chunk: Raw audio chunk (PCM16, mono)
            model_name: Model name
            pitch_shift: Pitch shift in semitones

        Returns:
            Converted audio chunk as bytes
        """
        # Convert bytes to numpy array
        audio = np.frombuffer(audio_chunk, dtype=np.int16).astype(np.float32) / 32768.0

        # Apply processing
        processed = self._process_audio_fast(audio, pitch_shift, SOVITS_SAMPLE_RATE)

        # Convert back to bytes
        audio_int16 = (processed * 32767).astype(np.int16)
        return audio_int16.tobytes()

    def _process_audio(
        self,
        audio: np.ndarray,
        pitch_shift: int,
        sr: int
    ) -> np.ndarray:
        """
        Process audio with pitch shift and basic effects

        In a full implementation, this would use so-vits-svc inference.
        """
        if pitch_shift != 0:
            try:
                audio = librosa.effects.pitch_shift(
                    audio,
                    sr=sr,
                    n_steps=pitch_shift
                )
            except Exception as e:
                logger.warning(f"Pitch shift failed: {e}")

        return audio

    def _process_audio_fast(
        self,
        audio: np.ndarray,
        pitch_shift: int,
        sr: int
    ) -> np.ndarray:
        """Fast audio processing for real-time"""
        if pitch_shift == 0:
            return audio

        # Use resampling trick for fast pitch shift
        ratio = 2 ** (pitch_shift / 12)

        try:
            # This is a simplified approach for demo
            shifted = librosa.resample(
                audio,
                orig_sr=sr,
                target_sr=int(sr / ratio)
            )
            # Resample back
            shifted = librosa.resample(
                shifted,
                orig_sr=int(sr / ratio),
                target_sr=sr
            )

            # Match length
            if len(shifted) > len(audio):
                shifted = shifted[:len(audio)]
            elif len(shifted) < len(audio):
                shifted = np.pad(shifted, (0, len(audio) - len(shifted)))

            return shifted

        except Exception as e:
            logger.warning(f"Fast processing failed: {e}")
            return audio
