# 📋 TASQ-ONE — Pending Tasks, Production Checklist & Roadmap

> **Platform:** TASQ-ONE Work OS (Enterprise Multi-Tenant Task Management)  
> **Repository:** [https://github.com/Tusharsinghoffical/Saas-T1](https://github.com/Tusharsinghoffical/Saas-T1)  
> **Live Production URL:** `https://tasq-one.onrender.com`  
> **Database:** Supabase Cloud (`lycpumrwivhvtwmeywrr.supabase.co`) — PostgreSQL 15 with Row-Level Security (RLS)  
> **Support Email:** `tasqoneworkos@gmail.com`  
> **Last Updated:** August 31, 2026

---

## 📊 1. Master Progress Dashboard

```
Overall Production Readiness: [██████████████████░░] 92% COMPLETE
├── ✅ Phase 1: Core Platform, Landing Page & Simulator (100% Done)
├── ✅ Phase 2: Security Hardening, Postgres RLS & Privilege Guards (100% Done)
├── ✅ Phase 3: Auth System, Database Role Routing & UUID Fixes (100% Done)
├── ✅ Phase 4: Standalone Docker Build & Node 22 CI/CD Pipelines (100% Done)
├── ✅ Phase 5: Supabase Cloud Database & Tables Sync (100% Done)
├── ⏳ Phase 6: Cloud Deployment Secrets & Custom JWT Hook (Remaining Steps)
└── ⏸️ Phase 7: Live Payment Gateway (Deferred / Skipped for Current Launch)
```

---

## 📑 2. Master Task Matrix (Completed vs. Pending)

| ID | Module / Task | Category | Status | Priority | Notes / Description |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **P-01** | **Supabase Auth Hook Setup** | Database | ⏳ **PENDING** | 🔥 **HIGH** | Activate `custom_access_token_hook` in Supabase Dashboard for JWT `org_id` & `role` injection. |
| **P-02** | **Render Production Secrets** | DevOps | ⏳ **PENDING** | 🔥 **HIGH** | Add Supabase, Groq AI, and Redis environment variables in Render Web Service dashboard. |
| **P-03** | **Live Production Smoke Testing** | QA / Testing | ⏳ **PENDING** | ⚡ **MEDIUM** | Test live signup, login, task drag-and-drop, and AI decomposition on `https://tasq-one.onrender.com`. |
| **P-04** | **Custom Domain & Cloudflare DNS** | DevOps / DNS | ⏳ **OPTIONAL** | 💡 **LOW** | Optional: Point custom domain (e.g. `tasqone.com`) via Cloudflare CNAME proxy to Render. |
| **P-05** | **Live Transactional Email (Resend)** | Integrations | ⏳ **OPTIONAL** | 💡 **LOW** | Optional: Connect verified domain API key in Resend for live welcome and digest emails. |
| **P-06** | **WhatsApp Business Gateway** | Integrations | ⏳ **OPTIONAL** | 💡 **LOW** | Optional: Integrate Gupshup / MSG91 credentials for WhatsApp instant deliverable alerts. |
| **P-07** | **Live Payment Gateway (Paid Plans)** | Billing | ⏸️ **SKIPPED** | ⏸️ **DEFERRED** | **Currently Skipped** (Operating on ₹0 Free Starter Pilot model). Documented in Section 4. |
| **D-01** | Landing Page & Interactive Simulator | Frontend | ✅ Complete | Done | Fully localized in Indian Rupees (₹ INR), responsive, dark/light mode. |
| **D-02** | Smart Role-Based Login & Signup | Auth | ✅ Complete | Done | Real database role resolution (`admin` vs `employee`), UUID validation fixed. |
| **D-03** | PostgreSQL Row-Level Security (RLS) | Database | ✅ Complete | Done | Tenant isolation verified across all 11 tables (`0001` through `0008`). |
| **D-04** | Groq Llama 3.3 70B AI Decomposer | AI Engine | ✅ Complete | Done | Sub-second deliverable breakdown, acceptance criteria, effort estimation. |
| **D-05** | Standalone Docker Multi-Stage Build | DevOps | ✅ Complete | Done | `node:22-alpine` optimized container image with automated health checks. |
| **D-06** | GitHub Actions CI/CD Pipeline | DevOps | ✅ Complete | Done | Node 22 runners, automated linting, test suite, and container build validation. |

---

## 🛠️ 3. Immediate Actionable Steps (What Needs To Be Done Now)

### Step 3.1: Enable Supabase Custom Access Token Hook (High Priority)
> 💡 *This injects the tenant `org_id` and user `role` directly into the Supabase JWT session, enabling automatic database Row-Level Security isolation.*

1. Open your Supabase Dashboard: **[https://supabase.com/dashboard/project/lycpumrwivhvtwmeywrr/auth/hooks](https://supabase.com/dashboard/project/lycpumrwivhvtwmeywrr/auth/hooks)**
2. Under **Custom Access Token (JWT)**:
   - Click **Add Hook** (or **Edit**).
   - Hook Type: **Postgres function**.
   - Function: Select **`public.custom_access_token_hook(event jsonb)`**.
3. Click **Save**.

---

### Step 3.2: Verify Render Environment Secrets (High Priority)
> 💡 *Ensure these exact environment variables are configured in Render dashboard for your live web service.*

1. Go to **[https://dashboard.render.com](https://dashboard.render.com)** → Select your `tasq-one` Web Service → Click **Environment**.
2. Add / Verify the following production keys:

```env
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_APP_URL=https://tasq-one.onrender.com
NEXT_PUBLIC_SUPABASE_URL=https://lycpumrwivhvtwmeywrr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5Y3B1bXJ3aXZodnR3bWV5d3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwOTA2ODQsImV4cCI6MjEwMzY2NjY4NH0.4tdEnU7fBRlGCUvWw_PRC8Yz-05p-Ws17cTScFsOvpw
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5Y3B1bXJ3aXZodnR3bWV5d3JyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODA5MDY4NCwiZXhwIjoyMTAzNjY2Njg0fQ.rfHQm6YiMPNPYgbwyu8l4c05R1Disntq4wpsjYMalLM
GROQ_API_KEY=your_groq_api_key_here
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token
RESEND_API_KEY=your_resend_api_key
CRON_SECRET=tasq_one_production_cron_secret_2026
NEXT_PUBLIC_ENABLE_BILLING=false
```

---

### Step 3.3: Production Smoke Test Checklist (Live Verification)
Once Render completes its automated deployment:

- [ ] **Health Endpoint:** Open `https://tasq-one.onrender.com/api/v1/health`  
  *Expected response:* `{"status": "healthy", "version": "1.0.0"}`
- [ ] **Landing Page:** Open `https://tasq-one.onrender.com` — verify all sections, modals, and simulator cards render smoothly.
- [ ] **Admin Registration:** Visit `/signup` → Create a test organization (e.g. *"Beta Launch Corp"*) → Verify successful redirection to `/onboarding`.
- [ ] **Task Creation & Drag-and-Drop:** Visit `/admin/dashboard` → Add a new deliverable → Move across `Pending` → `In Progress` → `In Review` → `Completed`.
- [ ] **Employee Focus View:** Log in as an employee or open `/employee/dashboard` → Check off a task and verify visual completion progress.

---

### Step 3.4: Custom Domain & Cloudflare DNS (Optional)
> 💡 *Only required if you purchase a custom domain like `tasqone.com`.*

1. In **Cloudflare Dashboard** → Select your domain → **DNS Records**:
   - `CNAME` | `@` | `tasq-one.onrender.com` | 🟠 Proxied
   - `CNAME` | `www` | `tasq-one.onrender.com` | 🟠 Proxied
2. In **SSL/TLS** Settings: Select **Full (Strict)**.

---

## ⏸️ 4. Payment Gateway Integration (Deferred / Skipped)

> ⚠️ **Current Phase Status: SKIPPED / DEFERRED**  
> *Reason: TASQ-ONE is launching with the **₹0 Free Starter Pilot** model (up to 5 team members with unlimited tasks). Paid billing tiers will be integrated in Phase 2.*

### Future Paid Plans Architecture (When Ready To Implement):
- **Pricing Tiers:**
  - **Free Starter Pilot:** ₹0/mo (5 members, unlimited tasks, basic AI).
  - **SMB Pro Tier:** ₹999/mo (Unlimited members, priority AI, Slack alerts, 10GB storage).
  - **Enterprise Scale:** ₹2,499/mo (Custom domain, SSO, audit export, dedicated support).

### Technical Tasks for Future Payment Activation:
1. **Razorpay Subscriptions (India - UPI AutoPay & NetBanking):**
   - Create subscription plans in Razorpay Dashboard.
   - Implement checkout handler using Razorpay Standard Checkout SDK.
   - Verify webhooks at `/api/v1/billing/webhook` using HMAC-SHA256 signature verification.
2. **Stripe Billing (International Cards):**
   - Connect Stripe Customer Portal and Stripe Webhook listener.
3. **Database Sync:**
   - Update `subscriptions` table (`tier`, `status`, `current_period_end`) upon receiving verified webhook events.

---

## 📚 5. Documentation Directory

- 📖 [Main Project Overview & Visual Tour](../README.md)
- 🚀 [Render & Cloudflare Production Deployment Guide](DEPLOYMENT-RENDER-AND-CLOUDFLARE.md)
- 🛡️ [Security Audit & Vulnerability Remediation Report](SECURITY-AUDIT-REPORT.md)
- 🐳 [Docker Run & Development Guide](DOCKER_GUIDE.md)
- 🗄️ [Master Consolidated Database Schema (SQL)](../supabase/migrations/FULL_DATABASE_SETUP.sql)

---

<div align="center">
<b>TASQ-ONE Engineering Operations</b> • <a href="mailto:tasqoneworkos@gmail.com">tasqoneworkos@gmail.com</a>
</div>
