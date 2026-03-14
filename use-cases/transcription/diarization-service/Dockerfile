FROM python:3.11-slim

# ffmpeg for audio format handling (pyannote may need it)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY diarization_service.py .

ENV PORT=8001
EXPOSE 8001

CMD ["python", "diarization_service.py"]
