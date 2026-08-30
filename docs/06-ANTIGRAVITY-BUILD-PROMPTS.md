# TASQ-ONE — Antigravity IDE Build Prompt Library

**How to use:** Run these prompts **in order**, one at a time, inside Google Antigravity IDE. Each prompt assumes the previous ones are already applied. Paste as-is; adjust file paths only if Antigravity's generated structure differs. Reference `docs/01-PRD.md` through `docs/05-DEVELOPMENT-PLAN.md` (drop these MD files into a `/docs` folder in your repo first) so the IDE agent has full context.

---

## PHASE 0 — Project Setup

### Prompt 1 — Repo & Base Setup
```
Initialize a new Next.js 14 project (App Router, TypeScript) named "tasq-one" for a multi-tenant SaaS task management platform. Set up:
- Tailwind CSS with a custom theme using these tokens: primary #4F46E5, urgent #EF4444, success #22C55E, background #F9FAFB (light) / #0F172A (dark), font "Inter", border radius 10px.
- ESLint + Prettier
- Folder structure: app/(auth), app/(admin), app/(employee), app/api/v1, components/ui, components/kanban, components/dashboard, components/tasks, lib/supabase, lib/groq, lib/redis, lib/validators, store/
- A /docs folder containing placeholders for our PRD, Requirements, Architecture, UI-UX, and Development Plan markdown files.
Do NOT include any AWS SDK, AWS CLI, or AWS-related packages anywhere in this project. Confirm final package.json has zero AWS dependencies.
```

### Prompt 2 — Environment & Config
```
Create a .env.local.example file with placeholders for: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, GROQ_API_KEY, UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN, CLOUDFLARE_R2_ACCESS_KEY_ID, CLOUDFLARE_R2_SECRET_ACCESS_KEY, CLOUDFLARE_R2_BUCKET, CLOUDFLARE_R2_ENDPOINT, RESEND_API_KEY, NEXT_PUBLIC_POSTHOG_KEY. Add a config loader in lib/env.ts that validates these are present at runtime using zod, and throws a clear error if any required var is missing.
```

---

## PHASE 1 — Database, Auth & Multi-Tenancy

### Prompt 3 — Supabase Schema Migration
```
Create a Supabase SQL migration file at supabase/migrations/0001_init.sql implementing this exact schema: organizations, profiles, teams, team_members, tasks, task_assignees, task_dependencies, task_comments, task_attachments, notifications, activity_logs — with the exact columns, types, and constraints from docs/03-ARCHITECTURE.md section 4. Include the indexes listed at the end of that section.
```

### Prompt 4 — Row-Level Security Policies
```
Write a second migration file supabase/migrations/0002_rls.sql that enables Row-Level Security on every tenant-scoped table (organizations excluded, all others included) and adds SELECT/INSERT/UPDATE/DELETE policies that restrict access to rows where org_id matches (auth.jwt() ->> 'org_id')::uuid. For the profiles table, also add a policy allowing a user to always read their own row. Add role-based policies so only 'admin' and 'manager' roles (from auth.jwt() ->> 'role') can INSERT/UPDATE/DELETE tasks, while 'employee' can only UPDATE the status field of tasks they are assigned to.
```

### Prompt 5 — Auth Hook for Custom JWT Claims
```
Implement a Supabase Auth Hook (Postgres function, "Custom Access Token" hook) that injects org_id and role into the JWT from the profiles table at login/token-refresh time. Provide the SQL function and the exact steps to register it in Supabase Dashboard > Authentication > Hooks. Also create lib/supabase/client.ts and lib/supabase/server.ts with typed Supabase client factories (browser client and server/edge client using the service role key only in server context).
```

### Prompt 6 — Org Signup & Onboarding Flow
```
Build the signup flow: app/(auth)/signup/page.tsx collects org name + admin email/password, calls a server action that (1) creates the auth user via Supabase, (2) creates a row in organizations, (3) creates the profiles row with role='admin' and the new org_id, all inside a single transaction/RPC. Then build app/(auth)/onboarding/page.tsx — a 3-step wizard: confirm org name, invite teammates (email + role picker), create first task. Use zod for all form validation and show inline errors.
```

