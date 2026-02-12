# Voice Conversion Service

Real-time voice conversion using **RVC** (Retrieval-based Voice Conversion) and **so-vits-svc**.

## Features

- **RVC**: Fast, real-time voice conversion with low latency
- **so-vits-svc**: High-quality voice synthesis (higher latency)
- WebSocket support for streaming audio
- REST API for batch conversion
- Model management (upload/list)

## Quick Start

### 1. Install Dependencies

```bash
cd voice-conversion
pip install -r requirements.txt
```

### 2. Set Up Models

```bash
python setup_models.py
```

This creates the model directories and downloads required base models.

### 3. Start the Server

```bash
python server.py
```

The server runs at `http://localhost:8765`

### Using Docker

```bash
cd voice-conversion
docker-compose up -d
```

## API Endpoints

### Health Check
```
GET /
```
Returns service status and available converters.

### List Models
```
GET /models
```
Returns available voice models for RVC and so-vits-svc.

### Convert Audio (REST)
```
POST /convert
Content-Type: multipart/form-data

- audio: Audio file (wav, mp3, etc.)
- converter: "rvc" or "sovits"
- model: Model name (default: "default")
- pitch_shift: Semitones (-12 to 12)
- index_rate: RVC index rate (0.0 to 1.0)
```

### Real-time Conversion (WebSocket)
```
ws://localhost:8765/ws/convert
```

Protocol:
1. Connect to WebSocket
2. Send JSON config: `{"converter": "rvc", "model": "default", "pitch_shift": 0}`
3. Send audio chunks as binary (PCM16, mono, 44100Hz)
4. Receive converted audio chunks

### Upload Model
```
POST /models/upload
Content-Type: multipart/form-data

- model_file: .pth file
- converter: "rvc" or "sovits"
- model_name: Name for the model
- index_file: (optional) .index file for RVC
```

## Adding Voice Models

### RVC Models

1. Train a model using [RVC WebUI](https://github.com/RVC-Project/Retrieval-based-Voice-Conversion-WebUI)
2. Create folder: `models/rvc/<model_name>/`
3. Add files:
   - `<model_name>.pth` - Model weights
   - `<model_name>.index` - Feature index (optional but recommended)

### so-vits-svc Models

1. Train using [so-vits-svc](https://github.com/svc-develop-team/so-vits-svc)
2. Create folder: `models/sovits/<model_name>/`
3. Add files:
   - `G_<steps>.pth` - Generator model
   - `config.json` - Model config

## Character Presets

The fictional character page includes presets with recommended pitch shifts:

| Character | Pitch Shift | Description |
|-----------|-------------|-------------|
| 老花生叔 | -3 | Lower pitch for middle-aged male voice |
| 新聞主播 | 0 | Neutral pitch |
| アニメキャラ | +4 | Higher pitch for anime character |

## Frontend Integration

The voice conversion service integrates with the Live Fictional Character page:

1. Start the voice conversion server
2. Open `/use-cases/fictional-character`
3. Select "Audio → Audio" mode
4. Choose converter (RVC or so-vits-svc)
5. Adjust pitch shift and index rate
6. Click "Start Voice Conversion"

## Environment Variables

```env
# Frontend (.env.local)
NEXT_PUBLIC_VOICE_CONVERSION_URL=http://localhost:8765
```

## GPU Support

For GPU acceleration, install PyTorch with CUDA:

```bash
pip install torch torchaudio --index-url https://download.pytorch.org/whl/cu118
```

Update `docker-compose.yml` to enable GPU:
```yaml
deploy:
  resources:
    reservations:
      devices:
        - driver: nvidia
          count: 1
          capabilities: [gpu]
```

## Troubleshooting

### "Voice service not connected"
- Check if the server is running: `python server.py`
- Verify the URL in `.env.local`

### High latency
- Use RVC instead of so-vits-svc for real-time
- Reduce audio buffer size
- Use GPU acceleration

### Poor voice quality
- Train a custom model with more data
- Adjust index_rate (higher = more original voice characteristics)
- Use so-vits-svc for offline/non-real-time conversion

## Related Resources

- [RVC WebUI](https://github.com/RVC-Project/Retrieval-based-Voice-Conversion-WebUI)
- [so-vits-svc](https://github.com/svc-develop-team/so-vits-svc)
- [so-vits-svc-fork](https://github.com/voicepaw/so-vits-svc-fork)
