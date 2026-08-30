# 🚀 TASQ-ONE — Render & Cloudflare Docker Deployment Guide

This guide walks you through deploying **TASQ-ONE** on **Render (Docker Web Service)** behind **Cloudflare (DNS, CDN, WAF & SSL)**.

---

## 🏗️ Architecture Overview

```
[User Browser]
      │ (HTTPS / TLS 1.3)
      ▼
[Cloudflare Edge CDN / WAF / DNS Proxy]
      │ (Encrypted Origin Tunnel / HTTPS)
      ▼
[Render Docker Web Service (Next.js 14 Standalone)]
      ├── Port: 3000 (0.0.0.0)
      ├── Healthcheck: /api/v1/health
      │
      ├── [Supabase Cloud (PostgreSQL with RLS)]
      ├── [Groq AI Cloud (Llama 3.3 70B)]
      ├── [Upstash Redis (Rate Limiting)]
      └── [Cloudflare R2 (Object Storage / Attachments)]
```

---

## Part 1: Deploying on Render (Docker Web Service)

### Method A: One-Click Blueprint Deployment (Recommended)
1. Go to your [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** → **Blueprint**.
3. Connect your GitHub repository: `https://github.com/Tusharsinghoffical/Saas-T1`.
4. Render will automatically detect [`render.yaml`](../render.yaml) and configure the Docker Web Service.
5. In the **Environment Variables** prompt, fill in your production secrets (listed below).
6. Click **Apply**. Render will automatically build the multi-stage Docker image and start the container.

---

### Method B: Manual Web Service Setup on Render
If setting up manually without Blueprint:
1. Click **New +** → **Web Service**.
2. Connect repository: `https://github.com/Tusharsinghoffical/Saas-T1`.
3. Configure settings:
   - **Name:** `tasq-one`
   - **Region:** `Singapore` (closest to India) or `Frankfurt` / `Oregon`
   - **Branch:** `main`
   - **Runtime:** `Docker`
   - **Dockerfile Path:** `./Dockerfile`
   - **Docker Context:** `.`
   - **Plan:** `Free` or `Starter` ($7/mo)
4. Under **Advanced Settings**:
   - **Health Check Path:** `/api/v1/health`
5. Click **Create Web Service**.

---

### Required Environment Variables on Render

Set these under **Render Dashboard** → **Your Service** → **Environment**:

| Variable | Sample / Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Production mode |
| `PORT` | `3000` | Internal Next.js port |
| `NEXT_PUBLIC_APP_URL` | `https://tasq-one.onrender.com` *(or your custom domain)* | Canonical public app URL |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xyzcompany.supabase.co` | Supabase Cloud project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOi...` | Supabase Anon client key |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOi...` | Supabase backend service key |
| `GROQ_API_KEY` | `gsk_...` | Groq Cloud AI API key |
| `UPSTASH_REDIS_REST_URL` | `https://...upstash.io` | Upstash Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | `A...` | Upstash Redis REST Token |
| `CLOUDFLARE_R2_ACCESS_KEY_ID` | `r2_access_key` | Cloudflare R2 Access Key |
| `CLOUDFLARE_R2_SECRET_ACCESS_KEY`| `r2_secret_key` | Cloudflare R2 Secret Key |
| `CLOUDFLARE_R2_BUCKET` | `tasq-one-attachments` | R2 bucket name |
| `CLOUDFLARE_R2_ENDPOINT` | `https://<accountid>.r2.cloudflarestorage.com` | R2 S3-compatible API endpoint |
| `RESEND_API_KEY` | `re_...` | Resend email API key |
| `CRON_SECRET` | `generate_random_secret_string` | Bearer token for AI weekly summary cron |
| `NEXT_PUBLIC_ENABLE_BILLING` | `false` | Default `false` for Starter Pilot (₹0 Free) |

---

## Part 2: Cloudflare Setup (Custom Domain, DNS & SSL)

### Step 1: Add Custom Domain to Cloudflare
1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Add your domain (e.g., `tasqone.com`).
3. Update your domain registrar's nameservers to the assigned Cloudflare nameservers.

---

### Step 2: Configure DNS Records to Point to Render
1. In Cloudflare Dashboard, go to **DNS** → **Records**.
2. Add the following records:
   - **Root Domain (`@`):**
     - **Type:** `CNAME`
     - **Name:** `@`
     - **Target:** `tasq-one.onrender.com` (Render service URL)
     - **Proxy status:** 🟠 **Proxied** (Cloudflare CDN + DDoS protection active)
   - **Subdomain (`www`):**
     - **Type:** `CNAME`
     - **Name:** `www`
     - **Target:** `tasq-one.onrender.com`
     - **Proxy status:** 🟠 **Proxied**

---

### Step 3: Configure Cloudflare SSL / TLS Encryption
1. In Cloudflare, go to **SSL/TLS** → **Overview**.
2. Select **Full (strict)** or **Full** encryption mode.
3. Under **SSL/TLS** → **Edge Certificates**:
   - Enable **Always Use HTTPS** (Redirects all HTTP requests to HTTPS).
   - Enable **Automatic HTTPS Rewrites**.
   - Minimum TLS Version: **TLS 1.2** (or TLS 1.3).

---

### Step 4: Link Custom Domain in Render
1. Go to **Render Dashboard** → **tasq-one** service → **Settings** → **Custom Domains**.
2. Add your domain: `tasqone.com` and `www.tasqone.com`.
3. Render will verify the CNAME record and activate TLS certificates automatically.

---

## Part 3: Cloudflare R2 Storage Setup

1. In Cloudflare Dashboard, click **R2** in the left sidebar.
2. Click **Create Bucket** → Name it `tasq-one-attachments` (Region: Asia-Pacific / Automatic).
3. Click **Manage R2 API Tokens** → **Create API Token**.
4. Permissions: **Admin Read & Write**.
5. Copy the **Access Key ID**, **Secret Access Key**, and **Endpoint URL** into Render environment variables.

---

## Part 4: Verification & Health Checks

Once deployed:
1. **Container Health:** Visit `https://yourdomain.com/api/v1/health`  
   Expected JSON response:
   ```json
   {
     "status": "healthy",
     "timestamp": "2026-08-30T...",
     "version": "1.0.0"
   }
   ```
2. **Landing Page:** Open `https://yourdomain.com` in your browser.
3. **PWA Check:** Open Chrome DevTools → Application  → Manifest / Service Worker (status: Activated).

---

## 📬 Need Help?
- **Engineering Support Desk:** [tasqoneworkos@gmail.com](mailto:tasqoneworkos@gmail.com)
- **Repository Issues:** [https://github.com/Tusharsinghoffical/Saas-T1/issues](https://github.com/Tusharsinghoffical/Saas-T1/issues)
