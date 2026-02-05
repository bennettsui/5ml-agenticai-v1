"""
AI Character Server - Face Swap + Voice Cloning
Runs on EC2 with GPU (g4dn.xlarge or better)

Architecture:
  Browser --WebSocket--> This Server
    - Receives video frames (base64 JPEG)
    - Receives audio chunks (raw PCM)
    - Returns face-swapped frames + voice-converted audio
"""

import asyncio
import base64
import io
import json
import logging
import os
import time
from typing import Optional

import cv2
import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="AI Character Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Global model holders ───────────────────────────────────────────
face_analyser = None
face_swapper = None
rvc_models = {}

CHARACTERS = {
    "uncle-peanut": {
        "name": "老花生叔",
        "face_image": "models/faces/uncle-peanut.jpg",
        "voice_model": "models/voices/uncle-peanut.pth",
        "description": "Hong Kong street uncle",
    },
    "news-anchor": {
        "name": "新聞主播",
        "face_image": "models/faces/news-anchor.jpg",
        "voice_model": "models/voices/news-anchor.pth",
        "description": "Professional TV anchor woman",
    },
    "anime-girl": {
        "name": "アニメキャラ",
        "face_image": "models/faces/anime-girl.jpg",
        "voice_model": "models/voices/anime-girl.pth",
        "description": "Anime-style character",
    },
}

# Cached reference face embeddings per character
reference_faces = {}


# ─── Model Loading ──────────────────────────────────────────────────
def load_face_models():
    """Load InsightFace models for face detection and swapping."""
    global face_analyser, face_swapper

    try:
        import insightface
        from insightface.app import FaceAnalysis

        logger.info("Loading InsightFace models...")
        face_analyser = FaceAnalysis(
            name="buffalo_l",
            root="models",
            providers=["CUDAExecutionProvider", "CPUExecutionProvider"],
        )
        face_analyser.prepare(ctx_id=0, det_size=(640, 640))

        # Load inswapper model
        model_path = "models/inswapper_128.onnx"
        if os.path.exists(model_path):
            face_swapper = insightface.model_zoo.get_model(
                model_path,
                providers=["CUDAExecutionProvider", "CPUExecutionProvider"],
            )
            logger.info("Face swapper loaded successfully")
        else:
            logger.warning(
                f"Face swap model not found at {model_path}. "
                "Run setup_models.py to download it."
            )

        # Pre-load reference faces for each character
        for char_id, char_info in CHARACTERS.items():
            face_path = char_info["face_image"]
            if os.path.exists(face_path):
                img = cv2.imread(face_path)
                faces = face_analyser.get(img)
                if faces:
                    reference_faces[char_id] = faces[0]
                    logger.info(f"Loaded reference face for {char_id}")
                else:
                    logger.warning(f"No face detected in {face_path}")
            else:
                logger.warning(f"Reference image not found: {face_path}")

    except ImportError:
        logger.error(
            "InsightFace not installed. Install with: pip install insightface"
        )
    except Exception as e:
        logger.error(f"Failed to load face models: {e}")


def load_rvc_models():
    """Load RVC voice conversion models."""
    global rvc_models

    try:
        from rvc_converter import RVCConverter

        for char_id, char_info in CHARACTERS.items():
            model_path = char_info["voice_model"]
            if os.path.exists(model_path):
                converter = RVCConverter(model_path)
                rvc_models[char_id] = converter
                logger.info(f"Loaded RVC model for {char_id}")
            else:
                logger.warning(f"Voice model not found: {model_path}")

    except ImportError:
        logger.warning("RVC not available, voice conversion disabled")
    except Exception as e:
        logger.error(f"Failed to load RVC models: {e}")


# ─── Face Swap Processing ──────────────────────────────────────────
def swap_face(frame: np.ndarray, character_id: str) -> np.ndarray:
    """Swap the face in the frame with the character's reference face."""
    if not face_analyser or not face_swapper:
        return frame

    ref_face = reference_faces.get(character_id)
    if ref_face is None:
        return frame

    try:
        # Detect faces in the input frame
        faces = face_analyser.get(frame)
        if not faces:
            return frame

        # Swap the largest face
        source_face = max(faces, key=lambda f: (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1]))
        result = face_swapper.get(frame, source_face, ref_face, paste_back=True)
        return result

    except Exception as e:
        logger.error(f"Face swap error: {e}")
        return frame


