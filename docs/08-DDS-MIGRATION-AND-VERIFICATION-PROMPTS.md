# TASQ-ONE — DDS Migration Prompt + Final Verification Prompt

Continues numbering from `06-ANTIGRAVITY-BUILD-PROMPTS.md` (Prompts 1–31 already run). Use these two prompts in order, in Antigravity IDE, with `docs/07-DDS-ARCHITECTURE.md` in the repo's `/docs` folder so the agent has the exact target structure.

---

## Prompt 32 — Migrate Current Codebase to Domain-Driven Structure (DDS)

```
Refactor the existing TASQ-ONE codebase to the Domain-Driven Structure defined in docs/07-DDS-ARCHITECTURE.md. Do this migration WITHOUT changing any external behavior (no API contract changes, no UI changes) — this is a pure internal restructuring.

Specifically:
1. Create the domains/ folder with six domains: auth, organization, users, tasks, notifications, activity — each with entities/, usecases/, repository/, api/ subfolders exactly as specified in docs/07-DDS-ARCHITECTURE.md section 3.
2. Move all existing business logic currently living inside app/api/v1/**/route.ts into the appropriate domain's usecases/ and repository/ files. Each route.ts file under app/api/v1/ must shrink down to just: parse request → call the matching domain controller in domains/*/api/ → return response. No business logic, validation, or direct Supabase calls should remain inside any app/api/v1/**/route.ts file.
3. Extract pure business rules (e.g., "a task cannot move to Completed if any dependency is not Completed", "an employee can only update status on tasks they're assigned to") out of API routes and into domains/tasks/entities/Task.ts and domains/tasks/usecases/ — these rules must not import Supabase, Next.js, or any framework code, per the layer rules in docs/07-DDS-ARCHITECTURE.md section 4.
4. Move all direct Supabase table queries into the matching domain's repository/ files (e.g., all raw queries against the tasks table move into domains/tasks/repository/taskRepository.ts). No domains/*/usecases/*.ts file should import the Supabase client directly — only repository/ files may do that.
5. Move the Groq client and prompt templates (currently in lib/groq/) into infrastructure/ai/, and update domains/tasks/usecases/enhanceTaskWithAI.ts and suggestAssignee.ts to call it through that infrastructure layer, not directly.
6. Move Upstash Redis, Cloudflare R2, and Resend clients into infrastructure/redis/, infrastructure/storage/, and infrastructure/email/ respectively, following the same pattern.
7. Move the existing lib/auth/guard.ts RBAC logic into shared/middleware/rbacGuard.ts, and ensure every domains/*/api/ controller calls it before invoking its usecase, passing an explicit { orgId, userId, role } context object as described in docs/07-DDS-ARCHITECTURE.md section 5 — do not let usecases read this context implicitly from a request object.
8. Keep components/, store/, and styles/ exactly where they are — they are NOT part of the domains/ restructuring per section 4 of the doc.
9. After the refactor, re-run the full RLS test suite (from Prompt 24) and confirm all tests still pass, since none of the database policies should have changed — only the application code layout.
10. Do not merge in any other project's code or folders during this refactor — TASQ-ONE only, as noted in docs/07-DDS-ARCHITECTURE.md section 6.

Output a short migration report listing every file that was moved/split and its new location.
```

---

## Prompt 33 — Final Verification & Implementation Audit

```
Perform a full audit of the TASQ-ONE codebase against everything specified in /docs so far. Do not fix anything silently — produce a markdown report (save it as docs/AUDIT-REPORT.md) with a pass/fail table for each item below, and for every FAIL, state exactly which file/line is responsible and what needs to change. Do not mark anything PASS unless you actually inspected the relevant code — no assumptions.

### A. Prompt-by-Prompt Implementation Check (Prompts 1–31 from docs/06-ANTIGRAVITY-BUILD-PROMPTS.md)
For each of the 31 prompts, confirm the described feature/file actually exists and functions as specified. List each prompt number with PASS/FAIL/PARTIAL and a one-line reason.

### B. Domain-Driven Structure Compliance (docs/07-DDS-ARCHITECTURE.md)
- Confirm all six domains (auth, organization, users, tasks, notifications, activity) exist with entities/, usecases/, repository/, api/ subfolders.
- Confirm no app/api/v1/**/route.ts file contains business logic or direct Supabase queries (grep for supabase client usage outside repository/ and infrastructure/ folders — flag every violation with file path).
- Confirm no domains/*/entities/*.ts or domains/*/usecases/*.ts file imports Supabase, Next.js server types, or any HTTP-framework-specific code.
- Confirm every domains/*/api/ controller calls shared/middleware/rbacGuard.ts before invoking its usecase.

### C. AWS-Free Confirmation
- Search the entire repo (package.json, source files, workflow files, env examples) for any AWS SDK package, AWS CLI reference, S3/Lambda/RDS/EC2/CloudFront mention. Report zero-tolerance: even a single leftover reference is a FAIL.

### D. Multi-Tenancy & Security
- Re-run the RLS isolation test suite (Prompt 24) and paste the actual pass/fail output.
- Confirm rate limiting (Upstash) is active on all AI endpoints and the general API layer.
- Confirm no Supabase service-role key is referenced anywhere in client-side/browser code.

### E. MVP Acceptance Criteria (docs/02-REQUIREMENTS.md section 5)
Re-verify all 7 acceptance criteria end-to-end and report actual measured results (e.g., actual signup-to-first-task time, actual AI response latency) — not estimates.

### F. Cost Confirmation
- List every third-party service currently wired into the project (Supabase, Vercel/Cloudflare, Upstash, R2, Resend, Groq, PostHog) and confirm each is on its free tier with current usage well within free-tier limits at pilot scale (≤20 orgs). Flag anything approaching a paid threshold.

### Final Section: Overall Readiness Verdict
End the report with one clear verdict: "READY FOR LAUNCH" or "NOT READY — N blocking issues" with the blocking issues numbered and prioritized by severity (security/data-isolation issues first, then functional bugs, then polish items).
```

---

## How to Read the Result
- If Prompt 33's audit report comes back with **any FAIL in Section B, C, or D** — fix those before anything else; they're structural/security issues, not cosmetic.
- Section A PARTIALs are your real remaining backlog — treat `docs/AUDIT-REPORT.md` as the source of truth over memory of what you think you built.
- Re-run Prompt 33 after fixes until the verdict is "READY FOR LAUNCH".
