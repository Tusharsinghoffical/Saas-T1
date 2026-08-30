# TASQ-ONE — Product Requirements Document (PRD)

**Product Name:** TASQ-ONE
**Category:** Multi-Tenant SaaS Task Management Platform for SMBs
**Version:** 1.0 (MVP)
**Owner:** Tushar
**Stack Constraint:** Zero-AWS, Zero-cost / free-tier only
**Build Tools:** Google Antigravity IDE, Google Stitch (UI design), Supabase, Groq API

---

## 1. Vision

TASQ-ONE is a lightweight, multi-tenant "Work OS" for small and medium businesses that gives Admins and Employees a single place to assign, track, and complete work — with AI (via Groq) helping balance workload, summarize progress, and reduce manual overhead. The MVP must run entirely on free-tier infrastructure and be architected so that scaling later doesn't require a rewrite.

## 2. Problem Statement

SMBs currently manage tasks through WhatsApp groups, Excel sheets, or expensive enterprise tools (Asana, Monday.com, ClickUp) that are overkill and costly for teams of 5–50 people. There is no affordable, India/SMB-friendly, AI-assisted task platform that:

- Separates Admin and Employee experiences clearly
- Gives real-time visibility without heavy setup
- Costs nothing to start and scales with the business

## 3. Target Users

| Persona | Description | Core Need |
|---|---|---|
| Owner/Admin | SMB owner or manager, 1–5 per org | Assign work, see status, measure productivity |
| Team Lead/Manager | Middle layer, manages a sub-team | Delegate, review, report upward |
| Employee | Executes tasks | Clear task list, easy status updates, no clutter |

## 4. Goals & Success Metrics

| Goal | Metric | MVP Target |
|---|---|---|
| Fast onboarding | Time from signup to first task assigned | < 5 minutes |
| Adoption | Daily Active Users / Org | > 60% of seated users |
| Task velocity | Avg. time task stays "Pending" | Trend downward week-over-week |
| Zero-cost operation | Monthly infra cost at < 100 orgs | $0 |
| AI usefulness | % tasks using AI suggestion/summary | > 20% |

## 5. Scope (MVP — Phase 1)

### In Scope
- Multi-tenant org signup (each company = isolated tenant)
- Admin Panel (task CRUD, assignment, KPIs, RBAC)
- Employee Panel (task view, status update, comments)
- Kanban board (drag & drop)
- Real-time updates
- Notifications (in-app + email)
- File attachments on tasks
- AI-powered task suggestions & workload balancing (Groq)
- PWA support

### Out of Scope (Phase 1)
- Native mobile apps (React Native/Flutter) — Phase 3
- Stripe billing — Phase 3 (post free-tier validation)
- Gantt charts, voice-based updates — Optional/Phase 3
- Slack/Calendar deep integrations — Phase 2+

## 6. Core Feature Set

### 6.1 Admin / Owner / Manager Panel
- Create, assign, edit, delete tasks
- Assign to individual or team
- Priorities, deadlines, dependencies
- Real-time status board (Pending / In Progress / Completed / Overdue)
- Employee performance metrics
- Comment & feedback thread per task
- Notification center
- RBAC (Admin, Manager, Employee)
- KPI dashboard: active tasks, overdue tasks, team productivity, completion rate
- Activity logs & audit trail

### 6.2 Employee Panel
- View assigned tasks with full detail
- Update status/progress
- Submit completion (with proof/attachment)
- Comment & attach files
- Notifications
- Personal dashboard: due today, upcoming, completed
- Optional time tracking per task

### 6.3 AI Layer (Groq-powered)
- Task description auto-enhancement (Groq LLM rewrites vague task text into clear instructions)
- Workload balancing suggestions (which employee has capacity)
- Daily/weekly AI summary of team progress for Admin
- Smart reminders (AI drafts reminder copy based on task urgency)
- AI-based task priority suggestion

## 7. Non-Functional Requirements
- Zero-cost hosting at MVP scale
- Edge-first, low latency (<300ms API response for core reads)
- Multi-tenant data isolation via Postgres Row-Level Security (RLS)
- Mobile-responsive, installable as PWA
- 99% uptime on free-tier (best-effort, documented limitation)

## 8. Assumptions & Constraints
- **No AWS** — explicitly excluded due to budget. All infra must run on Supabase, Vercel/Cloudflare, Upstash, Resend free tiers.
- Groq is the sole LLM provider (no OpenAI/Anthropic API cost).
- UI is designed first in Google Stitch, then implemented in Antigravity IDE.
- Solo/small-team development — code must be modular enough for one person to maintain.

## 9. Release Phases

| Phase | Focus | Infra |
|---|---|---|
| Phase 1 — MVP | Core task management, RBAC, AI suggestions | Fully free-tier |
| Phase 2 — Growth | Background jobs, integrations (Slack/Calendar), billing prep | Add paid tiers where needed |
| Phase 3 — Scale | Microservices, mobile apps, advanced analytics | Paid infra as revenue justifies |

## 10. Risks
| Risk | Mitigation |
|---|---|
| Free-tier limits hit at scale | Design with clear Phase 2 migration path (documented in Architecture doc) |
| Groq rate limits | Queue AI calls via Upstash; graceful degradation without AI |
| RLS misconfiguration → tenant data leak | Mandatory RLS test suite before launch |
