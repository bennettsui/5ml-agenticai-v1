# ============================================================
# PDF Compression Service — Dockerfile
# ============================================================
# Build:   docker build -t pdf-compression-service .
# Run:     docker run -p 8080:8080 pdf-compression-service
# ============================================================

FROM python:3.11-slim AS base

# System packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    ghostscript \
    qpdf \
    wget \
    curl \
    ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# ----------------------------------------------------------------
# pdfsizeopt (optional — provides lossless optimiser)
# Comment out this block if you do not need lossless compression.
# ----------------------------------------------------------------
RUN wget -q \
    https://github.com/pts/pdfsizeopt/releases/download/2023-02-07/pdfsizeopt_libexec_extrasmall_linux.tar.gz \
    -O /tmp/pdfsizeopt.tar.gz \
  && mkdir -p /opt/pdfsizeopt \
  && tar -xzf /tmp/pdfsizeopt.tar.gz -C /opt/pdfsizeopt \
  && rm /tmp/pdfsizeopt.tar.gz \
  || echo "WARNING: pdfsizeopt download failed — lossless adapter will not be available"

RUN wget -q \
    https://github.com/pts/pdfsizeopt/releases/download/2023-02-07/pdfsizeopt.single \
    -O /usr/local/bin/pdfsizeopt \
  && chmod +x /usr/local/bin/pdfsizeopt \
  || echo "WARNING: pdfsizeopt binary download failed"

# ----------------------------------------------------------------
# Python app
# ----------------------------------------------------------------
WORKDIR /app

COPY service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY service/ ./service/

# ----------------------------------------------------------------
# Environment defaults (override via docker run -e or compose env)
# ----------------------------------------------------------------
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8080 \
    TEMP_DIR=/tmp/pdf_compress \
    GHOSTSCRIPT_BIN=gs \
    PDFSIZEOPT_BIN=pdfsizeopt \
    MIN_REDUCTION_RATIO=0.05 \
    PAPERWEIGHT_URL=""

RUN mkdir -p /tmp/pdf_compress

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

CMD ["uvicorn", "service.app:app", "--host", "0.0.0.0", "--port", "8080", "--workers", "2"]
