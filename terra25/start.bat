@echo off
REM Terra25 Startup Script for Windows
REM This script sets up the development environment and starts all services

echo 🚀 Starting Terra25 Development Environment
echo ==========================================

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running. Please start Docker Desktop and try again.
    pause
    exit /b 1
)

REM Check if .env file exists
if not exist ".env" (
    echo 📝 Creating .env file from template...
    copy .env.example .env
    echo ⚠️  Please edit .env file with your NASA Earthdata credentials:
    echo    EARTHDATA_USERNAME=your_username
    echo    EARTHDATA_PASSWORD=your_password
    echo.
    pause
)

REM Build and start services
echo 🏗️  Building Docker images...
docker-compose build

echo 🎯 Starting services...
docker-compose up -d

REM Wait for services to be ready
echo ⏳ Waiting for services to start...
timeout /t 10 /nobreak >nul

echo 🔍 Checking service health...

REM Check services
curl -f http://localhost:3000 >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Web service is starting up...
) else (
    echo ✅ Web service is running at http://localhost:3000
)

curl -f http://localhost:3001/health >nul 2>&1
if errorlevel 1 (
    echo ⚠️  API service is starting up...
) else (
    echo ✅ API service is running at http://localhost:3001
)

curl -f http://localhost:9000/minio/health/live >nul 2>&1
if errorlevel 1 (
    echo ⚠️  MinIO is starting up...
) else (
    echo ✅ MinIO is running at http://localhost:9000
)

echo.
echo 🎉 Terra25 Development Environment Started!
echo ==========================================
echo 📱 Web Application: http://localhost:3000
echo 🔌 API Server: http://localhost:3001
echo 💾 MinIO Console: http://localhost:9001
echo 📊 Database: postgresql://terra25:terra25secret@localhost:5432/terra25
echo 🔄 Redis: redis://localhost:6379
echo.
echo 📖 View logs: docker-compose logs -f
echo 🛑 Stop services: docker-compose down
echo 🔧 Rebuild: docker-compose up --build
echo.
pause