# TASQ-ONE — Auth Redesign & Strict RBAC Audit Report (Prompt 38)

**Date**: August 31, 2026  
**Status**: COMPLETE & VERIFIED (30/30 Tests Passed, 0 TypeScript Errors)

---

## 1. Executive Summary & Audit Baseline

In accordance with **Prompt 38 (Strict Admin-Only Registration + Employee-Invite-Only Auth Flow)**, TASQ-ONE's authentication and authorization architecture has been hardened against self-registration bypasses, cross-role navigation leaks, and referential data destruction.

### What Already Existed & Passed As-Is:
- **Atomic Org Creation (Prompt 6)**: `signup_organization_admin` PostgreSQL RPC continues to atomically initialize new company organizations and founding admin profiles.
- **RLS Policy Defenses (Prompt 35)**: Row-Level Security policies on `profiles`, `tasks`, `teams`, and `activity_logs` remain intact and enforced at the PostgreSQL engine level.
- **Tenant Isolation & Security Headers**: Multi-tenant RLS checks and cryptographic timing-attack mitigations (`timingSafeEqual`) on webhook listeners continue to pass all security assertions.

---

## 2. Architecture & Implementation Changes

### 1. Two Public Entry Points Only (No Self-Signup Loophole)
- **`app/(auth)/signup/page.tsx`**: Reframed exclusively as **"Register Your Company"** (Founding Admin Workspace Setup). Bare individual registration is completely disabled; any registration creates an organization.
- **`app/(auth)/login/page.tsx`**: Reframed exclusively as **"Employee & Team Login"**. Removed all "create account" and self-signup links.
- Audited all routes under `app/(auth)/`: No route or endpoint allows self-creating unattached user profiles outside of an invite or company registration.

### 2. Employee Creation — Admin/Manager-Invite-Only
- **Server-Enforced Role Hierarchy ([inviteUser.ts](file:///c:/Users/Acer/Music/TASQ-ONE/domains/users/usecases/inviteUser.ts))**:
  - `admin`: Can invite `admin`, `manager`, or `employee`.
  - `manager`: Can ONLY invite `employee`. Attempts to invite `admin` or `manager` are rejected with `ForbiddenError`.
  - `employee`: Cannot invite anyone (`ForbiddenError`).
- **Accept Invite Portal ([accept-invite/page.tsx](file:///c:/Users/Acer/Music/TASQ-ONE/app/(auth)/accept-invite/page.tsx))**:
  - Invited users receive a single-use expiring token.
  - Dedicated password setup page with real-time strength meter.
  - Profile is activated upon password creation with server-assigned `org_id` and `role`.

### 3. Strict 3-Way Role Confinement ([middleware.ts](file:///c:/Users/Acer/Music/TASQ-ONE/middleware.ts))
- **`admin`**: Confined to `/admin/*`. Access to `/manager/*` or `/employee/*` is silently redirected to `/admin/dashboard`.
- **`manager`**: Confined to `/manager/*`. Access to `/admin/*` or `/employee/*` is silently redirected to `/manager/dashboard`.
- **`employee`**: Confined to `/employee/*`. Access to `/admin/*` or `/manager/*` is silently redirected to `/employee/dashboard`.
- **Manager Route Group Added**:
  - `app/(manager)/layout.tsx`
  - `app/(manager)/manager/dashboard/page.tsx`
  - `domains/tasks/usecases/getManagerDashboard.ts`
  - `app/api/v1/dashboard/manager/route.ts`

### 4. Database Schema: Soft Delete & Referential Safety
- **Migration `0009_soft_delete_and_referential_safety.sql`**:
  - Added `deleted_at timestamptz default null` to `profiles`.
  - Added index `idx_profiles_active` on `profiles(org_id) where deleted_at is null`.
  - Added `organizations.created_by uuid references profiles(id) on delete set null` (with backfill).
- **Soft Delete Use Case ([removeUser.ts](file:///c:/Users/Acer/Music/TASQ-ONE/domains/users/usecases/removeUser.ts))**:
  - Soft-deletes user profile (`deleted_at = now()`).
  - Calls Supabase Auth Admin API to ban/disable auth login.
  - Active member queries in `userRepository.ts` filter `is("deleted_at", null)`.
  - Historical tasks, activity logs, and comments continue to display user names without broken links or cascades.

---

## 3. Verification & Test Results

### 1. 6-Way Cross-Role Access Matrix Test ([cross_role_routing.test.ts](file:///c:/Users/Acer/Music/TASQ-ONE/tests/rls/cross_role_routing.test.ts))

| Case | Requesting Role | Target Route | Expected Redirection | Result |
| :--- | :--- | :--- | :--- | :--- |
| **Case 1** | `admin` | `/manager/dashboard` | `/admin/dashboard` |  PASS |
| **Case 2** | `admin` | `/employee/dashboard` | `/admin/dashboard` |  PASS |
| **Case 3** | `manager` | `/admin/dashboard` | `/manager/dashboard` |  PASS |
| **Case 4** | `manager` | `/employee/dashboard` | `/manager/dashboard` |  PASS |
| **Case 5** | `employee` | `/admin/dashboard` | `/employee/dashboard` |  PASS |
| **Case 6** | `employee` | `/manager/dashboard` | `/employee/dashboard` |  PASS |
| **Authorized 1** | `admin` | `/admin/dashboard` | Null (Allow access) |  PASS |
| **Authorized 2** | `manager` | `/manager/dashboard` | Null (Allow access) |  PASS |
| **Authorized 3** | `employee` | `/employee/dashboard` | Null (Allow access) |  PASS |

### 2. Full Test Suite Execution (`npm test` / `vitest run`)

```
 RUN  v4.1.11 C:/Users/Acer/Music/TASQ-ONE

 ✓ tests/integration/services.test.ts (4 tests) 10ms
 ✓ tests/rls/multi_tenant_isolation.test.ts (6 tests) 15ms
 ✓ tests/rls/cross_role_routing.test.ts (16 tests) 17ms
 ✓ tests/domains/task_business_rules.test.ts (4 tests) 12ms

 Test Files  4 passed (4)
      Tests  30 passed (30)
   Duration  1.33s
```

### 3. Static Type Analysis (`npx tsc --noEmit`)
- TypeScript compiler output: **0 errors, 0 warnings**.