### Prompt 7 — Login, Magic Link & RBAC Middleware
```
Build app/(auth)/login/page.tsx supporting both email/password and magic link login via Supabase Auth. Then create middleware.ts that: verifies the Supabase session on every request to /app/(admin)/* and /app/(employee)/* routes, reads the role claim, and redirects employees away from admin-only routes (and vice versa is allowed for admin to view employee views). Also create lib/auth/guard.ts — a reusable server-side helper requireRole(allowedRoles: string[]) used inside API route handlers to enforce RBAC before touching the database.
```

---

## PHASE 2 — Core Task Engine

### Prompt 8 — Task CRUD API
```
Implement REST API routes under app/api/v1/tasks/: GET (list, with query params for status/priority/assignee/team filters), POST (create), and app/api/v1/tasks/[id]/route.ts with GET/PATCH/DELETE. Use the RBAC guard from lib/auth/guard.ts on POST/PATCH/DELETE (admin/manager only, except employees may PATCH status on tasks they're assigned to). Validate all request bodies with zod schemas defined in lib/validators/task.ts matching the tasks table schema.
```

### Prompt 9 — Task Creation & Edit UI
```
Build components/tasks/TaskFormModal.tsx — a modal/drawer form for creating and editing tasks with fields: title, description (rich text or plain textarea), assignee multi-select (fetches org members), priority select, due date picker, tags input, and a checklist/sub-task list. Include an "Enhance with AI" button next to the description field (wire it to a stub endpoint for now — real Groq integration comes in Phase 4). Use the shared UI component library (Button, Input, Select, Modal) styled per docs/04-UI-UX-DESIGN.md.
```

### Prompt 10 — Kanban Board
```
Build components/kanban/KanbanBoard.tsx with four columns (Pending, In Progress, In Review, Completed) rendering task cards per docs/04-UI-UX-DESIGN.md section 5 (title, assignee avatars, priority badge, due date, comment count). Implement drag-and-drop between columns using a lightweight DnD library, with optimistic UI update on drop followed by a PATCH call to /api/v1/tasks/[id] to persist the new status. Add a filter bar above the board (assignee, priority, tag, due date range) that filters client-side against the loaded task set.
```

### Prompt 11 — Supabase Realtime Sync
```
Add real-time sync to the Kanban board and task list: subscribe to postgres_changes on the tasks table filtered by org_id using the Supabase Realtime client, so that when any user in the org creates/updates/deletes a task, all connected clients update their local Zustand task store without a manual refresh. Handle reconnection gracefully and avoid duplicate state updates from the optimistic update + realtime echo.
```

### Prompt 12 — Comments & Attachments
```
Build the task detail view components/tasks/TaskDetail.tsx showing full task info, a comment thread (list + input, supporting @mention autocomplete of org members), and a file attachment uploader. Implement app/api/v1/tasks/[id]/comments/route.ts (GET/POST) and app/api/v1/tasks/[id]/attachments/route.ts (POST) — attachments upload directly to Cloudflare R2 using a presigned URL flow (generate presigned PUT URL server-side, upload from client, save the resulting file_url + file_name to task_attachments). Enforce a 10MB file size limit client- and server-side.
```

### Prompt 13 — Task Dependencies
```
Add basic task dependency support: in TaskFormModal, allow selecting other tasks in the same org as "depends on". Store in task_dependencies. In the task detail view, show blocked/blocking relationships and prevent a task from being dragged/moved to "In Progress" or "Completed" on the Kanban board if any of its dependencies are not yet Completed — show a toast explaining why the move was blocked.
```

---

## PHASE 3 — Dashboards & Notifications

### Prompt 14 — Admin & Manager KPI Dashboard
```
Build app/(admin)/dashboard/page.tsx showing: KPI cards (active tasks, overdue tasks, completion rate %, team productivity), and a productivity chart (tasks completed per day, last 30 days) using a lightweight charting library. Implement app/api/v1/dashboard/admin/route.ts that aggregates this data server-side scoped to org_id (and further scoped to team_id if the requester's role is 'manager'). Cache the aggregate response in Upstash Redis for 60 seconds to reduce DB load, with cache invalidation on task mutation.
```

