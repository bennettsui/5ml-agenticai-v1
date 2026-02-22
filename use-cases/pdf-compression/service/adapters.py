"""
PDF Compression Tool Adapters
------------------------------
Each adapter wraps one open-source CLI tool behind a uniform interface.
All adapters accept an input path, output path, and a profile dict, and
return a CompressResult dataclass.
"""

from __future__ import annotations

import logging
import os
import subprocess
import time
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

logger = logging.getLogger("pdf_compression.adapters")


# ---------------------------------------------------------------------------
# Shared result dataclass
# ---------------------------------------------------------------------------

@dataclass
class CompressResult:
    ok: bool
    tool: str
    command: list[str] = field(default_factory=list)
    elapsed_seconds: float = 0.0
    stdout: str = ""
    stderr: str = ""
    error: str = ""


# ---------------------------------------------------------------------------
# Abstract base
# ---------------------------------------------------------------------------

class ToolAdapter(ABC):
    """Common interface every compression tool must implement."""

    name: str = "abstract"

    @abstractmethod
    def compress(
        self,
        input_path: Path,
        output_path: Path,
        profile: dict[str, Any],
    ) -> CompressResult:
        """Run compression and return a CompressResult."""

    def _run(self, cmd: list[str], timeout: int = 300) -> tuple[int, str, str]:
        """Execute a subprocess command and return (returncode, stdout, stderr)."""
        logger.debug("Running: %s", " ".join(str(c) for c in cmd))
        start = time.monotonic()
        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=timeout,
            )
            elapsed = time.monotonic() - start
            logger.debug(
                "Finished in %.2fs (rc=%d): %s",
                elapsed,
                result.returncode,
                " ".join(str(c) for c in cmd),
            )
            return result.returncode, result.stdout, result.stderr
        except subprocess.TimeoutExpired:
            raise RuntimeError(f"Command timed out after {timeout}s: {' '.join(str(c) for c in cmd)}")
        except FileNotFoundError as exc:
            raise RuntimeError(f"Executable not found: {cmd[0]}") from exc


# ---------------------------------------------------------------------------
# Adapter 1 — pdfsizeopt
# ---------------------------------------------------------------------------

class PdfSizeOptAdapter(ToolAdapter):
    """
    Wraps pts/pdfsizeopt — advanced lossless/near-lossless PDF optimiser.
    Best for: lossless profile, text-heavy PDFs, when quality must be preserved.

    Install: see Dockerfile (python2 + pdfsizeopt binary).
    Env:     PDFSIZEOPT_BIN  (default: pdfsizeopt)
    """

    name = "pdfsizeopt"

    def compress(
        self,
        input_path: Path,
        output_path: Path,
        profile: dict[str, Any],
    ) -> CompressResult:
        bin_path = os.environ.get("PDFSIZEOPT_BIN", "pdfsizeopt")
        use_jbig2 = profile.get("use_jbig2", True)
        use_pngout = profile.get("use_pngout", True)

        cmd = [
            bin_path,
            f"--use-jbig2={int(use_jbig2)}",
            f"--use-pngout={int(use_pngout)}",
            str(input_path),
            str(output_path),
        ]

        start = time.monotonic()
        try:
            rc, stdout, stderr = self._run(cmd)
        except RuntimeError as exc:
            return CompressResult(ok=False, tool=self.name, command=cmd, error=str(exc))

        elapsed = time.monotonic() - start
        ok = rc == 0 and output_path.exists() and output_path.stat().st_size > 0
        return CompressResult(
            ok=ok,
            tool=self.name,
            command=cmd,
            elapsed_seconds=elapsed,
            stdout=stdout[:2000],
            stderr=stderr[:2000],
            error="" if ok else f"pdfsizeopt exited with code {rc}",
        )


# ---------------------------------------------------------------------------
# Adapter 2 — pdfc (theeko74/pdfc)
# ---------------------------------------------------------------------------

