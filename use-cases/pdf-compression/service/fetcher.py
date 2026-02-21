"""
Source Fetcher
--------------
Resolves the 'source' field from the compress request into a local Path.
Supports:
  - local absolute paths  (/tmp/file.pdf)
  - http(s):// URLs       (downloaded to temp dir)
  - s3://...              (stubbed — implement with boto3 when needed)
"""

from __future__ import annotations

import logging
import os
import tempfile
import urllib.request
from pathlib import Path

logger = logging.getLogger("pdf_compression.fetcher")

TEMP_DIR = Path(os.environ.get("TEMP_DIR", tempfile.gettempdir()))


def resolve(source: str) -> tuple[Path, bool]:
    """
    Resolve the source string to a local Path.

    Returns (path, is_temporary) — if is_temporary is True, the caller
    should delete the file when done.
    """
    if source.startswith("s3://"):
        return _fetch_s3(source)

    if source.startswith("http://") or source.startswith("https://"):
        return _fetch_http(source)

    # Local path
    local = Path(source)
    if not local.exists():
        raise FileNotFoundError(f"Local file not found: {source}")
    if not local.is_file():
        raise ValueError(f"Source is not a file: {source}")
    return local, False


def _fetch_http(url: str) -> tuple[Path, bool]:
    """Download a PDF from an HTTP(S) URL into the temp directory."""
    logger.info("Fetching PDF from URL: %s", url)
    suffix = Path(url.split("?")[0]).suffix or ".pdf"
    tmp = TEMP_DIR / f"pdf_src_{os.urandom(8).hex()}{suffix}"

    try:
        urllib.request.urlretrieve(url, str(tmp))
    except Exception as exc:
        if tmp.exists():
            tmp.unlink(missing_ok=True)
        raise RuntimeError(f"Failed to download {url}: {exc}") from exc

    logger.info("Downloaded %d bytes to %s", tmp.stat().st_size, tmp)
    return tmp, True


def _fetch_s3(s3_uri: str) -> tuple[Path, bool]:
    """
    Stub for S3 fetching. Enable by installing boto3 and removing the stub.
    """
    # Real implementation:
    #   import boto3
    #   s3 = boto3.client("s3")
    #   bucket, key = s3_uri[5:].split("/", 1)
    #   tmp = TEMP_DIR / f"pdf_src_{os.urandom(8).hex()}.pdf"
    #   s3.download_file(bucket, key, str(tmp))
    #   return tmp, True
    raise NotImplementedError(
        f"S3 fetching is not yet implemented. Install boto3 and "
        f"update fetcher.py to support s3:// URIs. Got: {s3_uri}"
    )
