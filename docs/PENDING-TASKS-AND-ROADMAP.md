# 📋 TASQ-ONE — Project Status, Pending Tasks & Production Roadmap

> **Current Status:** v1.0 Core Platform & Landing Page Complete  
> **Deployment Target:** Render (Docker Web Service) + Cloudflare (CDN/R2) + Supabase Cloud (PostgreSQL) + Groq AI  
> **Repository:** [https://github.com/Tusharsinghoffical/Saas-T1](https://github.com/Tusharsinghoffical/Saas-T1)  
> **Last Updated:** August 30, 2026

---

## 📊 Executive Summary Table

| Category | Component | Current Status | Priority | Action / Next Step |
| :--- | :--- | :---: | :---: | :--- |
| **Landing Page & Branding** | Hero, Simulator, ROI Calculator, Mega Footer | ✅ Complete | Done | Fully localized (₹ INR), responsive, healthy |
| **Security Hardening** | PostgreSQL RLS, Rate Limiting, RBAC Guards | ✅ Complete | Done | All audit issues & privilege escalation patched |
| **Docker & Containerization**| Standalone Multi-stage Dockerfile & Compose | ✅ Complete | Done | `node:22-alpine` build verified and passing |
| **CI/CD Pipeline** | GitHub Actions (`deploy.yml`, `pr-check.yml`) | ✅ Complete | Done | Vercel removed; Node 22 + Docker validation active |
| **Render Blueprint** | `render.yaml` & Deployment Configuration | ✅ Complete | Done | Docker runtime, port 3000, healthcheck mapped |
| **Cloud Database Sync** | Supabase PostgreSQL Migrations | ✅ Complete | Done | All 8 migrations applied; Status 200 OK |
| **Production Secrets** | Render Dashboard Environment Variables | ⏳ Pending | **HIGH** | Add Supabase, Groq, Upstash, Resend keys in Render |
| **Custom Domain & SSL** | Cloudflare CNAME Proxy Setup | ⏳ Pending | **MEDIUM** | If custom domain purchased, point CNAME to Render |
| **WhatsApp Enterprise** | Gupshup / MSG91 API Integration | ⏳ Pending | **LOW** | Optional: Connect live WhatsApp messaging gateway |
| **Payment Gateway** | Razorpay / Stripe for Pro (₹999) & Enterprise (₹2,499) | ⏸️ **DEFERRED** | **SKIP** | Currently skipped; ₹0 Free Starter Pilot is active |

---

## 1. 🗄️ Database & Supabase Cloud Sync (Completed ✅)

- [x] **Run SQL Migrations on Live Supabase Dashboard:**
  - [x] `supabase/migrations/0001_init.sql` (Organizations, users, tasks, audit_logs, attachments, comments)
  - [x] `supabase/migrations/0002_rls.sql` (Multi-tenant Row-Level Security isolation)
  - [x] `supabase/migrations/0003_auth_hook.sql` (Custom JWT claims & session syncing)
  - [x] `supabase/migrations/0004_signup_rpc.sql` (Atomic signup & organization creation RPC)
  - [x] `supabase/migrations/0005_notifications.sql` (Notification dispatch tables)
  - [x] `supabase/migrations/0006_slack_integration.sql` (Slack webhook settings)
  - [x] `supabase/migrations/0007_billing_scaffolding.sql` (Billing tiers schema)
  - [x] `supabase/migrations/0008_fix_privilege_escalation.sql` (Strict admin-only role updates)
- [x] **Verify Database Indexes & RLS:**
  - [x] Verified `organizations`, `profiles`, `teams`, `tasks`, `activity_logs`, `notifications`, `subscriptions` table availability (Status 200 OK).
  - [x] Verified tenant isolation policies and privilege escalation protections.

---

## 2. 🔑 Production Environment Secrets Setup on Render (High Priority)

Enter these in **Render Dashboard** → **tasq-one Web Service** → **Environment**:

- [ ] `NEXT_PUBLIC_APP_URL` (e.g. `https://tasq-one.onrender.com` or custom domain)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` (From Supabase Project Settings → API)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` (From Supabase Project Settings → API)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` (From Supabase Project Settings → API)
- [ ] `GROQ_API_KEY` (From Groq Console → API Keys)
- [ ] `UPSTASH_REDIS_REST_URL` & `UPSTASH_REDIS_REST_TOKEN` (From Upstash Console)
- [ ] `CLOUDFLARE_R2_ACCESS_KEY_ID` & `CLOUDFLARE_R2_SECRET_ACCESS_KEY` (From Cloudflare R2)
- [ ] `CLOUDFLARE_R2_BUCKET` (`tasq-one-attachments`) & `CLOUDFLARE_R2_ENDPOINT`
- [ ] `RESEND_API_KEY` (From Resend Console)
- [ ] `CRON_SECRET` (Random secret string for weekly AI digest cron)

---

## 3. 🌐 Custom Domain & Cloudflare (Medium Priority / Optional)

> 💡 *Note: Render's free URL (`https://tasq-one.onrender.com`) works out of the box with automatic SSL.*

- [ ] **If using Custom Domain (e.g. `tasqone.com`):**
  - Add domain to Cloudflare.
  - Update domain registrar nameservers to Cloudflare.
  - Add CNAME record in Cloudflare pointing `@` and `www` to `tasq-one.onrender.com` (🟠 Proxied).
  - Set SSL/TLS encryption mode to **Full (Strict)**.
  - Add custom domain in Render Settings.

---

## 4. 🧪 End-to-End Testing & Verification

- [ ] **Live Healthcheck:** Verify `https://tasq-one.onrender.com/api/v1/health` returns `200 OK`.
- [ ] **Sign-up & Onboarding Flow:** Create test organization and invite a team member.
- [ ] **AI Task Decomposer:** Test live prompt decomposition with Groq Llama 3.3 70B.
- [ ] **Realtime Sprint Board:** Test drag-and-drop task movement with live Supabase subscriptions.
- [ ] **PWA Offline Mode:** Verify offline installability on iOS and Android devices.

---

## 5. 💳 Live Payment Gateway (Deferred / Skipped for Now)

> 💡 *Status: SKIPPED / DEFERRED. The platform currently operates on the ₹0 Free Starter Pilot.*

- [ ] **Razorpay Subscriptions (India):**
  - Integrate Razorpay Recurring Mandate / UPI Auto-Pay for SMB Pro (₹999/mo) and Enterprise (₹2,499/mo).
  - Configure Razorpay webhook listener at `/api/v1/billing/webhook`.
- [ ] **Stripe International (Optional):**
  - Configure Stripe Checkout for international cards.
