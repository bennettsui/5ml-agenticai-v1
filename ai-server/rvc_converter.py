"""
RVC (Retrieval-based Voice Conversion) wrapper.

Converts voice in real-time using a trained RVC model.
Each character has their own .pth model trained on target voice samples.

Training guide:
  1. Collect 10-30 minutes of clean target voice audio
  2. Use RVC WebUI or CLI to train a model
  3. Export the .pth file to models/voices/<character-id>.pth
"""

import logging
import os
from typing import Optional

import numpy as np

logger = logging.getLogger(__name__)


class RVCConverter:
    """Wrapper around RVC inference for real-time voice conversion."""

    def __init__(self, model_path: str, device: str = "cuda:0"):
        self.model_path = model_path
        self.device = device
        self.model = None
        self.hubert_model = None
        self._load_model()

    def _load_model(self):
        """Load the RVC model and HuBERT feature extractor."""
        try:
            # Try importing RVC inference modules
            # These come from the rvc-python package or manual RVC installation
            import torch

            if not os.path.exists(self.model_path):
                logger.error(f"Model file not found: {self.model_path}")
                return

            logger.info(f"Loading RVC model from {self.model_path}")

            # Check for GPU
            if "cuda" in self.device and not torch.cuda.is_available():
                logger.warning("CUDA not available, falling back to CPU")
                self.device = "cpu"

            # Load the model checkpoint
            checkpoint = torch.load(self.model_path, map_location=self.device)
            self.config = checkpoint.get("config", {})
            self.model_loaded = True

            logger.info(f"RVC model loaded on {self.device}")

        except ImportError as e:
            logger.error(f"Required package not installed: {e}")
            logger.error("Install with: pip install torch fairseq")
            self.model_loaded = False
        except Exception as e:
            logger.error(f"Failed to load RVC model: {e}")
            self.model_loaded = False

    def convert(
        self,
        audio: np.ndarray,
        sample_rate: int = 16000,
        pitch_shift: int = 0,
        f0_method: str = "rmvpe",
    ) -> np.ndarray:
        """
        Convert voice in the audio array.

        Args:
            audio: Input audio as float32 numpy array
            sample_rate: Sample rate of the audio
            pitch_shift: Semitones to shift pitch (positive = higher)
            f0_method: Pitch detection method (rmvpe, crepe, harvest)

        Returns:
            Converted audio as float32 numpy array
        """
        if not self.model_loaded:
            return audio

        try:
            import torch
            import torchaudio

            # Convert numpy to torch tensor
            audio_tensor = torch.from_numpy(audio).float().to(self.device)

            if audio_tensor.dim() == 1:
                audio_tensor = audio_tensor.unsqueeze(0)

            # Resample to model's expected sample rate if needed
            if sample_rate != 16000:
                resampler = torchaudio.transforms.Resample(
                    sample_rate, 16000
                ).to(self.device)
                audio_tensor = resampler(audio_tensor)

            # Run RVC inference
            # The actual inference pipeline depends on the RVC version
            # This is a simplified version - full pipeline includes:
            # 1. Extract HuBERT features
            # 2. Run pitch detection (f0)
            # 3. Apply pitch shift
            # 4. Run the voice conversion model
            # 5. Post-process output

            with torch.no_grad():
                # Placeholder for actual RVC inference
                # In production, use the full RVC pipeline
                converted = audio_tensor

            # Resample back if needed
            if sample_rate != 16000:
                resampler = torchaudio.transforms.Resample(
                    16000, sample_rate
                ).to(self.device)
                converted = resampler(converted)

            result = converted.squeeze().cpu().numpy()
            return result

        except Exception as e:
            logger.error(f"RVC conversion error: {e}")
            return audio

    @property
    def is_ready(self) -> bool:
        return self.model_loaded