### Prompt 15 — Employee Personal Dashboard
```
Build app/(employee)/dashboard/page.tsx showing three sections: "Due Today", "Upcoming (7 days)", "Recently Completed" — each pulling from /api/v1/dashboard/me. Keep the layout minimal and mobile-first per docs/04-UI-UX-DESIGN.md. Add a quick-status-update action directly on each task card (dropdown to change status without opening the full task detail modal).
```

### Prompt 16 — Notification System (In-App + Email)
```
Build the notifications system end-to-end: (1) a Postgres trigger function that inserts into the notifications table whenever a task is assigned, a comment mentions a user, a task becomes overdue, or a due date is within 24 hours; (2) components/notifications/NotificationBell.tsx with unread count and a dropdown list, polling or subscribing via Realtime; (3) app/api/v1/notifications/route.ts (GET list, PATCH mark-as-read); (4) an Edge Function/Route Handler that sends the corresponding email via Resend for each notification type, respecting each user's per-event-type email preference stored on their profile.
```

### Prompt 17 — Activity Log & Audit Trail
```
Add an activity_logs writer: a shared server-side helper lib/audit/log.ts that every mutating API route (tasks, comments, attachments, team management) calls after a successful write, recording actor_id, action, entity, entity_id, and a before/after diff as JSON. Build app/(admin)/activity/page.tsx showing a filterable, paginated table of this log (admin/manager only) with a CSV export button.
```

---

## PHASE 4 — AI Layer (Groq)

### Prompt 18 — Groq Client & Prompt Templates
```
Create lib/groq/client.ts wrapping the Groq API (model: llama-3.3-70b-versatile) with a simple chat-completion helper function. Create lib/groq/prompts.ts containing three versioned prompt templates as exported functions: enhanceTaskPrompt(rawText: string), workloadSuggestionPrompt(candidates: {name: string, openTaskCount: number}[]), and weeklySummaryPrompt(orgStats: object). Each function returns a well-structured system+user prompt pair ready to send to Groq. Do not hardcode any prompt text inline in API routes — always import from this file.
```

### Prompt 19 — AI API Routes with Rate Limiting
```
Implement app/api/v1/ai/enhance-task/route.ts and app/api/v1/ai/workload-suggestion/route.ts. Before calling Groq, check an Upstash Redis rate-limit bucket keyed by org_id (max 30 AI calls per org per hour on free tier) — if exceeded, return a 429 with a clear message. On Groq API failure or timeout (>5s), return a graceful fallback response (echo original text for enhance-task; return raw open-task counts without AI ranking for workload-suggestion) rather than erroring the whole request.
```

### Prompt 20 — Frontend AI Integration
```
Wire the "Enhance with AI" button in TaskFormModal to call /api/v1/ai/enhance-task and replace the description field with the AI-enhanced version (with an "Undo" option to revert to the original text). Wire the assignee picker to call /api/v1/ai/workload-suggestion when opened, showing a small "AI suggests: [Name] (least loaded)" hint above the assignee list. Show a subtle loading spinner during the call and a non-blocking toast if AI is rate-limited or unavailable — the form must remain fully usable without AI.
```

### Prompt 21 — Weekly AI Summary (Scheduled)
```
Create a scheduled job (Vercel Cron hitting app/api/v1/ai/weekly-summary/route.ts every Monday 8am) that, for each organization, aggregates last-7-days stats (completed count, overdue count, top blockers), calls Groq via weeklySummaryPrompt, and sends the resulting summary to all admins of that org via Resend. Log each run's success/failure to activity_logs with actor_id = null and action = 'system.weekly_summary'.
```

---

## PHASE 5 — Polish, PWA & Security

### Prompt 22 — Responsive QA & Dark Mode
```
Audit every page built so far (auth, admin dashboard, employee dashboard, Kanban, task detail, activity log) for mobile responsiveness (320px–768px), tablet, and desktop breakpoints. Fix any overflow, tap-target-size (<44px), or layout-break issues. Add full dark mode support using Tailwind's dark: variant across all components, toggled via a persisted user preference in Zustand + localStorage.
```

