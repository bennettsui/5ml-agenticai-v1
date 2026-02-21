"""
PDF Compression Service — FastAPI Application
----------------------------------------------
Exposes:
  POST /compress   — main compression endpoint
  GET  /health     — readiness / liveness probe
  GET  /profiles   — list available compression profiles

Environment variables:
  PORT              (default: 8080)
  TEMP_DIR          temp directory for intermediate files (default: system temp)
  MIN_REDUCTION_RATIO  skip compression if improvement < this fraction (default: 0.05)
  GHOSTSCRIPT_BIN   path to gs binary (default: gs)
  PDFSIZEOPT_BIN    path to pdfsizeopt binary (default: pdfsizeopt)
  PAPERWEIGHT_URL   URL of self-hosted Paperweight service (optional)
"""

from __future__ import annotations

import logging
import os
import shutil
import tempfile
import time
import uuid
from pathlib import Path
from typing import Any, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator

from .fetcher import resolve as resolve_source
from .strategy import CompressionStrategy
from .validator import validate as validate_output

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)
logger = logging.getLogger("pdf_compression.app")

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

app = FastAPI(
    title="PDF Compression Service",
    description="Agentic PDF compression pipeline using open-source tools",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Single shared strategy instance (tool availability checked once at startup)
_strategy = CompressionStrategy()

TEMP_DIR = Path(os.environ.get("TEMP_DIR", tempfile.gettempdir()))
MIN_REDUCTION_RATIO = float(os.environ.get("MIN_REDUCTION_RATIO", "0.05"))

# ---------------------------------------------------------------------------
# Request / Response schemas
# ---------------------------------------------------------------------------

VALID_PROFILES = {"auto", "lossless", "small", "balanced", "web"}
VALID_PRIORITIES = {"quality", "size"}


class CompressRequest(BaseModel):
    source: str = Field(
        ...,
        description=(
            "Source PDF location. Accepts: "
            "local absolute path (/data/file.pdf), "
            "https:// URL, or s3://bucket/key"
        ),
        example="https://example.com/proposal.pdf",
    )
    profile: str = Field(
        "balanced",
        description="Compression profile: auto | lossless | small | balanced | web",
    )
    max_size_mb: Optional[float] = Field(
        None,
        description="Target maximum output size in MB (best-effort; not guaranteed)",
    )
    priority: str = Field(
        "quality",
        description="Optimisation priority: quality | size",
    )
    tags: list[str] = Field(
        default_factory=list,
        description="Optional tags for traceability (e.g. ['tender', 'clientX'])",
    )

    @validator("profile")
    def validate_profile(cls, v: str) -> str:
        if v not in VALID_PROFILES:
            raise ValueError(f"profile must be one of {sorted(VALID_PROFILES)}")
        return v

    @validator("priority")
    def validate_priority(cls, v: str) -> str:
        if v not in VALID_PRIORITIES:
            raise ValueError(f"priority must be one of {sorted(VALID_PRIORITIES)}")
        return v


class CompressResponse(BaseModel):
    ok: bool
    request_id: str
    original_size_bytes: int = 0
    compressed_size_bytes: int = 0
    ratio: float = 1.0
    reduction_pct: float = 0.0
    page_count: int = -1
    tool_chain: list[str] = Field(default_factory=list)
    output_path: str = ""
    warnings: list[str] = Field(default_factory=list)
    logs: list[str] = Field(default_factory=list)
    elapsed_seconds: float = 0.0
    error: str = ""


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/health")
def health():
    """Liveness / readiness probe."""
    return {
        "status": "ok",
        "service": "pdf-compression",
        "version": "1.0.0",
        "tools": {
            "ghostscript": shutil.which(os.environ.get("GHOSTSCRIPT_BIN", "gs")) is not None,
            "pdfsizeopt": shutil.which(os.environ.get("PDFSIZEOPT_BIN", "pdfsizeopt")) is not None,
            "paperweight": bool(os.environ.get("PAPERWEIGHT_URL", "")),
            "pypdf": _check_import("pypdf") or _check_import("PyPDF2"),
        },
    }


@app.get("/profiles")
def profiles():
    """Describe available compression profiles."""
    return {
        "profiles": [
            {
                "name": "auto",
                "description": "Automatically selects the best tool based on file size",
                "use_case": "General purpose — good default for most documents",
            },
            {
                "name": "lossless",
                "description": "Maximum quality preservation. Uses pdfsizeopt (JBIG2/PNGOUT). No visual degradation.",
                "use_case": "Legal documents, certificates, archiving, final deliverables",
            },
            {
                "name": "balanced",
                "description": "Good quality-to-size ratio. Ghostscript default preset.",
                "use_case": "Tender submissions, internal reports, client drafts",
            },
            {
                "name": "web",
                "description": "Screen-optimised. Reduces DPI to 120, uses ebook preset.",
                "use_case": "Email attachments, WhatsApp sharing, website downloads",
            },
            {
                "name": "small",
                "description": "Aggressive compression. Uses Ghostscript screen preset (96 DPI).",
                "use_case": "Uploading to portals with strict size limits (< 5 MB)",
            },
        ]
    }


@app.post("/compress", response_model=CompressResponse)
def compress(req: CompressRequest):
    """
    Compress a PDF using the best available tool for the requested profile.

    Returns compression metadata including tool chain, ratio, and output path.
    """
    request_id = str(uuid.uuid4())[:8]
    logs: list[str] = []
    tool_chain: list[str] = []
    start_wall = time.monotonic()

    def log(msg: str) -> None:
        logger.info("[%s] %s", request_id, msg)
        logs.append(msg)

    log(f"Compress request — source={req.source!r}, profile={req.profile}, priority={req.priority}, tags={req.tags}")

    # ------------------------------------------------------------------
    # 1. Fetch / resolve source
    # ------------------------------------------------------------------
    try:
        input_path, is_temp_input = resolve_source(req.source)
    except (FileNotFoundError, ValueError, RuntimeError, NotImplementedError) as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    original_size = input_path.stat().st_size
    log(f"Input resolved: {input_path} ({original_size:,} bytes)")

    # ------------------------------------------------------------------
    # 2. Prepare output path
    # ------------------------------------------------------------------
    output_dir = TEMP_DIR / f"pdf_out_{request_id}"
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / f"compressed_{input_path.name}"

    # ------------------------------------------------------------------
    # 3. Select tool chain
    # ------------------------------------------------------------------
    profile_dict: dict[str, Any] = {
        "name": req.profile,
        "priority": req.priority,
    }
    chain = _strategy.select_chain(input_path, profile_dict)
    log(f"Chain selected: {' → '.join(a.name for a, _ in chain)}")

    # ------------------------------------------------------------------
    # 4. Run tools (stop on first success)
    # ------------------------------------------------------------------
    last_result = None
    for adapter, adapter_profile in chain:
        tool_chain.append(adapter.name)
        log(f"Running tool: {adapter.name}")

        try:
            result = adapter.compress(input_path, output_path, adapter_profile)
        except Exception as exc:
            log(f"Tool {adapter.name} raised exception: {exc}")
            continue

        if result.stdout:
            logs.append(f"[{adapter.name}] stdout: {result.stdout[:300]}")
        if result.stderr:
            logs.append(f"[{adapter.name}] stderr: {result.stderr[:300]}")

        log(
            f"Tool {adapter.name} finished in {result.elapsed_seconds:.2f}s — ok={result.ok}"
            + (f", error: {result.error}" if result.error else "")
        )

        last_result = result
        if result.ok:
            break

        # Tool failed — clean up partial output before next attempt
        if output_path.exists():
            output_path.unlink(missing_ok=True)

    # ------------------------------------------------------------------
    # 5. Validate output
    # ------------------------------------------------------------------
    elapsed = time.monotonic() - start_wall

    if last_result is None or not last_result.ok:
        _cleanup(is_temp_input, input_path, output_dir)
        error_msg = last_result.error if last_result else "All tools in chain failed"
        log(f"Compression failed: {error_msg}")
        return CompressResponse(
            ok=False,
            request_id=request_id,
            original_size_bytes=original_size,
            tool_chain=tool_chain,
            logs=logs,
            elapsed_seconds=round(elapsed, 3),
            error=error_msg,
        )

    validation = validate_output(input_path, output_path, min_reduction=MIN_REDUCTION_RATIO)

    if not validation["ok"]:
        _cleanup(is_temp_input, input_path, output_dir)
        log(f"Validation failed: {validation['error']}")
        return CompressResponse(
            ok=False,
            request_id=request_id,
            original_size_bytes=original_size,
            tool_chain=tool_chain,
            logs=logs,
            elapsed_seconds=round(elapsed, 3),
            error=validation["error"],
        )

    # ------------------------------------------------------------------
    # 6. Size improvement guard
    # ------------------------------------------------------------------
    compressed_size = validation["compressed_size_bytes"]
    ratio = validation["ratio"]
    reduction_pct = round((1 - ratio) * 100, 2)

    if ratio >= 1.0 - MIN_REDUCTION_RATIO:
        log(f"Compression skipped: only {reduction_pct:.1f}% reduction (threshold {MIN_REDUCTION_RATIO * 100:.0f}%)")
        # Return original path — don't replace with a larger file
        _cleanup(is_temp_input, input_path, output_dir)
        return CompressResponse(
            ok=True,
            request_id=request_id,
            original_size_bytes=original_size,
            compressed_size_bytes=original_size,
            ratio=1.0,
            reduction_pct=0.0,
            page_count=validation.get("page_count", -1),
            tool_chain=tool_chain,
            output_path=str(input_path),
            warnings=[
                f"Compression skipped: improvement ({reduction_pct:.1f}%) below threshold "
                f"({MIN_REDUCTION_RATIO * 100:.0f}%). Original file returned."
            ] + validation.get("warnings", []),
            logs=logs,
            elapsed_seconds=round(elapsed, 3),
        )

    log(
        f"Success — {original_size:,} → {compressed_size:,} bytes "
        f"({reduction_pct:.1f}% reduction, ratio={ratio:.3f})"
    )

    # Clean up temp input (not the output — caller owns that)
    if is_temp_input:
        input_path.unlink(missing_ok=True)

    return CompressResponse(
        ok=True,
        request_id=request_id,
        original_size_bytes=original_size,
        compressed_size_bytes=compressed_size,
        ratio=ratio,
        reduction_pct=reduction_pct,
        page_count=validation.get("page_count", -1),
        tool_chain=tool_chain,
        output_path=str(output_path),
        warnings=validation.get("warnings", []),
        logs=logs,
        elapsed_seconds=round(elapsed, 3),
    )


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _cleanup(is_temp_input: bool, input_path: Path, output_dir: Path) -> None:
    if is_temp_input:
        input_path.unlink(missing_ok=True)
    shutil.rmtree(output_dir, ignore_errors=True)


def _check_import(module: str) -> bool:
    try:
        __import__(module)
        return True
    except ImportError:
        return False


# ---------------------------------------------------------------------------
# Entry point (uvicorn)
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=int(os.environ.get("PORT", "8080")),
        reload=False,
    )