# ─── Voice Conversion Processing ───────────────────────────────────
def convert_voice(audio_data: bytes, character_id: str, sample_rate: int = 16000) -> bytes:
    """Convert voice audio using RVC model for the character."""
    converter = rvc_models.get(character_id)
    if not converter:
        return audio_data

    try:
        # Convert bytes to numpy array
        audio_np = np.frombuffer(audio_data, dtype=np.float32)
        # Run RVC conversion
        converted = converter.convert(audio_np, sample_rate)
        return converted.tobytes()
    except Exception as e:
        logger.error(f"Voice conversion error: {e}")
        return audio_data


# ─── API Endpoints ──────────────────────────────────────────────────
@app.get("/")
async def health():
    return {
        "status": "ok",
        "face_swap": face_swapper is not None,
        "face_analyser": face_analyser is not None,
        "voice_models": list(rvc_models.keys()),
        "characters": list(CHARACTERS.keys()),
        "reference_faces": list(reference_faces.keys()),
    }


@app.get("/characters")
async def get_characters():
    """List available characters and their capabilities."""
    result = {}
    for char_id, char_info in CHARACTERS.items():
        result[char_id] = {
            "name": char_info["name"],
            "description": char_info["description"],
            "face_swap_ready": char_id in reference_faces,
            "voice_clone_ready": char_id in rvc_models,
        }
    return result


@app.post("/swap-face")
async def swap_face_endpoint(data: dict):
    """REST endpoint for single frame face swap (for testing)."""
    character_id = data.get("character_id", "uncle-peanut")
    image_b64 = data.get("image", "")

    if not image_b64:
        return JSONResponse({"error": "No image provided"}, status_code=400)

    # Decode base64 image
    img_bytes = base64.b64decode(image_b64)
    nparr = np.frombuffer(img_bytes, np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    # Swap face
    result = swap_face(frame, character_id)

    # Encode back to base64 JPEG
    _, buffer = cv2.imencode(".jpg", result, [cv2.IMWRITE_JPEG_QUALITY, 85])
    result_b64 = base64.b64encode(buffer).decode("utf-8")

    return {"image": result_b64}


# ─── WebSocket for Real-time Streaming ──────────────────────────────
@app.websocket("/ws/stream")
async def websocket_stream(websocket: WebSocket):
    """
    Real-time face swap + voice conversion via WebSocket.

    Client sends JSON messages:
    {
        "type": "video_frame",
        "character_id": "uncle-peanut",
        "image": "<base64 JPEG>"
    }
    or
    {
        "type": "audio_chunk",
        "character_id": "uncle-peanut",
        "audio": "<base64 PCM float32>",
        "sample_rate": 16000
    }

    Server responds:
    {
        "type": "video_frame",
        "image": "<base64 JPEG>"
    }
    or
    {
        "type": "audio_chunk",
        "audio": "<base64 PCM float32>"
    }
    """
    await websocket.accept()
    logger.info("WebSocket client connected")

    frame_count = 0
    start_time = time.time()

    try:
        while True:
            data = await websocket.receive_text()
            msg = json.loads(data)
            msg_type = msg.get("type", "")
            character_id = msg.get("character_id", "uncle-peanut")

            if msg_type == "video_frame":
                # Decode frame
                img_bytes = base64.b64decode(msg["image"])
                nparr = np.frombuffer(img_bytes, np.uint8)
                frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

                if frame is not None:
                    # Swap face
                    result = swap_face(frame, character_id)

                    # Encode result
                    _, buffer = cv2.imencode(
                        ".jpg", result, [cv2.IMWRITE_JPEG_QUALITY, 80]
                    )
                    result_b64 = base64.b64encode(buffer).decode("utf-8")

                    await websocket.send_text(
                        json.dumps({"type": "video_frame", "image": result_b64})
                    )

                    frame_count += 1
                    if frame_count % 30 == 0:
                        elapsed = time.time() - start_time
                        fps = frame_count / elapsed
                        logger.info(f"Processing at {fps:.1f} FPS")

            elif msg_type == "audio_chunk":
                audio_bytes = base64.b64decode(msg["audio"])
                sample_rate = msg.get("sample_rate", 16000)

                converted = convert_voice(audio_bytes, character_id, sample_rate)
                result_b64 = base64.b64encode(converted).decode("utf-8")

                await websocket.send_text(
                    json.dumps({"type": "audio_chunk", "audio": result_b64})
                )

            elif msg_type == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))

    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")


# ─── Startup ────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup():
    logger.info("Starting AI Character Server...")
    load_face_models()
    load_rvc_models()
    logger.info("Server ready!")


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 8765))
    uvicorn.run(app, host="0.0.0.0", port=port)
