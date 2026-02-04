"""
Voice Conversion Server
Provides real-time voice conversion using RVC and so-vits-svc
"""

import os
import io
import asyncio
import logging
from typing import Optional
from pathlib import Path

from fastapi import FastAPI, File, UploadFile, Form, HTTPException, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
import numpy as np
import soundfile as sf

from rvc_converter import RVCConverter
from sovits_converter import SoVitsSVCConverter

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Voice Conversion API",
    description="Real-time voice conversion using RVC and so-vits-svc",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global converters
rvc_converter: Optional[RVCConverter] = None
sovits_converter: Optional[SoVitsSVCConverter] = None

# Models directory
MODELS_DIR = Path(__file__).parent / "models"
MODELS_DIR.mkdir(exist_ok=True)


@app.on_event("startup")
async def startup_event():
    """Initialize converters on startup"""
    global rvc_converter, sovits_converter

    logger.info("Initializing voice converters...")

    try:
        rvc_converter = RVCConverter(models_dir=MODELS_DIR / "rvc")
        logger.info("RVC converter initialized")
    except Exception as e:
        logger.warning(f"Failed to initialize RVC: {e}")
        rvc_converter = None

    try:
        sovits_converter = SoVitsSVCConverter(models_dir=MODELS_DIR / "sovits")
        logger.info("so-vits-svc converter initialized")
    except Exception as e:
        logger.warning(f"Failed to initialize so-vits-svc: {e}")
        sovits_converter = None


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "ok",
        "service": "voice-conversion",
        "converters": {
            "rvc": rvc_converter is not None,
            "sovits": sovits_converter is not None
        }
    }


@app.get("/models")
async def list_models():
    """List available voice models"""
    models = {
        "rvc": [],
        "sovits": []
    }

    if rvc_converter:
        models["rvc"] = rvc_converter.list_models()

    if sovits_converter:
        models["sovits"] = sovits_converter.list_models()

    return models


@app.post("/convert")
async def convert_voice(
    audio: UploadFile = File(...),
    converter: str = Form("rvc"),
    model: str = Form("default"),
    pitch_shift: int = Form(0),
    index_rate: float = Form(0.75),
):
    """
    Convert voice from uploaded audio file

    Args:
        audio: Audio file (wav, mp3, etc.)
        converter: Converter to use ("rvc" or "sovits")
        model: Model name to use
        pitch_shift: Pitch shift in semitones (-12 to 12)
        index_rate: RVC index rate (0.0 to 1.0)

    Returns:
        Converted audio as WAV file
    """
    try:
        # Read audio data
        audio_bytes = await audio.read()

        # Select converter
        if converter == "rvc":
            if not rvc_converter:
                raise HTTPException(status_code=503, detail="RVC converter not available")

            result = await rvc_converter.convert(
                audio_bytes=audio_bytes,
                model_name=model,
                pitch_shift=pitch_shift,
                index_rate=index_rate
            )
        elif converter == "sovits":
            if not sovits_converter:
                raise HTTPException(status_code=503, detail="so-vits-svc converter not available")

            result = await sovits_converter.convert(
                audio_bytes=audio_bytes,
                model_name=model,
                pitch_shift=pitch_shift
            )
        else:
            raise HTTPException(status_code=400, detail=f"Unknown converter: {converter}")

        # Return as streaming response
        return StreamingResponse(
            io.BytesIO(result),
            media_type="audio/wav",
            headers={"Content-Disposition": "attachment; filename=converted.wav"}
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Conversion error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.websocket("/ws/convert")
async def websocket_convert(websocket: WebSocket):
    """
    Real-time voice conversion via WebSocket

    Protocol:
    1. Client sends JSON config: {"converter": "rvc", "model": "default", "pitch_shift": 0}
    2. Client sends audio chunks as binary
    3. Server responds with converted audio chunks as binary
    """
    await websocket.accept()

    config = {
        "converter": "rvc",
        "model": "default",
        "pitch_shift": 0,
        "index_rate": 0.75
    }

    try:
        # Receive initial config
        config_msg = await websocket.receive_json()
        config.update(config_msg)
        logger.info(f"WebSocket config: {config}")

        await websocket.send_json({"status": "ready", "config": config})

        # Select converter
        converter = rvc_converter if config["converter"] == "rvc" else sovits_converter
        if not converter:
            await websocket.send_json({"error": f"{config['converter']} not available"})
            await websocket.close()
            return

        # Audio buffer for accumulating chunks
        audio_buffer = io.BytesIO()

        while True:
            # Receive audio chunk
            data = await websocket.receive_bytes()

            if len(data) == 0:
                continue

            # Process chunk
            try:
                if config["converter"] == "rvc":
                    result = await rvc_converter.convert_chunk(
                        audio_chunk=data,
                        model_name=config["model"],
                        pitch_shift=config["pitch_shift"],
                        index_rate=config["index_rate"]
                    )
                else:
                    result = await sovits_converter.convert_chunk(
                        audio_chunk=data,
                        model_name=config["model"],
                        pitch_shift=config["pitch_shift"]
                    )

                # Send converted audio
                await websocket.send_bytes(result)

            except Exception as e:
                logger.error(f"Chunk conversion error: {e}")
                await websocket.send_json({"error": str(e)})

    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        await websocket.close()


@app.post("/models/upload")
async def upload_model(
    model_file: UploadFile = File(...),
    converter: str = Form("rvc"),
    model_name: str = Form(...),
    index_file: Optional[UploadFile] = File(None),
):
    """
    Upload a voice model

    Args:
        model_file: Model file (.pth for RVC, .pth for so-vits-svc)
        converter: Target converter ("rvc" or "sovits")
        model_name: Name for the model
        index_file: Optional index file for RVC (.index)
    """
    try:
        if converter == "rvc":
            model_dir = MODELS_DIR / "rvc" / model_name
        else:
            model_dir = MODELS_DIR / "sovits" / model_name

        model_dir.mkdir(parents=True, exist_ok=True)

        # Save model file
        model_path = model_dir / f"{model_name}.pth"
        with open(model_path, "wb") as f:
            f.write(await model_file.read())

        # Save index file if provided (RVC)
        if index_file and converter == "rvc":
            index_path = model_dir / f"{model_name}.index"
            with open(index_path, "wb") as f:
                f.write(await index_file.read())

        return {"status": "success", "model_name": model_name, "converter": converter}

    except Exception as e:
        logger.error(f"Model upload error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8765)
