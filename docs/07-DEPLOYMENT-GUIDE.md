# TASQ-ONE — Complete Deployment Guide (Render, Docker, Cloudflare)

This guide provides step-by-step instructions for deploying **TASQ-ONE** on **Render**, running locally or on VPS with **Docker**, and configuring a **Custom Domain via Cloudflare**.

---

## 1. Docker Deployment (Local & Cloud Containers)

### Build the Docker Image
```bash
docker build -t tasq-one:latest .
```

### Run with Docker
```bash
docker run -d \
  -p 3000:3000 \
  --name tasq-one \
  --env-file .env.local \
  tasq-one:latest
```

### Run with Docker Compose
```bash
# 1. Edit .env.local with your real API credentials
# 2. Launch container in background:
docker-compose up -d --build
```
The app will be accessible at `http://localhost:3000` and healthchecked at `http://localhost:3000/api/v1/health`.

---

## 2. Render Deployment (Web Service)

### Method A: Declarative Blueprint (Recommended)
1. Push your code to your GitHub / GitLab repository.
2. Log into [Render Dashboard](https://dashboard.render.com/).
3. Click **New +** ➔ **Blueprint**.
4. Connect your repo — Render will automatically detect [`render.yaml`](file:///c:/Users/Acer/Music/TASQ-ONE/render.yaml).
5. Fill in the required environment variable values (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GROQ_API_KEY`, etc.).
6. Click **Apply Blueprint**. Render will build the Docker container and deploy the app.

### Method B: Manual Web Service Setup
1. In Render, click **New +** ➔ **Web Service**.
2. Select **Docker** as the Environment.
3. Configure:
   - **Branch:** `main`
   - **Dockerfile Path:** `./Dockerfile`
   - **Health Check Path:** `/api/v1/health`
4. Add all environment variables from `.env.local.example`.
5. Click **Create Web Service**.

---

## 3. Cloudflare Custom Domain & DNS Setup

To point your custom domain (e.g., `app.yourdomain.com` or `yourdomain.com`) to Render via Cloudflare:

### Step 1: Add Custom Domain in Render
1. Go to your Render Web Service dashboard ➔ **Settings** ➔ **Custom Domains**.
2. Click **Add Custom Domain** and enter your domain (e.g., `app.yourdomain.com`).
3. Render will provide you with a CNAME target: `tasq-one.onrender.com` (or an IP address for apex domains).

### Step 2: Configure Cloudflare DNS
1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/) and select your domain.
2. Go to **DNS** ➔ **Records**.
3. Add the following record:
   - **Type:** `CNAME`
   - **Name:** `app` (or `@` for root domain)
   - **Target:** `tasq-one.onrender.com` (your Render service URL)
   - **Proxy Status:** **Proxied (Orange Cloud)** (enables Cloudflare CDN, DDoS protection, edge caching, and free SSL).
   - **TTL:** Auto

### Step 3: Configure Cloudflare SSL/TLS Settings
1. In Cloudflare, navigate to **SSL/TLS** ➔ **Overview**.
2. Set SSL/TLS encryption mode to **Full (Strict)**.
3. Under **SSL/TLS** ➔ **Edge Certificates**:
   - Enable **Always Use HTTPS**.
   - Enable **Automatic HTTPS Rewrites**.
   - Set **Minimum TLS Version** to `TLS 1.2` or `TLS 1.3`.

### Step 4: Update App URL
1. Update `NEXT_PUBLIC_APP_URL` in your Render Environment Variables to your custom domain:
   ```env
   NEXT_PUBLIC_APP_URL=https://app.yourdomain.com
   ```
2. Re-deploy. Your TASQ-ONE instance is now live with global edge caching and free SSL!

---

## 4. Verification & Health Monitoring

Once deployed:
1. **Health Check:** `https://app.yourdomain.com/api/v1/health` (returns `{"status":"ok"}`).
2. **Realtime WebSocket:** Verify Kanban cards update across browser tabs in real time.
3. **PWA Install:** Visit on mobile/Chrome to test the install prompt banner.