class PdfcAdapter(ToolAdapter):
    """
    Wraps theeko74/pdfc — Python + Ghostscript wrapper with quality levels.
    Best for: balanced / small profiles; reliable Ghostscript presets.

    Install: pip install pdfc  (requires ghostscript on PATH)
    Env:     GHOSTSCRIPT_BIN  (default: gs)
    """

    name = "pdfc"

    # Maps our profiles to Ghostscript PDFSETTINGS
    GS_PRESETS = {
        "lossless": "prepress",   # highest quality
        "balanced": "default",
        "small": "screen",
        "web": "ebook",
        "auto": "default",
    }

    def compress(
        self,
        input_path: Path,
        output_path: Path,
        profile: dict[str, Any],
    ) -> CompressResult:
        gs_bin = os.environ.get("GHOSTSCRIPT_BIN", "gs")
        profile_name = profile.get("name", "balanced")
        gs_preset = self.GS_PRESETS.get(profile_name, "default")

        # Build Ghostscript command directly (pdfc is a thin wrapper)
        dpi = profile.get("dpi", 150)
        cmd = [
            gs_bin,
            "-sDEVICE=pdfwrite",
            "-dCompatibilityLevel=1.4",
            f"-dPDFSETTINGS=/{gs_preset}",
            "-dNOPAUSE",
            "-dQUIET",
            "-dBATCH",
            f"-r{dpi}",
            f"-sOutputFile={output_path}",
            str(input_path),
        ]

        start = time.monotonic()
        try:
            rc, stdout, stderr = self._run(cmd)
        except RuntimeError as exc:
            return CompressResult(ok=False, tool=self.name, command=cmd, error=str(exc))

        elapsed = time.monotonic() - start
        ok = rc == 0 and output_path.exists() and output_path.stat().st_size > 0
        return CompressResult(
            ok=ok,
            tool=self.name,
            command=cmd,
            elapsed_seconds=elapsed,
            stdout=stdout[:2000],
            stderr=stderr[:2000],
            error="" if ok else f"Ghostscript exited with code {rc}. stderr: {stderr[:500]}",
        )


# ---------------------------------------------------------------------------
# Adapter 3 — pdfEasyCompress (davidAlgis/pdfEasyCompress)
# ---------------------------------------------------------------------------

class PdfEasyCompressAdapter(ToolAdapter):
    """
    Wraps davidAlgis/pdfEasyCompress — image-focused PDF compression.
    Best for: image-heavy PDFs (scanned docs, brochures, photo books).
    Uses Pillow to downsample embedded images before repacking via pikepdf.

    Install: pip install pdf-easy-compress pikepdf Pillow
    Env:     none (pure Python)
    """

    name = "pdfEasyCompress"

    # Profile → (image_quality, max_image_size_px)
    QUALITY_MAP = {
        "lossless": (95, 3000),
        "balanced": (75, 2000),
        "small": (50, 1200),
        "web": (60, 1600),
        "auto": (75, 2000),
    }

    def compress(
        self,
        input_path: Path,
        output_path: Path,
        profile: dict[str, Any],
    ) -> CompressResult:
        profile_name = profile.get("name", "balanced")
        quality, max_px = self.QUALITY_MAP.get(profile_name, (75, 2000))

        # Override from explicit profile params if provided
        quality = profile.get("image_quality", quality)
        max_px = profile.get("max_image_size_px", max_px)

        cmd = [
            "python3",
            "-m",
            "pdf_easy_compress",
            str(input_path),
            str(output_path),
            "--quality",
            str(quality),
            "--max-image-size",
            str(max_px),
        ]

        start = time.monotonic()
        try:
            rc, stdout, stderr = self._run(cmd)
        except RuntimeError as exc:
            return CompressResult(ok=False, tool=self.name, command=cmd, error=str(exc))

        elapsed = time.monotonic() - start
        ok = rc == 0 and output_path.exists() and output_path.stat().st_size > 0
        return CompressResult(
            ok=ok,
            tool=self.name,
            command=cmd,
            elapsed_seconds=elapsed,
            stdout=stdout[:2000],
            stderr=stderr[:2000],
            error="" if ok else f"pdfEasyCompress exited with code {rc}",
        )


# ---------------------------------------------------------------------------
# Adapter 4 — Paperweight (chekuhakim/paperweight) — HTTP-based
# ---------------------------------------------------------------------------

