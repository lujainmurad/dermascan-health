#!/bin/bash
set -e
echo "=== DermaScan Setup ==="
sudo apt-get update -y
sudo apt-get install -y python3.10 python3.10-dev python3.10-venv
if [ ! -d "/workspaces/dermascan-health/backend/venv310" ]; then
  echo "Creating Python 3.10 venv..."
  python3.10 -m venv /workspaces/dermascan-health/backend/venv310
fi
source /workspaces/dermascan-health/backend/venv310/bin/activate
pip install --upgrade pip setuptools wheel -q
pip install numpy==1.26.4 -q
pip install SimpleITK -q
pip install pyradiomics==3.0.1 --no-build-isolation -q
pip install opencv-python-headless==4.8.1.78 tqdm scipy -q
pip install torch==2.2.2 torchvision==0.17.2 --index-url https://download.pytorch.org/whl/cpu -q
pip install fastapi==0.111.0 uvicorn==0.29.0 python-multipart==0.0.9 Pillow==10.3.0 reportlab==4.1.0 -q
cd /workspaces/dermascan-health && npm install --silent
echo "=== Setup complete ==="
