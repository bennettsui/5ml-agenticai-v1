"""
Speaker Diarization Microservice — pyannote-audio 3.x
Exposes: POST /diarize  →  { ok: true, segments: [{speaker, start, end}] }
         GET  /health   →  { ok: true, model_loaded: bool }

Required env:
  HUGGINGFACE_TOKEN — HF token with access to pyannote/speaker-diarization-3.1

Optional env:
  PORT              — HTTP port (default: 8001)
  DIARIZATION_MODEL — HF model ID (default: pyannote/speaker-diarization-3.1)
  DEVICE            — 'cuda' | 'cpu' | 'mps' (default: auto-detect)

Usage:
  pip install -r requirements.txt
  HUGGINGFACE_TOKEN=hf_... python diarization_service.py
"""

import os
import tempfile
import logging
from contextlib import asynccontextmanager

import torch
import uvicorn
from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from pyannote.audio import Pipeline

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)

# ── Global pipeline handle ────────────────────────────────────────────────────
_pipeline: Pipeline | None = None


def _load_pipeline() -> Pipeline:
    hf_token = os.environ.get("HUGGINGFACE_TOKEN")
    if not hf_token:
        raise RuntimeError("HUGGINGFACE_TOKEN env var is required")

    model_id = os.environ.get("DIARIZATION_MODEL", "pyannote/speaker-diarization-3.1")
    log.info(f"Loading pyannote model: {model_id}")

    pipe = Pipeline.from_pretrained(model_id, use_auth_token=hf_token)

    # Auto-select device
    device_str = os.environ.get("DEVICE", "").lower()
    if device_str == "cuda" or (not device_str and torch.cuda.is_available()):
        device = torch.device("cuda")
    elif device_str == "mps" or (not device_str and torch.backends.mps.is_available()):
        device = torch.device("mps")
    else:
        device = torch.device("cpu")

    log.info(f"Moving pipeline to device: {device}")
    pipe = pipe.to(device)
    return pipe


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _pipeline
    try:
        _pipeline = _load_pipeline()
        log.info("Diarization pipeline ready")
    except Exception as e:
        log.error(f"Failed to load pipeline: {e}")
        # Service starts even if model fails to load; /health will report it
    yield


app = FastAPI(title="Speaker Diarization Service", lifespan=lifespan)


# ── Health ────────────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {"ok": True, "model_loaded": _pipeline is not None}


# ── Diarize ───────────────────────────────────────────────────────────────────
@app.post("/diarize")
async def diarize(
    file: UploadFile = File(...),
    num_speakers: int | None = Form(default=None),
    min_speakers: int | None = Form(default=None),
    max_speakers: int | None = Form(default=None),
):
    if _pipeline is None:
        raise HTTPException(status_code=503, detail="Diarization model not loaded")

    # Write upload to a temp file (pyannote needs a file path)
    fname = file.filename or "audio.wav"
    suffix = os.path.splitext(fname)[1] or ".wav"
    audio_bytes = await file.read()

    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name

    try:
        params: dict = {}
        if num_speakers is not None:
            params["num_speakers"] = num_speakers
        else:
            if min_speakers is not None:
                params["min_speakers"] = min_speakers
            if max_speakers is not None:
                params["max_speakers"] = max_speakers

        log.info(f"Diarizing {fname} ({len(audio_bytes)/1024:.1f} KB) params={params}")
        diarization = _pipeline(tmp_path, **params)

        segments = [
            {
                "speaker": speaker,
                "start": round(turn.start, 3),
                "end": round(turn.end, 3),
            }
            for turn, _, speaker in diarization.itertracks(yield_label=True)
        ]

        speaker_ids = sorted({s["speaker"] for s in segments})
        log.info(f"Diarization done: {len(segments)} turns, {len(speaker_ids)} speakers: {speaker_ids}")

        return {"ok": True, "segments": segments, "num_speakers": len(speaker_ids)}

    except Exception as e:
        log.error(f"Diarization error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass


# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8001))
    uvicorn.run("diarization_service:app", host="0.0.0.0", port=port, log_level="info")
