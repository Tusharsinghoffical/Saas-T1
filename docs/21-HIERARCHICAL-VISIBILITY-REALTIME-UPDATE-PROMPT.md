# TASQ-ONE — Hierarchical Visibility & Real-Time Dashboard Sync Prompt

Continues numbering from `15-FINAL-REALITY-CHECK-PROMPT.md` (Prompt 41 = reality-check).

## Context
The role hierarchy (Admin governs org → Manager governs team → Employee executes, control flows down / visibility flows up) is already implemented per `01-PRD.md`, `07-DDS-ARCHITECTURE.md`, and Prompts 6–17. This prompt closes two specific gaps between that hierarchy's *stated* requirement (instant bottom-up visibility, explicit manager-employee scoping) and what was actually built (a 60-second cached dashboard, and team-based rather than guaranteed-complete manager scoping).

---

## Prompt 42 — Close the Real-Time Visibility & Manager-Scoping Gaps

```
Audit and fix two specific gaps in TASQ-ONE's role hierarchy implementation, without redesigning the existing architecture:

### GAP 1 — Dashboard Real-Time Sync (currently cached, needs to be instant)
Current state: domains/tasks/usecases/getAdminDashboard.ts and getManagerDashboard.ts (Prompt 14) cache their aggregate response in Upstash Redis for 60 seconds. This means an employee's task update can take up to 60 seconds to appear in their Manager's or Admin's KPI dashboard — this does not meet the "instant bottom-up visibility" requirement.

Fix this WITHOUT simply deleting the cache (the cache exists for a real performance reason — recomputing full KPI aggregates on every dashboard view is expensive at scale). Instead:
1. Split the dashboard into two parts: (a) the expensive aggregate chart data (productivity over 30 days, completion rate trends) — KEEP this on the existing 60-second Redis cache, since historical trend data doesn't need sub-second freshness; (b) the live counters (active task count, overdue count, most-recently-updated tasks list) — REMOVE these from the cached response and instead subscribe to them client-side via Supabase Realtime (the same postgres_changes pattern already used for the Kanban board in Prompt 11), scoped to org_id (Admin dashboard) or org_id + team_id (Manager dashboard).
2. On the Admin/Manager dashboard components, wire a Realtime subscription that listens for INSERT/UPDATE on the tasks table (and task_assignees for reassignment) and updates the live counters in the Zustand store immediately when an Employee changes a task's status — mirroring exactly how the Kanban board already does this, so you're reusing an established pattern, not inventing a new one.
3. Also invalidate the 60-second Redis cache immediately (not just letting it expire) whenever a task status changes, so the next full dashboard load (e.g., after a page refresh) also reflects the change rather than waiting out the remaining cache TTL.
4. Confirm the Employee's own dashboard (getEmployeeDashboard.ts, Prompt 15) was already real-time or fast-refreshing — if it also has unnecessary caching on live counts, apply the same fix there for consistency, since the hierarchy's visibility requirement is bidirectional in spirit even though the doc emphasizes bottom-up.

### GAP 2 — Guarantee Every Employee Has a Manager/Team Assignment
Current state: manager-scoped visibility works through teams + team_members, which is more flexible than a single manager_id field, but nothing currently guarantees an employee is actually assigned to a team — an employee with no team_members row would be invisible to every Manager's dashboard and task list, while still being a fully valid org member visible to the Admin.

1. Add a database constraint or application-level invariant (your choice, but document which) that flags/prevents an 'employee' or 'manager' role profile from remaining in a "no team assigned" state beyond the initial invite-acceptance moment — e.g., either (a) require a team_id to be set at invite time (extend the invite flow so an Admin/Manager inviting someone must also assign them to a team), or (b) create a default "Unassigned" team per organization that new members land in until explicitly assigned, so the manager-scoping logic never has an undefined case.
2. Add a query/report accessible to Admins (can be a simple addition to the existing Team Management page from Prompt 6's onboarding or a new small widget) showing any current employees/managers with no team assignment, so this can't silently happen and go unnoticed on existing data.
3. Add a migration to handle any CURRENTLY existing profiles with no team_members row (audit the live/current database via Postgres MCP or a query script, and either backfill them into a default team or flag them explicitly in the audit output for manual Admin action — do not silently leave them in an ambiguous state).
4. Confirm (write a test if one doesn't exist) that a Manager's dashboard and task list genuinely only shows employees within their own team(s) — not accidentally all org employees — since this is the core "Manager cannot access data outside their assigned scope" invariant from the hierarchy description.

### Verification
1. Manually (or via Playwright MCP if available) simulate: Employee updates a task status → confirm it appears in the Manager's dashboard live counter within the same page session, no refresh needed, and within Admin's dashboard too (Admin has org-wide visibility per the "Admin bypasses restrictions within their org" rule already implemented in RLS).
2. Re-run the RLS + cross-role test suite to confirm nothing in Gap 1/2's changes weakened tenant isolation or role scoping.
3. Produce docs/HIERARCHY-VISIBILITY-REPORT.md documenting: what was fixed, the before/after latency for dashboard updates (measure it, don't estimate), and confirmation that every current employee/manager profile now has a resolvable team assignment (count of profiles fixed by the Gap 2 migration, if any).
```

---

## Note
This is a refinement prompt, not a new build — it assumes Prompts 1–41 are already implemented. If dashboard real-time sync or team-assignment guarantees were somehow already fully solved in an earlier pass (worth checking before assuming the gap exists — re-read `getAdminDashboard.ts` and the team-assignment flow first), report that instead of making redundant changes.
