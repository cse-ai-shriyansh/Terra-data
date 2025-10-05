#!/bin/bash

# Terra25 Startup Script
# This script sets up the development environment and starts all services

set -e

echo "🚀 Starting Terra25 Development Environment"
echo "=========================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your NASA Earthdata credentials:"
    echo "   EARTHDATA_USERNAME=your_username"
    echo "   EARTHDATA_PASSWORD=your_password"
    echo ""
    read -p "Press Enter after configuring .env file..."
fi

# Build and start services
echo "🏗️  Building Docker images..."
docker-compose build

echo "🎯 Starting services..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check service health
echo "🔍 Checking service health..."

# Check web service
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Web service is running at http://localhost:3000"
else
    echo "⚠️  Web service is starting up..."
fi

# Check API service
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ API service is running at http://localhost:3001"
else
    echo "⚠️  API service is starting up..."
fi

# Check MinIO
if curl -f http://localhost:9000/minio/health/live > /dev/null 2>&1; then
    echo "✅ MinIO is running at http://localhost:9000"
else
    echo "⚠️  MinIO is starting up..."
fi

echo ""
echo "🎉 Terra25 Development Environment Started!"
echo "=========================================="
echo "📱 Web Application: http://localhost:3000"
echo "🔌 API Server: http://localhost:3001"
echo "💾 MinIO Console: http://localhost:9001"
echo "📊 Database: postgresql://terra25:terra25secret@localhost:5432/terra25"
echo "🔄 Redis: redis://localhost:6379"
echo ""
echo "📖 View logs: docker-compose logs -f"
echo "🛑 Stop services: docker-compose down"
echo "🔧 Rebuild: docker-compose up --build"
echo ""