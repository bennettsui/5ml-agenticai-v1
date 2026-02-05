#!/bin/bash
# ============================================================
#  EC2 GPU Instance Setup Script
#  Run on a fresh g4dn.xlarge (or g5.xlarge) with Ubuntu 22.04
#
#  Usage:
#    1. Launch EC2 with:
#       - AMI: Deep Learning Base OSS Nvidia Driver GPU AMI (Ubuntu 22.04)
#         OR: Ubuntu 22.04 LTS
#       - Instance type: g4dn.xlarge (1x T4 16GB, cheapest GPU)
#       - Storage: 100GB gp3
#       - Security group: allow TCP 8765 (AI server) + 22 (SSH)
#
#    2. SSH in and run:
#       chmod +x ec2-setup.sh && ./ec2-setup.sh
# ============================================================

set -e

echo "============================================"
echo "  AI Character Server - EC2 Setup"
echo "============================================"

# --- NVIDIA Driver (skip if using Deep Learning AMI) ---
if ! command -v nvidia-smi &> /dev/null; then
    echo "Installing NVIDIA drivers..."
    sudo apt-get update
    sudo apt-get install -y nvidia-driver-535
    echo "⚠ NVIDIA driver installed. REBOOT REQUIRED!"
    echo "  Run: sudo reboot"
    echo "  Then re-run this script."
    exit 1
fi

echo "GPU detected:"
nvidia-smi --query-gpu=name,memory.total --format=csv,noheader

# --- System packages ---
echo ""
echo "Installing system packages..."
sudo apt-get update
sudo apt-get install -y \
    python3 python3-pip python3-venv \
    libgl1-mesa-glx libglib2.0-0 \
    wget curl git ffmpeg

# --- Python virtual environment ---
echo ""
echo "Setting up Python environment..."
python3 -m venv /opt/ai-server-venv
source /opt/ai-server-venv/bin/activate

# --- Install PyTorch with CUDA ---
echo ""
echo "Installing PyTorch with CUDA..."
pip install torch torchaudio --index-url https://download.pytorch.org/whl/cu121

# --- Install other dependencies ---
echo ""
echo "Installing dependencies..."
pip install -r requirements.txt

# --- Download InsightFace models ---
echo ""
echo "Downloading face swap model..."
mkdir -p models/faces models/voices

# Download inswapper_128.onnx
if [ ! -f models/inswapper_128.onnx ]; then
    echo "Downloading inswapper_128.onnx..."
    wget -O models/inswapper_128.onnx \
        "https://huggingface.co/deepinsight/inswapper/resolve/main/inswapper_128.onnx"
fi

# --- Run model setup ---
echo ""
python3 setup_models.py

# --- Create systemd service ---
echo ""
echo "Creating systemd service..."
sudo tee /etc/systemd/system/ai-character-server.service > /dev/null <<UNIT
[Unit]
Description=AI Character Server
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)
Environment=PATH=/opt/ai-server-venv/bin:/usr/bin
ExecStart=/opt/ai-server-venv/bin/python3 server.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
UNIT

sudo systemctl daemon-reload
sudo systemctl enable ai-character-server

echo ""
echo "============================================"
echo "  Setup complete!"
echo ""
echo "  Next steps:"
echo "    1. Add reference face images:"
echo "       scp uncle-peanut.jpg user@<EC2-IP>:$(pwd)/models/faces/"
echo "       scp news-anchor.jpg  user@<EC2-IP>:$(pwd)/models/faces/"
echo ""
echo "    2. (Optional) Add trained RVC voice models:"
echo "       scp uncle-peanut.pth user@<EC2-IP>:$(pwd)/models/voices/"
echo ""
echo "    3. Start the server:"
echo "       sudo systemctl start ai-character-server"
echo "       OR: python3 server.py"
echo ""
echo "    4. Test:"
echo "       curl http://localhost:8765/"
echo ""
echo "    5. Set AI_SERVER_URL in frontend:"
echo "       ws://<EC2-PUBLIC-IP>:8765/ws/stream"
echo "============================================"
