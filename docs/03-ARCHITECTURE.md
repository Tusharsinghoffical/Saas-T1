# TASQ-ONE — System Architecture Document

**No AWS. 100% free-tier / edge-first / serverless.**
**Built in Google Antigravity IDE. AI via Groq. UI designed in Google Stitch.**

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│   Next.js (React) + Tailwind + Zustand — PWA-enabled         │
│   Designed first in Google Stitch → implemented in           │
│   Antigravity IDE                                             │
│   Hosted on: Vercel (or Cloudflare Pages) — free tier         │
└───────────────────────────┬────────────────────────────────┘
                             │ HTTPS / REST + Supabase Realtime WS
┌───────────────────────────▼────────────────────────────────┐
│                     API / EDGE LAYER                          │
│   Next.js API Routes / Edge Functions (or Cloudflare Workers) │
│   - Auth middleware (JWT verify)                              │
│   - RBAC guard                                                │
│   - Rate limiting via Upstash Redis                           │
│   - Groq AI proxy endpoints                                   │
└───────┬───────────────┬───────────────┬──────────────┬───────┘
        │               │               │              │
┌───────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐ ┌─────▼──────┐
│  Supabase     │ │  Upstash     │ │ Cloudflare  │ │  Resend    │
│  Postgres +   │ │  Redis       │ │ R2 (Object  │ │  (Email)   │
│  Auth + RLS + │ │  (cache,     │ │ Storage —   │ │            │
│  Realtime     │ │  rate-limit, │ │ attachments)│ │            │
│               │ │  AI queue)   │ │             │ │            │
└───────────────┘ └──────────────┘ └─────────────┘ └────────────┘
        │
┌───────▼──────────────────────────┐
│   Groq API (LLM inference)        │
│   Llama 3.x / Mixtral models      │
│   Used for: task enhancement,     │
│   workload balancing, summaries   │
└────────────────────────────────────┘

  Cross-cutting: GitHub + GitHub Actions (CI/CD) · PostHog (analytics)
```

**Explicitly removed from stack:** AWS (no S3, no Lambda, no RDS, no EC2, no CloudFront). All equivalents replaced with free-tier alternatives below.

---

## 2. Technology Stack (Final — No AWS)

| Layer | Technology | Why |
|---|---|---|
| Frontend Framework | Next.js 14 (App Router) | SSR + edge support, free hosting on Vercel |
| Styling | Tailwind CSS | Fast, matches Stitch-exported design tokens |
| State Mgmt | Zustand | Lightweight vs Redux, less boilerplate |
| UI Design Source | **Google Stitch** | Generate UI mockups/screens → export to code/Tailwind reference |
| Hosting (Frontend) | Vercel free tier (or Cloudflare Pages) | $0, edge CDN |
| Backend/API | Next.js Route Handlers (Edge Runtime) | No separate backend server needed |
| Database | **Supabase Postgres** | Free tier, built-in Auth + Realtime + RLS |
| Auth | Supabase Auth (JWT) | RBAC via custom claims |
| Cache/Queue/Rate-limit | Upstash Redis | Serverless Redis, free tier, REST-based |
| File Storage | Cloudflare R2 | S3-compatible API but free egress, replaces AWS S3 |
| Email | Resend | Free tier transactional email |
| AI/LLM | **Groq API** (Llama 3.1/3.3, Mixtral) | Fast inference, free/cheap tier, replaces OpenAI |
| CI/CD | GitHub Actions | Free for public/private repos (within limits) |
| Analytics | PostHog | Free tier, self-serve product analytics |
| Dev Environment | **Google Antigravity IDE** | Primary build environment for this project |

> AWS is fully removed. Cloudflare R2 replaces S3. Vercel/Cloudflare Pages replaces CloudFront+S3 static hosting. No Lambda — using Next.js Edge Functions / Cloudflare Workers instead. No RDS — Supabase Postgres instead.

---

## 3. Multi-Tenancy Strategy

- **Model:** Shared database, shared schema, isolated via `org_id` column + Postgres RLS (Row-Level Security).
- Every table has `org_id UUID NOT NULL REFERENCES organizations(id)`.
- RLS policy pattern (applied to every tenant table):

```sql
create policy "tenant_isolation_select"
on tasks for select
using (org_id = (auth.jwt() ->> 'org_id')::uuid);

create policy "tenant_isolation_insert"
on tasks for insert
with check (org_id = (auth.jwt() ->> 'org_id')::uuid);
```

- `org_id` is injected into the JWT as a custom claim at login via a Supabase Auth Hook.
- Role (`admin`/`manager`/`employee`) is also a JWT claim, checked in both RLS policies (for row-level role rules) and in API middleware (for route-level guards).

---

## 4. Database Schema (Core Tables)

```sql
-- organizations
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  timezone text default 'Asia/Kolkata',
  created_at timestamptz default now()
);

-- users (extends supabase auth.users via profile table)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  org_id uuid references organizations(id) on delete cascade,
  full_name text,
  role text check (role in ('admin','manager','employee')) default 'employee',
  avatar_url text,
  created_at timestamptz default now()
);

-- teams
create table teams (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  name text not null,
  manager_id uuid references profiles(id)
);