### Prompt 23 — PWA Setup
```
Add PWA support: create public/manifest.json with app name "TASQ-ONE", icons, theme color matching the primary token, and a service worker (via next-pwa or a hand-rolled minimal worker) that caches the last-loaded task list for offline read access. Ensure the app is installable (passes Lighthouse PWA checklist) and shows an "Install App" prompt component on supported browsers.
```

### Prompt 24 — RLS Isolation Test Suite
```
Write an automated test suite (using vitest or jest) in tests/rls/ that: creates two fake organizations (Org A, Org B) with one admin and one employee each via the Supabase service role, then attempts every combination of cross-org read/write (Org A's employee trying to read/update/delete Org B's tasks, comments, attachments, notifications) and asserts every single attempt is rejected. This suite must pass with zero failures before deployment.
```

### Prompt 25 — CI/CD Pipeline
```
Create .github/workflows/deploy.yml implementing: on push to main, run lint + typecheck + the RLS test suite (Prompt 24) + build; if all pass, auto-deploy to Vercel (or Cloudflare Pages) using their respective GitHub Action/CLI. Add a separate workflow for pull requests that runs lint + typecheck + tests but does not deploy. Confirm no AWS credentials or AWS CLI steps exist anywhere in these workflow files.
```

### Prompt 26 — PostHog Analytics
```
Integrate PostHog: initialize the client in app/layout.tsx (respecting a cookie-consent/opt-out toggle), and fire custom events for: org_signup_completed, task_created, task_status_changed, task_completed, ai_enhance_used, notification_clicked. Build a minimal internal debug page (dev-only, not shown in production nav) listing recently fired events for QA purposes.
```

### Prompt 27 — Final MVP Smoke Test
```
Run through and verify every acceptance criterion listed in docs/02-REQUIREMENTS.md section 5 end-to-end: signup-to-first-task under 5 minutes, real-time task visibility for assignee, Kanban drag-and-drop persistence, RLS isolation (already covered by Prompt 24's suite — re-run it), AI enhance-task under 3 seconds, overdue email notification firing correctly, and confirm the deployed app has zero AWS services and zero monthly cost at pilot scale (≤20 orgs). Produce a short markdown checklist report of pass/fail for each item.
```

---

## Bonus / Optional Prompts (Phase 2+ backlog — use later)

### Prompt 28 — Slack Notification Integration (Optional)
```
Add an optional Slack webhook integration: org settings page lets an admin paste a Slack Incoming Webhook URL, and task-assigned/overdue notifications are also posted to that Slack channel, alongside the existing in-app + email notifications, without breaking either if the Slack URL is not configured.
```

### Prompt 29 — Stripe Billing Prep (Optional, Phase 3)
```
Scaffold (but do not activate) a billing module: a subscriptions table (org_id, plan, status, stripe_customer_id, stripe_subscription_id), a /api/v1/billing/webhook route handling Stripe events, and a pricing page UI — all behind a feature flag defaulted to OFF, so the app continues to run at zero cost until this is explicitly enabled.
```

### Prompt 30 — Google Stitch → Component Reconciliation Pass
```
Review every UI component currently in components/ui/ against the screens generated in Google Stitch (docs/04-UI-UX-DESIGN.md section 7). Identify any visual drift (spacing, color, radius inconsistencies) between what Stitch generated and what was actually implemented, and produce a punch-list of fixes to bring the live app back in sync with the approved Stitch designs.
```

---

## Notes on Using This Library in Antigravity IDE
1. Keep `/docs` (this file + the other 5) in your repo root so Antigravity's context window can reference them — prompts above assume that context is available.
2. Run one prompt per IDE session/task where possible; verify output before moving to the next — dependencies compound (e.g., Prompt 8 needs Prompt 4/5 done correctly).
3. Every prompt is written to explicitly forbid AWS — if Antigravity ever suggests an AWS service (S3, Lambda, RDS), reject it and re-prompt referencing Cloudflare R2 / Edge Functions / Supabase instead.
4. Groq model names change over time — verify the current recommended model on Groq's docs before Prompt 18 if this is run much later than today.
