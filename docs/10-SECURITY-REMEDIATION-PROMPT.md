# TASQ-ONE — Security Remediation Prompt

Continues numbering from `09-SECURITY-AUDIT-PROMPT.md` (Prompt 34 = audit, already run and returned `docs/SECURITY-AUDIT-REPORT.md` with 84/100, 8–10 fails depending on which count is correct).

## Findings Being Fixed (from your audit output)

| # | Issue | File | Risk |
|---|---|---|---|
| 1 | `profiles_update_policy` lets a user update their own `role`/`org_id` → self-promotion to admin | `supabase/migrations/0002_rls.sql:44-59` | **Critical** |
| 2 | Slack test-webhook handler checks `if (test)` before role/auth check → SSRF + unauthorized webhook probing | `domains/organization/api/orgController.ts:17-19` | High |
| 3 | Weekly-summary cron endpoint logs invalid token but still proceeds instead of returning 401 → unauthenticated Groq quota exhaustion | `domains/tasks/api/aiController.ts:19-27` | High |
| 4 | Admin dashboard API sets `Cache-Control: public, s-maxage=60` on tenant-private data → CDN cross-tenant cache risk | `app/api/v1/dashboard/admin/route.ts:17` | High |
| 5 | R2 presigned upload keys aren't prefixed with `org_id`, and task ownership isn't verified before issuing the URL → cross-tenant file access/overwrite | `domains/tasks/usecases/getPresignedUploadUrl.ts:16` | Critical |

Plus: the remaining un-detailed fails in **Login & Brute-Force (2)**, **Signup & Verification (2)**, **Error Handling (1)**, and **Logging (1)** categories that the report counted but didn't detail in the top-5 — Prompt 35 forces those into the open too.

---

## Prompt 35 — Full-Detail Remediation Pass

```
Open docs/SECURITY-AUDIT-REPORT.md and do the following, in order:

STEP 1 — Reconcile the report itself.
The executive summary table's per-category Fail counts (Login&Brute:2, Signup:2, Session:0, Error:1, PasswordReset:0, MFA:0, Backend&API:4, Logging:1, Authz:0) sum to 10, but the Total row states 8 Fail. Recount the actual FAIL rows in the full report body, correct the executive summary table to match reality, and state which number was wrong and why.

STEP 2 — Surface every FAIL, not just the top 5.
List ALL fails from every category (Login & Brute-Force, Signup & Verification, Error Handling, Backend & API Security, Logging & Monitoring) with the same level of detail as the top-5 list already produced: exact file/line, the issue, and the fix. Do not skip any — I need the full list before you touch code.

STEP 3 — Fix the 5 already-detailed critical/high issues:
1. In supabase/migrations, add a new migration that updates profiles_update_policy so a user can update their own profile row EXCEPT the role and org_id columns — those must only be updatable by an 'admin' role via a separate, explicitly role-checked policy/RPC. Use a WITH CHECK clause that compares old.role = new.role and old.org_id = new.org_id for the self-update policy, and a separate admin-only policy for role/org_id changes. Re-run the RLS test suite and add a new test case specifically asserting an employee cannot change their own role via direct table update.
2. In domains/organization/api/orgController.ts, move the requireRole(["admin"]) check to the very first line of the handler, before any branching on `test`. Additionally, in domains/organization/usecases/testSlackWebhook.ts (or wherever the webhook URL is validated), enforce that the URL must match the pattern ^https://hooks\.slack\.com/services/ before any outbound request is made, rejecting anything else with a clear validation error.
3. In domains/tasks/api/aiController.ts, change the invalid-cron-token branch from console.warn-and-continue to immediately returning a 401 Unauthorized response and stop execution — do not proceed to call Groq or query the database on an invalid/missing token.
4. In app/api/v1/dashboard/admin/route.ts, change the Cache-Control header to "private, no-cache, no-store, must-revalidate" (or remove caching entirely for this route, replacing it with the existing Upstash Redis short-TTL cache from Prompt 14, which is server-side and tenant-scoped by key — confirm that Redis cache key is namespaced by org_id, not global).
5. In domains/tasks/usecases/getPresignedUploadUrl.ts: (a) add a check that fetches the task by ID and verifies task.org_id === context.orgId before generating any presigned URL, returning a 403/404 if it doesn't match; (b) change the R2 object key format to `${context.orgId}/${taskId}/${Date.now()}-${safeName}` so tenant boundaries exist in the storage path itself, not just in the database reference.

STEP 4 — Fix every remaining fail surfaced in Step 2, applying the same standard: cite the file, explain the fix, implement it, and note which layer it lives in per the DDS rules in docs/07-DDS-ARCHITECTURE.md (entity/usecase/repository/api — don't put a security fix in the wrong layer, e.g. a business rule like "role can't self-update" belongs partly in the usecase layer as a guard AND in the RLS policy as defense-in-depth, not only in one place).

STEP 5 — Re-verify.
Re-run: the full RLS test suite (including the new role-escalation test case from Step 3.1), npm run lint, and a fresh pass of every check in docs/SECURITY-AUDIT-REPORT.md's Backend & API Security and Login & Brute-Force sections specifically (the two worst-scoring categories). Update docs/SECURITY-AUDIT-REPORT.md in place with a "Remediation Pass 1" section appended at the bottom: new pass/fail counts, corrected total score, and confirmation each of the 5+N fixes actually resolved the finding (re-tested, not just re-read).

Do not mark anything fixed unless you have a passing test or a direct re-inspection confirming it. If any fix is only partially possible right now (e.g., needs a manual Supabase Dashboard step), say so explicitly and give the exact manual step required.
```

---

## After This Runs
- If the corrected total is still below a score you're comfortable with, or any Critical/High remains open, re-run **Prompt 35 again** (it's idempotent — safe to re-run, Step 1–2 will just confirm what's already fixed).
- Once Backend & API Security and Login & Brute-Force both come back clean, re-run **Prompt 33** (Final Verification) once more end-to-end before considering TASQ-ONE launch-ready — a security fix pass can occasionally break an unrelated acceptance-criteria flow (e.g., the cron auth fix breaking the actual scheduled job if CRON_SECRET isn't set in the deploy environment — verify that too).
