# 📋 TASQ-ONE — Project Status, Pending Tasks & Roadmap

> **Current Status:** v1.0 Core Platform & Landing Page Complete (Docker Container Running)  
> **Last Updated:** August 2026  
> **Target Production Environment:** Supabase Cloud (PostgreSQL) + Docker / Vercel + Groq AI + Cloudflare R2

---

## 📊 Executive Summary Table

| Category | Component | Status | Priority | Action Required |
| :--- | :--- | :---: | :---: | :--- |
| **Landing Page & Branding** | Hero, Simulator, ROI Calculator, Mega Footer | ✅ Complete | Done | Fully localized (₹ INR), responsive, healthy |
| **Security Hardening** | PostgreSQL RLS, Rate Limiting, RBAC Guards | ✅ Complete | Done | All Critical & High audit issues patched |
| **Containerization** | Dockerfile & Docker Compose (Node 22 Standalone) | ✅ Complete | Done | Port 3000 mapped, zero runtime crash |
| **Database & Migrations** | Supabase Cloud Database Sync | ⏳ Pending | High | Apply SQL migrations `0001`–`0008` on live cloud instance |
| **Third-Party Services** | Groq AI, Cloudflare R2, Resend/Gupshup | ⏳ Pending | Medium | Add production API keys to `.env.production` |
| **Testing & QA** | Automated E2E & RLS Regression Suite | ⏳ Pending | Medium | Run automated tests against staging database |
| **Domain & SSL** | Custom DNS & Production Cloud Deployment | ⏳ Pending | High | Map custom domain (`tasqone.com`), setup SSL |
| **Payment Gateway** | Razorpay / Stripe for SMB Pro (₹999) & Enterprise (₹2,499) | ⏸️ Deferred | Low / Optional | Currently ₹0 Free Starter Tier is active; skip for now |

---

## 1. 🗄️ Database & Backend Infrastructure

### 1.1 Cloud Database Migration Execution
- [ ] **Run Migrations on Live Supabase:**
  - `supabase/migrations/0001_initial_schema.sql` (Tables: `organizations`, `users`, `tasks`, `task_dependencies`, `audit_logs`, `attachments`, `comments`)
  - `supabase/migrations/0002_rls_policies.sql` (Tenant multi-tenant isolation)
  - `supabase/migrations/0003_storage_buckets.sql` (R2/S3 bucket policies)
  - `supabase/migrations/0004_task_dag_constraints.sql` (Dependency cycles prevention)
  - `supabase/migrations/0005_audit_triggers.sql` (Automatic audit trail creation)
  - `supabase/migrations/0006_auth_rate_limiting.sql` (Token bucket tables)
  - `supabase/migrations/0007_fix_password_reset_expiry.sql` (15-min token invalidation)
  - `supabase/migrations/0008_fix_privilege_escalation.sql` (Strict admin-only role updates)
- [ ] **Database Health Verification:**
  - Verify indexes on `tasks(organization_id, status, due_date)`
  - Test RLS bypass prevention with test non-admin user tokens.

---

## 2. 🔑 Environment & Production Credentials (`.env.production`)

- [ ] **Supabase Cloud Credentials:**
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
- [ ] **AI Engine (Groq Cloud):**
  - `GROQ_API_KEY` (Llama 3.3 70B Versatile model for task decomposition)
- [ ] **Distributed Cache & Rate Limiting (Upstash):**
  - `UPSTASH_REDIS_REST_URL`
  - `UPSTASH_REDIS_REST_TOKEN`
- [ ] **Object Storage (Cloudflare R2 / AWS S3):**
  - `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`
- [ ] **Transactional Email & Notifications:**
  - `RESEND_API_KEY` (For password reset & executive weekly velocity digests)
- [ ] **WhatsApp Enterprise Broadcast (Optional):**
  - `GUPSHUP_API_KEY` / `MSG91_AUTH_KEY` (For real-time WhatsApp task notifications in India)

---

## 3. 🧪 Testing & Quality Assurance (QA)

- [ ] **RLS Tenant Isolation Test Suite:**
  - Run `npm run test:rls` to ensure Organization A cannot read or edit Organization B tasks.
- [ ] **Authentication Flow Testing:**
  - Signup with new email & organization creation.
  - Login rate-limiter trigger after 5 invalid attempts (429 Too Many Requests check).
  - Password reset link generation & 15-minute expiration check.
  - Member invite link generation and employee onboarding test.
- [ ] **Task Engine & DAG Validation:**
  - Verify blocked tasks cannot transition to `in_progress` until prerequisite tasks are `completed`.
  - Verify file upload enforces 10MB limit and validates MIME types (`image/*`, `application/pdf`, `text/*`).

---

## 4. 📱 Application Dashboard & Live Workspace Polish

- [ ] **Admin Dashboard (`/admin/dashboard`):**
  - Verify live Supabase real-time subscription for instant task updates across multiple open browser tabs.
  - Test CSV export of workspace activity logs.
- [ ] **Employee Morning Focus View (`/employee/dashboard`):**
  - Test "Due Today" checklist toggle with real database update.
  - Test offline PWA caching on mobile devices.
- [ ] **Slack Integration Test:**
  - Test custom Slack Incoming Webhook delivery under Organization Settings (`/admin/settings`).

---

## 5. 💳 Payment Gateway (Deferred / Next Phase)

> 💡 *Note: Currently skipped as per project requirements. The ₹0 Free Starter Pilot is active by default.*

- [ ] **Razorpay / Stripe Integration:**
  - Connect Razorpay Subscriptions API for Indian recurring billing (UPI Auto-Pay / RuPay / NetBanking).
  - Implement webhook listener for invoice payment confirmations (`/api/v1/billing/webhook`).
  - Add organization billing management tab in Admin Settings.

---

## 6. 🚀 Production Deployment & Domain Setup

- [ ] **Production Host Setup:**
  - Option A: **Docker Standalone on VPS (DigitalOcean / AWS EC2 / Hetzner)** with Nginx reverse proxy + Let's Encrypt SSL (`certbot`).
  - Option B: **Vercel / AWS ECS** container deployment.
- [ ] **DNS & Domain Configuration:**
  - Point A/CNAME records to production server.
  - Enable Cloudflare SSL & HTTP/3.
- [ ] **Health Monitoring:**
  - Set up uptime monitor on `https://yourdomain.com/api/v1/health`.