create table team_members (
  team_id uuid references teams(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  primary key (team_id, user_id)
);

-- tasks
create table tasks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  team_id uuid references teams(id),
  title text not null,
  description text,
  status text check (status in ('pending','in_progress','in_review','completed')) default 'pending',
  priority text check (priority in ('low','medium','high','urgent')) default 'medium',
  due_date timestamptz,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table task_assignees (
  task_id uuid references tasks(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  primary key (task_id, user_id)
);

create table task_dependencies (
  task_id uuid references tasks(id) on delete cascade,
  depends_on_task_id uuid references tasks(id) on delete cascade,
  primary key (task_id, depends_on_task_id)
);

create table task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks(id) on delete cascade,
  user_id uuid references profiles(id),
  body text not null,
  created_at timestamptz default now()
);

create table task_attachments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks(id) on delete cascade,
  file_url text not null,
  file_name text,
  uploaded_by uuid references profiles(id),
  created_at timestamptz default now()
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  type text not null,
  payload jsonb,
  read_at timestamptz,
  created_at timestamptz default now()
);

create table activity_logs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  actor_id uuid references profiles(id),
  action text not null,
  entity text not null,
  entity_id uuid,
  diff jsonb,
  created_at timestamptz default now()
);
```

Indexes to add: `tasks(org_id, status)`, `tasks(org_id, due_date)`, `notifications(user_id, read_at)`, `activity_logs(org_id, created_at desc)`.

---

## 5. API Design (REST, Edge Functions)

Base: `/api/v1`

| Endpoint | Method | Purpose | Role Guard |
|---|---|---|---|
| `/auth/signup-org` | POST | Create org + first admin user | Public |
| `/auth/invite` | POST | Invite user to org | Admin/Manager |
| `/tasks` | GET/POST | List / create tasks | Auth'd |
| `/tasks/:id` | GET/PATCH/DELETE | Task detail / update / delete | Role-checked |
| `/tasks/:id/comments` | GET/POST | Comments thread | Auth'd |
| `/tasks/:id/attachments` | POST | Upload to R2, save ref | Auth'd |
| `/dashboard/admin` | GET | KPI aggregate | Admin/Manager |
| `/dashboard/me` | GET | Personal dashboard | Auth'd |
| `/notifications` | GET/PATCH | List / mark read | Auth'd |
| `/ai/enhance-task` | POST | Groq: rewrite task description | Auth'd |
| `/ai/workload-suggestion` | POST | Groq: suggest assignee | Manager/Admin |
| `/ai/weekly-summary` | GET | Groq: generate summary (cron-triggered) | Admin |
| `/activity-logs` | GET | Audit trail | Admin/Manager |

All routes: JWT verified → `org_id`/`role` extracted → RLS handles data scoping as a second layer of defense (defense-in-depth).

---

## 6. Groq AI Integration Pattern

```
Client → /api/v1/ai/enhance-task (Edge Function)
       → Upstash Redis: check rate-limit bucket for org_id
       → If OK: call Groq API (model: llama-3.3-70b-versatile or mixtral-8x7b)
       → Stream or return JSON response
       → If Groq fails/rate-limited: return graceful fallback (original text, toast: "AI busy, try again")
```

- AI calls never block core task CRUD — AI is additive, not a dependency for base functionality.
- All Groq prompts are stored server-side as versioned prompt templates (not hardcoded inline) for easy iteration.

---

## 7. Realtime & Notifications Flow

```
Task status changed → Postgres row update
   → Supabase Realtime broadcasts change (postgres_changes channel, scoped to org_id)
   → All subscribed clients (Kanban board) update instantly
   → DB trigger inserts into `notifications` table for relevant users
   → Edge function (cron or trigger-based) sends Resend email if due-soon/overdue/mention
```

---

## 8. Folder Structure (for Antigravity IDE)

```
tasq-one/
├── apps/
│   └── web/                      # Next.js app
│       ├── app/
│       │   ├── (auth)/
│       │   ├── (admin)/dashboard/
│       │   ├── (employee)/dashboard/
│       │   ├── api/v1/
│       │   │   ├── tasks/
│       │   │   ├── ai/
│       │   │   ├── notifications/
│       │   │   └── dashboard/
│       │   └── layout.tsx
│       ├── components/
│       │   ├── kanban/
│       │   ├── dashboard/
│       │   ├── tasks/
│       │   └── ui/               # Stitch-derived design system components
│       ├── lib/
│       │   ├── supabase/
│       │   ├── groq/
│       │   ├── redis/
│       │   └── validators/       # zod schemas
│       ├── store/                # zustand stores
│       └── styles/
├── supabase/
│   ├── migrations/
│   └── seed.sql
├── .github/workflows/            # CI/CD
├── docs/                         # this PRD/Architecture/etc.
└── package.json
```

---

## 9. Scalability Path (Phase 1 → 3)

| Phase | Trigger | Change |
|---|---|---|
| Phase 1 (MVP) | 0–20 orgs | Fully as above, $0 |
| Phase 2 (Growth) | Free-tier limits approached (DB rows, Redis ops, function invocations) | Move API layer to Render paid tier if needed; add background job queue (Upstash QStash) |
| Phase 3 (Scale) | Revenue-justified | Split into microservices, dedicated Postgres cluster (still not AWS — Supabase paid tier / Neon), add mobile apps, Stripe billing |

---

## 10. Security Checklist
- [ ] RLS enabled + tested on every table
- [ ] JWT `org_id`/`role` claims verified server-side, never trusted from client alone
- [ ] All inputs validated with zod before DB write
- [ ] File uploads type/size validated before R2 write
- [ ] Rate limiting active on all public/auth endpoints
- [ ] Secrets (Groq key, Supabase service key) never exposed client-side — Edge Function env vars only
