# TASQ-ONE — Development Plan

**Environment:** Google Antigravity IDE
**AI Backbone:** Groq API
**UI Source:** Google Stitch
**Database/Auth:** Supabase
**Constraint:** Zero AWS, zero-cost stack

---

## 1. Build Phases Overview

| Phase | Name                              | Status      | Outcome                                               |
| ----- | --------------------------------- | ----------- | ----------------------------------------------------- |
| 0     | Design & Planning                 | ✅ Complete | Docs + Architecture & Wireframes ready                |
| 1     | Foundation                        | ✅ Complete | Repo, Supabase project, auth, multi-tenancy, RLS      |
| 2     | Core Task Engine                  | ✅ Complete | Task CRUD, assignment, Kanban, real-time              |
| 3     | Dashboards & Notifications        | ✅ Complete | KPI dashboards, notification system, Resend email     |
| 4     | AI Layer (Groq)                   | ✅ Complete | Task enhancement, workload suggestion, weekly summary |
| 5     | Polish & PWA                      | ✅ Complete | Responsive QA, PWA manifest, dark mode, empty states  |
| 6     | Security & Launch Prep            | ✅ Complete | RLS test suite, rate limiting, CI/CD, deploy          |
| 7     | Observability, Telemetry & Skeletons| ✅ Complete| Streaming `loading.tsx`, `/health` UI, solid notifications |

**Platform Status: 100% COMPLETE & PRODUCTION VERIFIED (v2.8.0).**

---

## 2. Detailed Sprint Breakdown

### Phase 0 — Design & Planning

- Finalize PRD, Requirements, Architecture (this document set)
- Build all 20 screens in Google Stitch using shared design tokens
- Set up Supabase project, Upstash Redis, Cloudflare R2, Resend, Groq API keys

### Phase 1 — Foundation

- Initialize Next.js project in Antigravity IDE
- Configure Tailwind with design tokens from Stitch
- Set up Supabase Auth (email/password + magic link)
- Implement org signup + JWT custom claims (`org_id`, `role`) via Auth Hook
- Write and apply all DB migrations + RLS policies
- Build RBAC middleware for API routes

### Phase 2 — Core Task Engine

- Task CRUD API + UI (create/edit modal)
- Assignment logic (single + multi-assignee)
- Kanban board with drag-and-drop (optimistic updates)
- Supabase Realtime subscription wiring
- Comments + file attachments (R2 upload flow)
- Task dependencies (basic blocking logic)

### Phase 3 — Dashboards & Notifications

- Admin KPI dashboard (active/overdue/completion rate/productivity chart)
- Employee personal dashboard
- Manager scoped dashboard
- In-app notification center + bell/unread count
- Resend email integration for assigned/due-soon/overdue/mention events
- Activity log + audit trail table + export

### Phase 4 — AI Layer (Groq)

- Groq client wrapper in `lib/groq/`
- Prompt templates: task-enhance, workload-suggest, weekly-summary
- `/api/v1/ai/*` edge routes with Upstash rate-limit gating
- Graceful fallback UI when AI unavailable/rate-limited
- Weekly summary cron (Vercel Cron / Supabase scheduled function) → Resend email to Admins

### Phase 5 — Polish & PWA

- Full responsive QA (mobile/tablet/desktop) for both panels
- PWA manifest + service worker (installable, offline read cache)
- Dark mode pass
- Empty states, loading skeletons, error boundaries

### Phase 6 — Security & Launch Prep

- Automated RLS isolation test suite (cross-tenant leak tests)
- Rate limit verification
- GitHub Actions CI/CD pipeline → auto-deploy to Vercel on push to `main`
- PostHog analytics wired for key events (signup, task created, task completed)
- Final smoke test against MVP Acceptance Criteria (see `02-REQUIREMENTS.md` §5)

---

## 3. Definition of Ready (before coding starts)

- [ ] All 20 Stitch screens approved
- [ ] DB schema reviewed against Requirements doc
- [ ] Groq API key + rate limits confirmed
- [ ] Supabase, Upstash, R2, Resend accounts created (free tier)

## 4. Definition of Done (Production Launch)
 
- [x] All 7 MVP acceptance criteria pass (see Requirements doc)
- [x] Zero AWS dependency confirmed (Cloudflare R2 + Render + Supabase + Upstash + Resend)
- [x] $0 monthly infra cost confirmed at pilot scale
- [x] RLS test suite green (75 passed in Vitest)
- [x] Deployed and accessible via public URL (`https://tasq-one.onrender.com`)
- [x] System Status & Live Telemetry verified at `/health`
- [x] Route-Level Skeleton loading states implemented across App Router dashboards
- [x] Mobile responsive UI and notification drawer transparency verified

## 5. Post-MVP Backlog (Phase 2/3 candidates)

- Slack / Google Calendar integrations
- Gantt chart / project timeline view
- Stripe / Razorpay billing + subscription tiers
- React Native / Flutter mobile app
- Voice-based task updates
- Advanced AI productivity scoring
