# TASQ-ONE — Requirements Document

---

## 1. User Roles & Permission Matrix

| Capability | Admin | Manager | Employee |
|---|---|---|---|
| Create organization | ✅ | ❌ | ❌ |
| Invite/remove users | ✅ | ✅ (own team) | ❌ |
| Create/assign tasks | ✅ | ✅ | ❌ |
| Edit any task | ✅ | ✅ (own team's) | ❌ |
| Update own task status | ✅ | ✅ | ✅ |
| View team KPI dashboard | ✅ | ✅ (own team) | ❌ |
| View own dashboard | ✅ | ✅ | ✅ |
| Comment on tasks | ✅ | ✅ | ✅ |
| Delete tasks | ✅ | ✅ (own team) | ❌ |
| Manage RBAC roles | ✅ | ❌ | ❌ |
| View activity logs | ✅ | ✅ (own team) | ❌ |
| Configure org settings | ✅ | ❌ | ❌ |

---

## 2. Functional Requirements

### FR-1: Multi-Tenant Organization Management
- FR-1.1: A user can create a new Organization (tenant) on signup.
- FR-1.2: Each Organization has a unique `org_id`; all data rows carry `org_id` for isolation.
- FR-1.3: Admin can invite users via email; invite includes role assignment.
- FR-1.4: Org settings: name, logo, timezone, working days.

### FR-2: Authentication & Authorization
- FR-2.1: Email/password + magic link login via Supabase Auth.
- FR-2.2: JWT contains `org_id` and `role` claims.
- FR-2.3: RBAC middleware validates role on every protected API route.
- FR-2.4: Row-Level Security policies enforce `org_id` match on every table.

### FR-3: Task Management
- FR-3.1: Create task with: title, description, assignee(s), priority (Low/Med/High/Urgent), due date, dependencies, tags.
- FR-3.2: Task status lifecycle: `Pending → In Progress → In Review → Completed` (+ `Overdue` computed state).
- FR-3.3: Tasks support sub-tasks (checklist items).
- FR-3.4: File attachments (max 10MB/file, stored in Cloudflare R2).
- FR-3.5: Comment thread per task, with @mentions triggering notifications.
- FR-3.6: Task dependency blocking (task B can't start until task A is Completed) — Phase 1 basic, Phase 2 full DAG validation.

### FR-4: Kanban Board
- FR-4.1: Drag-and-drop between status columns updates task status in real time.
- FR-4.2: Board filterable by assignee, priority, tag, due date.
- FR-4.3: Real-time sync across all connected clients (Supabase Realtime).

### FR-5: Dashboards & KPIs
- FR-5.1: Admin dashboard: active tasks, overdue tasks, completion rate %, team productivity chart (last 7/30 days).
- FR-5.2: Employee dashboard: tasks due today, upcoming (next 7 days), completed count.
- FR-5.3: Manager dashboard: same as Admin, scoped to their team only.

### FR-6: Notifications
- FR-6.1: In-app notification bell with unread count.
- FR-6.2: Email notification via Resend for: task assigned, due-soon (24h before), overdue, @mention, comment reply.
- FR-6.3: Notification preferences per user (toggle email on/off per event type).

### FR-7: AI Layer (Groq)
- FR-7.1: "Enhance with AI" button on task creation rewrites raw notes into structured task description.
- FR-7.2: AI workload-balancing suggestion when assigning: shows each candidate's current open-task count and suggests least-loaded.
- FR-7.3: Weekly AI-generated summary email to Admin: what got done, what's overdue, risk areas.
- FR-7.4: AI calls are queued through Upstash Redis to respect Groq rate limits; UI shows graceful loading/fallback state if AI is unavailable.

### FR-8: Activity Logs & Audit Trail
- FR-8.1: Every create/update/delete/status-change is logged with actor, timestamp, before/after diff.
- FR-8.2: Admin can view/export activity log (CSV) per org.

---

## 3. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | API p95 response time < 300ms for reads, < 800ms for writes |
| Scalability | Support up to 500 orgs / 10,000 users on free tier before Phase 2 migration triggers |
| Security | JWT auth, RLS on every table, input sanitization (zod/valibot validation), HTTPS only |
| Availability | Best-effort 99% (free-tier SLA limitation documented to stakeholders) |
| Data Isolation | Zero cross-tenant data leakage — verified via automated RLS test suite |
| Accessibility | WCAG 2.1 AA color contrast, keyboard navigable Kanban |
| PWA | Installable, offline-capable read cache for last-loaded task list |
| Rate Limiting | Upstash Redis token-bucket: 100 req/min per user on API layer |
| Cost | $0 infra cost up to defined MVP scale threshold |

---

## 4. Data Entities (High-Level)

- `organizations` (id, name, logo_url, timezone, created_at)
- `users` (id, org_id, email, name, role, avatar_url, created_at)
- `teams` (id, org_id, name, manager_id)
- `team_members` (team_id, user_id)
- `tasks` (id, org_id, title, description, status, priority, due_date, created_by, team_id)
- `task_assignees` (task_id, user_id)
- `task_dependencies` (task_id, depends_on_task_id)
- `task_comments` (id, task_id, user_id, body, created_at)
- `task_attachments` (id, task_id, file_url, uploaded_by)
- `notifications` (id, user_id, type, payload, read_at)
- `activity_logs` (id, org_id, actor_id, action, entity, entity_id, diff, created_at)

(Full schema with types/constraints is in `03-ARCHITECTURE.md`.)

---

## 5. Acceptance Criteria (MVP Definition of Done)

1. A new user can sign up, create an org, and invite a teammate in under 5 minutes.
2. Admin can create a task, assign it, and the assignee sees it in real time without refresh.
3. Kanban drag-and-drop persists status change instantly (Supabase Realtime confirmed).
4. RLS test suite passes: user from Org A cannot read/write Org B's data under any role.
5. AI "Enhance with AI" returns a rewritten task description in < 3 seconds using Groq.
6. Overdue tasks are correctly flagged and trigger email notification.
7. Entire stack runs at $0/month at pilot scale (≤ 20 orgs).
