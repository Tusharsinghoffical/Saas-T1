# TASQ-ONE — Strict Role-Based Auth Redesign Prompt

Continues numbering from `11-POST-REMEDIATION-AND-DEPLOYMENT-PROMPTS.md` (Prompt 37 = deployment checklist).

**Important:** This is a **refine/harden pass**, not a rebuild. TASQ-ONE already has org-signup + admin-invite (Prompt 6) and RBAC guards (Prompt 7, hardened in Prompt 35). This prompt tightens it to the stricter model below and closes any gap where an employee could currently self-register.

**One deliberate correction vs. the raw spec:** passwords are never stored as a plain "password" column — Supabase Auth already handles hashed password storage internally. The "Users Table" concept below maps to the existing `profiles` table (role, organization_id, metadata) sitting on top of Supabase's own `auth.users` (which owns the password). Don't reintroduce a custom password column — that would be a regression from a system that's already secure.

---

## Prompt 38 — Strict Admin-Only Registration + Employee-Invite-Only Auth Flow

```
Act as a senior SaaS architect. Harden TASQ-ONE's existing authentication system (domains/auth/, domains/organization/, domains/users/, middleware.ts) to strictly enforce the following model. Audit the current implementation first and report what already satisfies each requirement vs. what needs to change — do not blindly rewrite working code.

### 1. Public Entry Point — Two Distinct, Separate CTAs Only
Redesign the landing/auth entry (app/(auth)/) so there are exactly two visible paths and nothing else:
- "Register Your Company" → the existing org-signup flow (Prompt 6), relabeled/reframed as company registration, admin-only.
- "Employee Login" → email/password (or magic-link) login ONLY. No signup form, no "create account" link, no way to reach a registration form from this page.
Audit every route under app/(auth)/ and confirm there is NO route, form, or API endpoint anywhere in the app that allows a new user to create their own profile/org membership outside the admin-invite path. If one exists (e.g., a leftover generic /signup that creates a bare user without going through organization creation or an invite), remove it or lock it behind admin-only invocation.

### 2. Employee Creation — Admin/Manager-Invite-Only
Confirm (or build, if missing) the full invite lifecycle:
- Admin/Manager creates an employee via an "Invite Employee" action (email + role picker, already scoped in Prompt 6's onboarding — extend it to be usable anytime post-onboarding too, not just during initial setup).
- This calls Supabase Auth's invite mechanism (service-role `inviteUserByEmail` or equivalent) to send a secure, single-use, expiring invite link — never a plaintext temporary password emailed directly.
- The invited employee clicks the link, lands on an "Accept Invite & Set Password" page (new, if not present), sets their own password there, and their profiles row (role='employee' or the role the admin assigned, org_id=inviting admin's org) is only finalized as active at that point — not before.
- Confirm this entire path enforces the SAME org_id/role assignment rules already hardened in Prompt 35 (an invite cannot be crafted client-side to grant 'admin' — the role is set server-side by the inviting admin/manager's own domains/auth usecase, validated against their own permission level: managers can only invite 'employee', only admins can invite 'manager' or another 'admin').

### 3. Strict Three-Way Role Routing
Update middleware.ts and the route-group structure so:
- role='admin' → redirected to and confined within /admin/dashboard and its sub-routes
- role='manager' → redirected to and confined within /manager/dashboard and its sub-routes (NEW route group if it doesn't exist yet — currently the codebase may only have (admin) and (employee) groups; add (manager) as its own group, reusing components/dashboard where the UI is identical to admin's but scoped, per the existing team-scoping logic from Prompt 14's getAdminDashboard.ts usecase — managers should hit a getManagerDashboard.ts usecase or a scoped variant, not the raw admin one).
- role='employee' → redirected to and confined within /employee/dashboard and its sub-routes
- Cross-role access must be impossible at the middleware layer (a manager hitting /admin/dashboard gets redirected to their own /manager/dashboard, not shown an error page that leaks that the route exists) AND at the rbacGuard/RLS layer underneath (defense in depth, consistent with Prompt 35's approach) — write/extend an RLS + middleware test asserting all 6 cross-role-access combinations (admin↔manager, admin↔employee, manager↔employee, both directions) are blocked.

### 4. Database Schema Adjustments (Soft Delete / Referential Safety)
Add a new migration (supabase/migrations/0009_soft_delete_and_referential_safety.sql) that:
- Adds a `deleted_at timestamptz` column to `profiles` (soft delete for users — never hard-DELETE a profiles row, since tasks/comments/activity_logs reference it).
- Changes the foreign key behavior so that removing/deactivating a user does NOT cascade-delete their historical tasks, comments, or activity_logs: `created_by` and `task_assignees.user_id` references should use `ON DELETE SET NULL` (or, since we're soft-deleting profiles rather than hard-deleting, ensure application code treats a `deleted_at IS NOT NULL` profile as "removed" everywhere without needing a DB-level cascade at all — prefer this over SET NULL where possible, since it preserves "who did this" history even after removal).
- Updates every domains/*/repository/ query that lists "active org members" (invite pickers, assignee selectors, team lists) to filter `WHERE deleted_at IS NULL`, while historical views (task detail showing "created by X", activity logs) continue to resolve and display the now-deactivated user's name rather than showing a broken/null reference.
- Adds a `removeUser` usecase in domains/users/usecases/ that performs the soft delete (sets deleted_at, and separately calls Supabase Auth admin API to ban/disable the auth.users record so they truly cannot log in anymore) instead of any hard DELETE — confirm no existing code path hard-deletes a profiles row anywhere in the app.
- Ensure `organizations.created_by` exists and is populated (add the column via migration if it's missing, backfill from the admin who has the earliest profiles.created_at in each org if needed for existing data).

### 5. Error Handling
- Confirm (per Prompt 35's fix for FAIL 5) that no raw Postgres/Supabase error (e.g., a foreign-key-violation error) is ever returned directly to the client — attempting to remove a referenced user must return a clean, generic error/success (since we're soft-deleting now, this scenario should actually always succeed, which further validates why soft-delete is the right model here vs. hard delete).

### 6. Output
Produce docs/AUTH-REDESIGN-REPORT.md listing: what already existed and passed as-is, what was changed, the new migration, new/updated tests for the 6 cross-role-access combinations, and confirm `npx vitest run` and `npx tsc --noEmit` are both clean after these changes.
```

---

## Why This Doesn't Conflict With What's Already Built
- Org-signup (Prompt 6) stays — it becomes the "Register Your Company" CTA, not a new thing.
- Admin-invite (Prompt 6/7) stays — this prompt extends it into a proper invite-acceptance flow and closes the loophole of any stray self-signup path.
- RLS + RBAC hardening from Prompt 35 stays — this prompt adds the manager route group and 6-way cross-role test on top of that same foundation, it doesn't redo it.
- The DB "concept change" you asked for is real, though: moving from implicit hard-delete risk to an explicit soft-delete model is a genuine schema/behavior change, captured in migration `0009`.
