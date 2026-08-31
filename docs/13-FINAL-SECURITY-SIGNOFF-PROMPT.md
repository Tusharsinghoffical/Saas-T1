# TASQ-ONE — Final Security Sign-Off Prompt

Continues numbering from `12-STRICT-RBAC-AUTH-REDESIGN-PROMPT.md` (Prompt 38 = auth redesign).

**Purpose:** This is the **last security gate before production go-live** — run it AFTER Prompt 38 is implemented, and treat its verdict as the actual launch decision. Everything before this (Prompt 34 audit, Prompt 35 remediation, Prompt 36 functional re-verify) checked the system as it existed at that point in time; this prompt re-checks the WHOLE system fresh, including everything Prompt 38 added, and is written to catch regressions the earlier prompts couldn't have known to look for.

Run this **before** executing Prompt 37's actual production deployment steps — you want this sign-off on the code that's about to go live, not on an earlier snapshot of it.

---

## Prompt 39 — Final Security Sign-Off (Pre-Launch Gate)

```
Act as a senior application security engineer performing the FINAL sign-off audit before TASQ-ONE goes to production. This is not a fresh audit from scratch — it's a targeted re-verification pass. Read docs/SECURITY-AUDIT-REPORT.md (with its Remediation Pass 1 section), docs/POST-REMEDIATION-VERIFICATION.md, and docs/AUTH-REDESIGN-REPORT.md first so you know what was already checked, then verify the current state of the actual code against all of it. Save the result as docs/FINAL-SECURITY-SIGNOFF.md.

### PART A — Confirm Prior Fixes Still Hold (Regression Check)
For each of the 10 fails fixed in Prompt 35 (privilege escalation, Slack SSRF, cron auth, cache-control, R2 tenant scoping, rate limiting, email verification, password policy, error leakage, security logging), re-inspect the actual current file and confirm the fix is STILL present and wasn't accidentally reverted or weakened by Prompt 38's changes. Flag any regression as Critical regardless of its original severity — a regression on a previously-fixed Critical item is worse than a never-fixed Medium.

### PART B — New Surface Area From Prompt 38 (Auth Redesign)
This is new attack surface that did not exist during Prompt 34's original audit — audit it fresh:
1. **Invite token security:** Confirm the employee invite link/token is single-use, expires within a reasonable window (e.g., ≤72 hours), is cryptographically random (not guessable/sequential), and is invalidated immediately after successful use OR after a new invite is issued to the same email (no stale valid tokens left active).
2. **Invite payload tampering:** Confirm the role and org_id assigned to an invited employee are set server-side from the inviting admin/manager's own session context at invite-creation time, and CANNOT be altered by anything the invitee controls during the "Accept Invite & Set Password" step (e.g., no hidden form field, query param, or request body field on that page that influences role/org_id).
3. **Invite permission boundary:** Confirm a manager who has permission to invite 'employee' cannot craft a request that invites someone as 'admin' or 'manager' — test this at the API layer directly (not just hidden by the UI not showing that option).
4. **Manager route isolation:** Confirm /manager/dashboard and its sub-routes are genuinely inaccessible to 'employee' role AND that /admin/dashboard is inaccessible to 'manager' role, at both middleware and RLS layers. Confirm the redirect-not-error-page behavior from Prompt 38 section 3 doesn't leak route existence via response timing or status code differences.
5. **Soft-delete correctness:** Confirm a "removed" employee (deleted_at set) genuinely cannot authenticate anymore (their Supabase auth.users record must actually be banned/disabled, not just their profiles row marked) — test this explicitly: soft-delete a test user, then attempt login with their still-known credentials, confirm it's rejected. Also confirm their historical tasks/comments/activity_log entries still render correctly (no broken references, no data loss) rather than erroring out.
6. **No orphaned self-registration paths:** Re-run the audit from Prompt 38 section 1 yourself — grep the entire app/ and domains/auth/ tree for any route or server action that creates a profiles row or auth.users record without going through either (a) the org-registration flow or (b) a validated, admin/manager-issued invite token. Zero exceptions allowed.

### PART C — Full-Stack Final Pass (abbreviated OWASP-style sweep)
Quick but real re-check across the categories from Prompt 34, specifically looking for anything Prompt 35/38's changes might have newly broken:
- Authentication (login, invite-accept, password reset) — session tokens issued correctly, no auth bypass introduced by the new invite-accept route.
- Authorization (RBAC across all 3 roles now, not just 2) — every domains/*/api/ controller's rbacGuard call updated to account for 'manager' as a distinct role where relevant, not silently treated as 'admin' or 'employee' by any leftover binary role check.
- Multi-tenancy (RLS) — re-run the full RLS test suite including all new tests added in Prompts 35 and 38, confirm 100% pass.
- Secrets — confirm no new env var or credential introduced by Prompt 38 (if any) is missing from .env.local.example or improperly exposed client-side.
- Input validation — confirm the new invite-accept password-setting form has the same password policy strength as the org-registration admin password field (no weaker path introduced for employees).
- Rate limiting — confirm the new invite-accept endpoint and any new auth-adjacent endpoints from Prompt 38 have rate limiting applied, not just the original login/signup routes from Prompt 35.

### PART D — Final Verdict
Produce a summary table (category | status | notes) covering Parts A, B, and C, then end the report with exactly one of:
- "✅ GO — CLEARED FOR PRODUCTION LAUNCH" (only if zero Critical/High findings remain across all three parts)
- "❌ NO-GO — N blocking issues" with each blocker listed, file-cited, and ranked by severity

If the verdict is GO, explicitly state: "Proceed to Prompt 37 (Zero-Cost Production Deployment & Go-Live Checklist)." If NO-GO, state exactly which blockers must be resolved and recommend re-running this Prompt 39 once more after fixes — do not proceed to deployment on a NO-GO verdict under any circumstance, including time pressure.
```

---

## Where This Sits in the Full Sequence
```
34  Advanced Security Audit
35  Security Remediation           ✅ done (97/100)
36  Post-Remediation Functional Re-Verification
38  Strict RBAC Auth Redesign (admin-only reg + employee-invite-only)
39  ★ FINAL SECURITY SIGN-OFF  ← you are here — run this now
37  Zero-Cost Production Deployment & Go-Live Checklist  ← only after 39 = GO
```

This is your actual launch gate — everything after Prompt 39 returning GO is pure deployment mechanics (Prompt 37), not security decision-making.
