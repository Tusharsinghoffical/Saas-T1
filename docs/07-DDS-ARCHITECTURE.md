# TASQ-ONE — Domain-Driven Structure (DDS) Architecture Document

## 1. Executive Summary

This document defines the **Domain-Driven Structure (DDS)** for **TASQ-ONE**.
The purpose of this architecture is to decouple business logic from web frameworks (Next.js), database systems (Supabase Postgres), and cloud integrations (Groq AI, Upstash Redis, Cloudflare R2, Resend).

All external behavior, API contracts, and user interfaces remain strictly unchanged.

---

## 2. Architectural Layers & Dependency Inversion

```
┌─────────────────────────────────────────────────────────────┐
│                       PRESENTATION                          │
│   Next.js App Router (app/api/v1/**/route.ts, app/pages)    │
│   - Receives HTTP request / NextRequest                     │
│   - Delegates to Domain API Controllers                     │
│   - Returns NextResponse / JSON                             │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                    DOMAIN CONTROLLERS                       │
│   domains/*/api/*Controller.ts                              │
│   - Enforces RBAC via shared/middleware/rbacGuard.ts        │
│   - Validates input DTOs (Zod)                              │
│   - Builds explicit { orgId, userId, role } context         │
│   - Invokes Domain Use Cases                                │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                     DOMAIN USE CASES                        │
│   domains/*/usecases/*.ts                                   │
│   - Orchestrates domain workflow                            │
│   - Calls Domain Entities for pure business rules           │
│   - Interacts with Repositories & Infrastructure interfaces │
│   - NEVER imports Next.js, HTTP headers, or Supabase        │
└─────────────┬───────────────────────────────┬───────────────┘
              │                               │
┌─────────────▼───────────────┐ ┌─────────────▼───────────────┐
│       DOMAIN ENTITIES       │ │      DOMAIN REPOSITORIES    │
│   domains/*/entities/*.ts   │ │   domains/*/repository/*.ts │
│   - Pure business rules     │ │   - Encapsulates Supabase   │
│   - State transition guards │ │     queries and table ops   │
│   - Dependency invariants   │ │   - Maps DB rows to Domain  │
│   - ZERO external imports   │ │     Entities / DTOs         │
└─────────────────────────────┘ └─────────────┬───────────────┘
                                              │
┌─────────────────────────────────────────────▼───────────────┐
│                    INFRASTRUCTURE LAYER                     │
│   infrastructure/                                           │
│   - infrastructure/supabase/ (DB Client, Admin Client, RLS) │
│   - infrastructure/ai/ (Groq LLM Client & Prompts)          │
│   - infrastructure/redis/ (Upstash Redis Rate Limit & Cache)│
│   - infrastructure/storage/ (Cloudflare R2 SigV4 Storage)   │
│   - infrastructure/email/ (Resend Transactional Email)      │
│   - infrastructure/slack/ (Slack Webhook Client)            │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Domain Package Specifications

TASQ-ONE is partitioned into six core domain packages located in `domains/`:

### 1. `domains/auth/`
- **Responsibilities**: User authentication, organization creation, onboarding completion, password & magic link authentication.
- **Subfolders**:
  - `entities/`: `AuthSession.ts`, `UserCredentials.ts`
  - `usecases/`: `signupOrg.ts`, `loginWithPassword.ts`, `loginWithMagicLink.ts`, `completeOnboarding.ts`
  - `repository/`: `authRepository.ts`
  - `api/`: `authController.ts`

### 2. `domains/organization/`
- **Responsibilities**: Organization settings, timezone, Slack notification preferences, Stripe subscriptions & billing webhook handling.
- **Subfolders**:
  - `entities/`: `Organization.ts`, `OrgSettings.ts`, `Subscription.ts`
  - `usecases/`: `getOrgSettings.ts`, `updateOrgSettings.ts`, `testSlackWebhook.ts`, `handleStripeWebhook.ts`
  - `repository/`: `orgRepository.ts`, `subscriptionRepository.ts`
  - `api/`: `orgController.ts`, `billingController.ts`

### 3. `domains/users/`
- **Responsibilities**: User profiles, team members, member invitation, role management.
- **Subfolders**:
  - `entities/`: `UserProfile.ts`, `Team.ts`
  - `usecases/`: `listOrgMembers.ts`, `getUserProfile.ts`
  - `repository/`: `userRepository.ts`
  - `api/`: `userController.ts`

### 4. `domains/tasks/`
- **Responsibilities**: Task CRUD, task status transitions, dependency validation, assignees, comments, attachments, AI enhancement, AI workload recommendation, weekly executive summaries, admin KPI & employee personal dashboards.
- **Subfolders**:
  - `entities/`: `Task.ts` (Pure business rules for dependency completion, assignee status permissions, and priority validations), `Comment.ts`, `Attachment.ts`
  - `usecases/`: `listTasks.ts`, `createTask.ts`, `getTaskById.ts`, `updateTask.ts`, `deleteTask.ts`, `listComments.ts`, `addComment.ts`, `listAttachments.ts`, `getPresignedUploadUrl.ts`, `saveAttachment.ts`, `enhanceTaskWithAI.ts`, `suggestAssignee.ts`, `generateWeeklySummary.ts`, `getAdminDashboard.ts`, `getEmployeeDashboard.ts`
  - `repository/`: `taskRepository.ts`, `commentRepository.ts`, `attachmentRepository.ts`, `dashboardRepository.ts`
  - `api/`: `taskController.ts`, `commentController.ts`, `attachmentController.ts`, `aiController.ts`, `dashboardController.ts`

### 5. `domains/notifications/`
- **Responsibilities**: In-app notifications list & mark-read, transactional notification email dispatching via Resend.
- **Subfolders**:
  - `entities/`: `Notification.ts`, `NotificationPreferences.ts`
  - `usecases/`: `listNotifications.ts`, `markNotificationsAsRead.ts`, `dispatchEmailNotification.ts`
  - `repository/`: `notificationRepository.ts`
  - `api/`: `notificationController.ts`

### 6. `domains/activity/`
- **Responsibilities**: System and user audit logs, paginated activity query, CSV export generation, immutable event recording.
- **Subfolders**:
  - `entities/`: `ActivityLog.ts`
  - `usecases/`: `listActivityLogs.ts`, `exportActivityLogsCsv.ts`, `recordActivityLog.ts`
  - `repository/`: `activityRepository.ts`
  - `api/`: `activityController.ts`

---

## 4. Layer Constraints & Rules

1. **Entities Layer (`domains/*/entities/`)**:
   - MUST contain pure TypeScript classes, interfaces, and validation functions.
   - MUST NOT import Supabase, Next.js, HTTP libraries, or third-party I/O modules.
   - Encapsulates business invariant rules (e.g. `canTransitionToStatus()`, `verifyDependenciesCompleted()`, `canEmployeeUpdateTask()`).

2. **Use Cases Layer (`domains/*/usecases/`)**:
   - MUST accept an explicit caller context `{ orgId, userId, role }` and input DTOs.
   - MUST NOT import Next.js (`NextRequest`, `NextResponse`, `cookies`, `headers`).
   - MUST NOT directly import Supabase clients (`createClient`, `createAdminClient`).
   - Interacts with database exclusively through `repository/` interfaces.
   - Interacts with AI, Redis, R2, Email exclusively through `infrastructure/` abstractions.

3. **Repositories Layer (`domains/*/repository/`)**:
   - Encapsulates all SQL and Supabase Postgres table queries.
   - Responsible for mapping raw database rows into domain models and handling mock fallbacks.

4. **API Controllers Layer (`domains/*/api/`)**:
   - Invokes `shared/middleware/rbacGuard.ts` to authenticate request and check permissions.
   - Parses input arguments / query params / request bodies.
   - Dispatches to matching use case with explicit `{ orgId, userId, role }` context.
   - Returns structured API response DTOs `{ success, data, error }`.

5. **Route Handlers (`app/api/v1/**/route.ts`)**:
   - Thin glue layer only (parse request $\rightarrow$ call matching controller $\rightarrow$ return `NextResponse.json`).
   - ZERO direct business rules or Supabase calls.

6. **Components, Stores, and Styles**:
   - `components/`, `store/`, `styles/` remain in place and are untouched by backend domain restructuring.

---

## 5. Explicit Context Passing Standard

Every domain controller resolves authentication via `rbacGuard` and passes an explicit session context to use cases:

```typescript
export interface RequestContext {
  userId: string;
  orgId: string;
  role: "admin" | "manager" | "employee";
  email: string;
}
```

Use cases MUST NOT read context from global state or request objects.

---

## 6. Project Scope & Isolation

This domain-driven architecture applies exclusively to **TASQ-ONE**. No foreign project modules or AWS SDK dependencies are introduced.