class PaperweightAdapter(ToolAdapter):
    """
    Wraps chekuhakim/paperweight — self-hosted web app using Ghostscript.
    Called via its internal HTTP API rather than CLI.

    When PAPERWEIGHT_URL is not set, falls back to direct Ghostscript.
    Env:     PAPERWEIGHT_URL  e.g. http://paperweight:3000
             GHOSTSCRIPT_BIN  (fallback only)
    """

    name = "paperweight"

    def compress(
        self,
        input_path: Path,
        output_path: Path,
        profile: dict[str, Any],
    ) -> CompressResult:
        base_url = os.environ.get("PAPERWEIGHT_URL", "")
        if base_url:
            return self._compress_via_http(input_path, output_path, profile, base_url)
        else:
            return self._compress_via_gs_fallback(input_path, output_path, profile)

    def _compress_via_http(
        self,
        input_path: Path,
        output_path: Path,
        profile: dict[str, Any],
        base_url: str,
    ) -> CompressResult:
        """POST the PDF to Paperweight's /compress endpoint and save the result."""
        import urllib.request
        import urllib.error

        url = f"{base_url.rstrip('/')}/compress"
        profile_name = profile.get("name", "balanced")

        boundary = "PaperweightBoundary12345"
        pdf_bytes = input_path.read_bytes()

        body = (
            f"--{boundary}\r\n"
            f'Content-Disposition: form-data; name="file"; filename="{input_path.name}"\r\n'
            f"Content-Type: application/pdf\r\n\r\n"
        ).encode() + pdf_bytes + (
            f"\r\n--{boundary}\r\n"
            f'Content-Disposition: form-data; name="profile"\r\n\r\n'
            f"{profile_name}\r\n"
            f"--{boundary}--\r\n"
        ).encode()

        req = urllib.request.Request(
            url,
            data=body,
            headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
        )

        cmd = [f"POST {url}", f"profile={profile_name}"]
        start = time.monotonic()
        try:
            with urllib.request.urlopen(req, timeout=120) as resp:
                output_path.write_bytes(resp.read())
            elapsed = time.monotonic() - start
            ok = output_path.exists() and output_path.stat().st_size > 0
            return CompressResult(
                ok=ok,
                tool=self.name,
                command=cmd,
                elapsed_seconds=elapsed,
                error="" if ok else "Paperweight returned empty file",
            )
        except Exception as exc:
            elapsed = time.monotonic() - start
            return CompressResult(
                ok=False,
                tool=self.name,
                command=cmd,
                elapsed_seconds=elapsed,
                error=f"Paperweight HTTP error: {exc}",
            )

    def _compress_via_gs_fallback(
        self,
        input_path: Path,
        output_path: Path,
        profile: dict[str, Any],
    ) -> CompressResult:
        """Direct Ghostscript when Paperweight is not available."""
        gs_bin = os.environ.get("GHOSTSCRIPT_BIN", "gs")
        profile_name = profile.get("name", "balanced")

        gs_presets = {
            "lossless": "prepress",
            "balanced": "default",
            "small": "screen",
            "web": "ebook",
            "auto": "default",
        }
        preset = gs_presets.get(profile_name, "default")

        cmd = [
            gs_bin,
            "-sDEVICE=pdfwrite",
            "-dCompatibilityLevel=1.4",
            f"-dPDFSETTINGS=/{preset}",
            "-dNOPAUSE",
            "-dQUIET",
            "-dBATCH",
            f"-sOutputFile={output_path}",
            str(input_path),
        ]

        start = time.monotonic()
        try:
            rc, stdout, stderr = self._run(cmd)
        except RuntimeError as exc:
            return CompressResult(ok=False, tool=self.name, command=cmd, error=str(exc))

        elapsed = time.monotonic() - start
        ok = rc == 0 and output_path.exists() and output_path.stat().st_size > 0
        return CompressResult(
            ok=ok,
            tool=self.name,
            command=cmd,
            elapsed_seconds=elapsed,
            stdout=stdout[:2000],
            stderr=stderr[:2000],
            error="" if ok else f"Ghostscript fallback exited with code {rc}",
        )
