# TASQ-ONE — Development Plan

**Environment:** Google Antigravity IDE
**AI Backbone:** Groq API
**UI Source:** Google Stitch
**Database/Auth:** Supabase
**Constraint:** Zero AWS, zero-cost stack

---

## 1. Build Phases Overview

| Phase | Name | Duration (est., solo dev) | Outcome |
|---|---|---|---|
| 0 | Design & Planning | 2–3 days | Docs (this set) + Stitch screens ready |
| 1 | Foundation | 3–4 days | Repo, Supabase project, auth, multi-tenancy, RLS |
| 2 | Core Task Engine | 5–6 days | Task CRUD, assignment, Kanban, real-time |
| 3 | Dashboards & Notifications | 3–4 days | KPI dashboards, notification system, Resend email |
| 4 | AI Layer (Groq) | 3–4 days | Task enhancement, workload suggestion, weekly summary |
| 5 | Polish & PWA | 2–3 days | Responsive QA, PWA manifest, dark mode, empty states |
| 6 | Security & Launch Prep | 2 days | RLS test suite, rate limiting, CI/CD, deploy |

**Total estimated solo timeline: ~20–26 working days for MVP.**

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

## 4. Definition of Done (MVP Launch)
- [ ] All 7 MVP acceptance criteria pass (see Requirements doc)
- [ ] Zero AWS dependency confirmed
- [ ] $0 monthly infra cost confirmed at pilot scale
- [ ] RLS test suite green
- [ ] Deployed and accessible via public URL

## 5. Post-MVP Backlog (Phase 2/3 candidates)
- Slack / Google Calendar integrations
- Gantt chart / project timeline view
- Stripe billing + subscription tiers
- React Native / Flutter mobile app
- Voice-based task updates
- Advanced AI productivity scoring
