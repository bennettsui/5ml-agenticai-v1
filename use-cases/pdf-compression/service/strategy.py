"""
PDF Compression Strategy
------------------------
Inspects the input request (profile, file size, page count) and decides
which tool adapter (or chain of adapters) to use.

Decision matrix:
  profile=lossless   → pdfsizeopt  (lossless recompression, JBIG2, PNGOUT)
  profile=small      → pdfc/gs     (screen preset, aggressive)
  profile=web        → pdfc/gs     (ebook preset) → pdfEasyCompress (images)
  profile=balanced   → pdfc/gs (default) → pdfsizeopt (polish)
  profile=auto       → size-based heuristic:
                        < 2 MB  → pdfsizeopt
                        2–20 MB → pdfc balanced
                        > 20 MB → pdfc small → pdfEasyCompress

Fallback chain: if the primary tool fails, try the next in line.
"""

from __future__ import annotations

import logging
import os
import shutil
from pathlib import Path
from typing import Any

from .adapters import (
    CompressResult,
    PdfcAdapter,
    PdfEasyCompressAdapter,
    PdfSizeOptAdapter,
    PaperweightAdapter,
)

logger = logging.getLogger("pdf_compression.strategy")

# ---------------------------------------------------------------------------
# Build the tool registry (instantiated once at startup)
# ---------------------------------------------------------------------------

_PDFSIZEOPT = PdfSizeOptAdapter()
_PDFC = PdfcAdapter()
_PDF_EASY = PdfEasyCompressAdapter()
_PAPERWEIGHT = PaperweightAdapter()


# ---------------------------------------------------------------------------
# Strategy
# ---------------------------------------------------------------------------

class CompressionStrategy:
    """Picks the optimal tool chain and runs it with automatic fallback."""

    def __init__(self) -> None:
        self._pdfsizeopt_available = self._check_binary(
            os.environ.get("PDFSIZEOPT_BIN", "pdfsizeopt")
        )
        self._gs_available = self._check_binary(
            os.environ.get("GHOSTSCRIPT_BIN", "gs")
        )
        self._paperweight_url = os.environ.get("PAPERWEIGHT_URL", "")
        logger.info(
            "Tool availability — pdfsizeopt=%s, ghostscript=%s, paperweight=%s",
            self._pdfsizeopt_available,
            self._gs_available,
            bool(self._paperweight_url),
        )

    # ------------------------------------------------------------------
    # Public entry point
    # ------------------------------------------------------------------

    def select_chain(
        self,
        input_path: Path,
        profile: dict[str, Any],
    ) -> list[tuple[object, dict[str, Any]]]:
        """
        Return an ordered list of (adapter, profile_dict) tuples.
        The caller tries each in sequence, stopping on first success.
        """
        profile_name = profile.get("name", "balanced")
        file_size_mb = input_path.stat().st_size / (1024 * 1024)
        priority = profile.get("priority", "quality")

        logger.info(
            "Selecting chain — profile=%s, file_size=%.2f MB, priority=%s",
            profile_name,
            file_size_mb,
            priority,
        )

        chain = self._build_chain(profile_name, file_size_mb, priority)

        # Log chosen chain
        tool_names = [adapter.name for adapter, _ in chain]
        logger.info("Selected chain: %s", " → ".join(tool_names))

        return chain

    # ------------------------------------------------------------------
    # Chain builders
    # ------------------------------------------------------------------

    def _build_chain(
        self,
        profile_name: str,
        file_size_mb: float,
        priority: str,
    ) -> list[tuple[object, dict[str, Any]]]:

        if profile_name == "lossless":
            return self._chain_lossless()

        if profile_name == "small":
            return self._chain_small()

        if profile_name == "web":
            return self._chain_web()

        if profile_name == "balanced":
            return self._chain_balanced()

        # auto — size-based heuristic
        if profile_name == "auto":
            if file_size_mb < 2:
                logger.debug("auto: small file → lossless chain")
                return self._chain_lossless()
            elif file_size_mb <= 20:
                logger.debug("auto: medium file → balanced chain")
                return self._chain_balanced()
            else:
                logger.debug("auto: large file → aggressive chain")
                return self._chain_small() + self._chain_image_pass()

        # Unknown profile — fall back to balanced
        logger.warning("Unknown profile %r, using balanced", profile_name)
        return self._chain_balanced()

    def _chain_lossless(self) -> list[tuple[object, dict[str, Any]]]:
        """pdfsizeopt → pdfc (prepress fallback)"""
        chain: list[tuple[object, dict[str, Any]]] = []
        if self._pdfsizeopt_available:
            chain.append((_PDFSIZEOPT, {"name": "lossless", "use_jbig2": True, "use_pngout": True}))
        if self._gs_available:
            chain.append((_PDFC, {"name": "lossless", "dpi": 300}))
        if not chain:
            chain.append((_PAPERWEIGHT, {"name": "lossless"}))
        return chain

    def _chain_small(self) -> list[tuple[object, dict[str, Any]]]:
        """pdfc screen → paperweight"""
        chain: list[tuple[object, dict[str, Any]]] = []
        if self._gs_available:
            chain.append((_PDFC, {"name": "small", "dpi": 96}))
        if self._paperweight_url:
            chain.append((_PAPERWEIGHT, {"name": "small"}))
        if not chain:
            chain.append((_PDF_EASY, {"name": "small", "image_quality": 45, "max_image_size_px": 1000}))
        return chain

    def _chain_web(self) -> list[tuple[object, dict[str, Any]]]:
        """pdfc ebook → pdfEasyCompress image pass"""
        chain: list[tuple[object, dict[str, Any]]] = []
        if self._gs_available:
            chain.append((_PDFC, {"name": "web", "dpi": 120}))
        chain.extend(self._chain_image_pass())
        return chain

    def _chain_balanced(self) -> list[tuple[object, dict[str, Any]]]:
        """pdfc default → pdfsizeopt polish"""
        chain: list[tuple[object, dict[str, Any]]] = []
        if self._gs_available:
            chain.append((_PDFC, {"name": "balanced", "dpi": 150}))
        if self._pdfsizeopt_available:
            chain.append((_PDFSIZEOPT, {"name": "balanced", "use_jbig2": True, "use_pngout": False}))
        if not chain:
            chain.append((_PDF_EASY, {"name": "balanced", "image_quality": 75, "max_image_size_px": 2000}))
        return chain

    def _chain_image_pass(self) -> list[tuple[object, dict[str, Any]]]:
        """pdfEasyCompress for image-heavy secondary pass."""
        return [(_PDF_EASY, {"name": "web", "image_quality": 60, "max_image_size_px": 1600})]

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _check_binary(name: str) -> bool:
        return shutil.which(name) is not None
