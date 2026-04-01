#!/bin/bash

echo "=== Complete WebApp Deployment Script ==="
echo "Deploying to port 6015 on $(hostname)"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Install Docker if not present
if ! command_exists docker; then
    echo "📦 Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo systemctl start docker
    sudo systemctl enable docker
    echo "✅ Docker installed and started"
else
    echo "✅ Docker already installed"
fi

# Install docker-compose if not present
if ! command_exists docker-compose; then
    echo "📦 Installing docker-compose..."
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "✅ docker-compose installed"
else
    echo "✅ docker-compose already installed"
fi

# Add user to docker group if not already
if ! groups $USER | grep -q docker; then
    echo "👤 Adding user to docker group..."
    sudo usermod -aG docker $USER
    echo "✅ User added to docker group (may need logout/login)"
fi

# Start Docker daemon if not running
if ! sudo systemctl is-active --quiet docker; then
    echo "🚀 Starting Docker daemon..."
    sudo systemctl start docker
fi

# Apply group changes
echo "🔄 Applying group changes..."
newgrp docker << EOF
cd ~/Webapp

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Build and start containers
echo "🏗️ Building and starting containers..."
docker-compose up -d --build

# Wait for containers to start
echo "⏳ Waiting for containers to start..."
sleep 15

# Check container status
echo "📊 Container status:"
docker ps

# Check if port 6015 is listening
echo "🔍 Checking port 6015..."
if netstat -tln 2>/dev/null | grep -q :6015; then
    echo "✅ SUCCESS: App deployed on port 6015"
    echo "🌐 Access at: http://$(hostname -I | awk '{print $1}'):6015"
    echo "🌐 Or: http://100.127.9.127:6015"
else
    echo "❌ Port 6015 not listening. Checking logs..."
    docker-compose logs
fi

echo "=== Deployment complete ==="
EOF

echo "🎉 Script execution complete!"