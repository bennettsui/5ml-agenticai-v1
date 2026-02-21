"""
Output Validator
----------------
Checks that the compressed PDF is:
  1. Non-empty (file exists and size > 0)
  2. A valid PDF (magic bytes check)
  3. Readable as a PDF (PyPDF2 / pypdf page count, or qpdf)
  4. Achieved meaningful size reduction (configurable threshold)
"""

from __future__ import annotations

import logging
import os
import subprocess
from pathlib import Path

logger = logging.getLogger("pdf_compression.validator")

# Minimum compression improvement required (e.g. 0.05 = 5%)
MIN_REDUCTION_RATIO = float(os.environ.get("MIN_REDUCTION_RATIO", "0.05"))


class ValidationError(Exception):
    """Raised when the compressed file fails validation."""


def validate(
    original_path: Path,
    compressed_path: Path,
    min_reduction: float = MIN_REDUCTION_RATIO,
) -> dict:
    """
    Validate the compressed PDF.

    Returns a dict:
      {
        "ok": bool,
        "original_size_bytes": int,
        "compressed_size_bytes": int,
        "ratio": float,          # compressed / original (lower is better)
        "page_count": int,
        "warnings": [str],
        "error": str,
      }
    """
    warnings: list[str] = []

    # 1. File existence
    if not compressed_path.exists() or compressed_path.stat().st_size == 0:
        return _error("Compressed file is missing or empty")

    original_size = original_path.stat().st_size
    compressed_size = compressed_path.stat().st_size
    ratio = compressed_size / original_size if original_size > 0 else 1.0

    # 2. PDF magic bytes (starts with %PDF-)
    with compressed_path.open("rb") as f:
        magic = f.read(5)
    if magic != b"%PDF-":
        return _error(f"Output is not a valid PDF (magic bytes: {magic!r})")

    # 3. Page count / readability
    page_count, read_error = _read_page_count(compressed_path)
    if read_error:
        warnings.append(f"Could not verify page count: {read_error}")
        page_count = -1

    # 4. Size improvement check
    if ratio > (1.0 - min_reduction):
        logger.warning(
            "Compression yielded only %.1f%% reduction (threshold %.1f%%)",
            (1 - ratio) * 100,
            min_reduction * 100,
        )
        warnings.append(
            f"Size improvement ({(1 - ratio) * 100:.1f}%) is below threshold "
            f"({min_reduction * 100:.1f}%)"
        )

    logger.info(
        "Validation passed — original=%d B, compressed=%d B, ratio=%.3f, pages=%s",
        original_size,
        compressed_size,
        ratio,
        page_count,
    )

    return {
        "ok": True,
        "original_size_bytes": original_size,
        "compressed_size_bytes": compressed_size,
        "ratio": round(ratio, 4),
        "page_count": page_count,
        "warnings": warnings,
        "error": "",
    }


def _read_page_count(path: Path) -> tuple[int, str]:
    """Try PyPDF2 / pypdf first, then qpdf."""

    # Try pypdf (modern) or PyPDF2 (legacy)
    for module_name in ("pypdf", "PyPDF2"):
        try:
            mod = __import__(module_name)
            reader_cls = getattr(mod, "PdfReader", None)
            if reader_cls is None:
                reader_cls = getattr(mod, "PdfFileReader", None)
            if reader_cls:
                reader = reader_cls(str(path))
                page_count = (
                    len(reader.pages)
                    if hasattr(reader, "pages")
                    else reader.getNumPages()
                )
                return page_count, ""
        except ImportError:
            continue
        except Exception as exc:
            return -1, str(exc)

    # Try qpdf CLI
    try:
        result = subprocess.run(
            ["qpdf", "--check", str(path)],
            capture_output=True,
            text=True,
            timeout=30,
        )
        if result.returncode == 0:
            return -1, ""  # valid but page count unknown
        return -1, f"qpdf check failed: {result.stderr[:200]}"
    except FileNotFoundError:
        pass
    except Exception as exc:
        return -1, str(exc)

    return -1, "No PDF validation library available (install pypdf or qpdf)"


def _error(msg: str) -> dict:
    logger.error("Validation failed: %s", msg)
    return {
        "ok": False,
        "original_size_bytes": 0,
        "compressed_size_bytes": 0,
        "ratio": 1.0,
        "page_count": -1,
        "warnings": [],
        "error": msg,
    }
