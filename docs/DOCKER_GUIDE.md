# 🐳 TASQ-ONE — Docker Deployment Guide

This guide explains how to run TASQ-ONE in a production-ready, multi-stage Docker container.

---

## ⚡ Quick Start (1-Click on Windows)

Double-click `docker-start.bat` in the root folder, or run:

```bash
docker compose up --build -d
```

Your app will be live at:
- **Application URL:** [http://localhost:3000](http://localhost:3000)
- **Health Check:** [http://localhost:3000/api/v1/health](http://localhost:3000/api/v1/health)

---

## 🛠️ Commands Reference

### 1. Build and Start Container in Background
```bash
docker compose up --build -d
```

### 2. View Live Streaming Logs
```bash
docker compose logs -f
```

### 3. Stop Container
```bash
docker compose down
```

### 4. Direct Docker Build (Without Compose)
```bash
# Build image
docker build -t tasq-one:latest .

# Run container
docker run -p 3000:3000 --env-file .env.local tasq-one:latest
```

---

## 🔒 Production Multi-Stage Architecture

The [Dockerfile](file:///c:/Users/Acer/Music/TASQ-ONE/Dockerfile) uses a 3-stage minimal Alpine build:
1. **`deps` stage:** Installs exact dependencies with `npm ci`.
2. **`builder` stage:** Builds Next.js 14 in standalone mode (`output: "standalone"`).
3. **`runner` stage:** Runs as a non-root unprivileged `nextjs:nodejs` user with automated healthcheck (`wget /api/v1/health`). Image size is kept under ~150MB.
