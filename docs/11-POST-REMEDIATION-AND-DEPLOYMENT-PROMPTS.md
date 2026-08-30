# TASQ-ONE — Post-Remediation Verification & Production Deployment Prompts

Continues numbering from `10-SECURITY-REMEDIATION-PROMPT.md` (Prompt 35 = remediation, complete: 97/100, 14/14 tests, 0 TS errors).

---

## Prompt 36 — Post-Remediation Functional Re-Verification

```
Security Remediation Pass 1 is complete (docs/SECURITY-AUDIT-REPORT.md updated, 97/100). Before declaring launch-ready, re-run a FUNCTIONAL regression check — the security fixes touched auth middleware, RLS policies, and the cron endpoint, and none of those are covered by the RLS/security test suite's business-flow assumptions. Specifically:

1. Re-verify every MVP acceptance criterion from docs/02-REQUIREMENTS.md section 5 end-to-end, with special attention to:
   - Full signup → onboarding wizard flow, now that middleware.ts enforces email verification: confirm a brand-new admin can still complete org creation + invite teammates + create first task within the flow, and confirm the exact point at which "verify your email" is required does not silently block a legitimate new user. If it does block prematurely, fix the middleware to only gate (admin)/(employee) protected routes AFTER onboarding's minimum required step, not before.
   - Login flow with the new server-side rate limiting (FAIL 1 fix) and security event logging (FAIL 11 fix) in loginWithPassword.ts — confirm a normal user with a few mistyped-password attempts is NOT locked out or rate-limited (test with e.g. 3 failed attempts, well under any reasonable threshold), and confirm the security log entries are being written correctly to activity_logs without slowing down the login response noticeably.
   - Task creation with the new getPresignedUploadUrl.ts org-ownership check — confirm a legitimate same-org attachment upload still works end-to-end (upload succeeds, file is retrievable), not just that cross-org uploads are blocked.
   - Weekly AI summary cron: confirm CRON_SECRET is actually set in the deployment environment (Vercel/Cloudflare env vars) and that a real cron-triggered call (or a manually simulated one with the correct header) still succeeds and is not caught by the new hard-401 check meant only for invalid/missing tokens.
   - Slack test-webhook: confirm a real admin, testing a real Slack webhook URL they own, still successfully receives the test message after the auth-check reordering and URL-pattern restriction.

2. Re-run the full test suite (RLS + any others) one more time and confirm no regression: report exact pass count, matching what remediation reported (14/14) or explain any change.

3. Produce docs/POST-REMEDIATION-VERIFICATION.md with a simple PASS/FAIL per item above. Any FAIL here is a functional regression introduced by the security fix and must be corrected before moving to deployment — do not proceed to Prompt 37 until this file shows all PASS.
```

---

## Prompt 37 — Zero-Cost Production Deployment & Go-Live Checklist

Run only after Prompt 36 returns all PASS.

```
Prepare TASQ-ONE for a real, zero-cost production deployment (still no AWS anywhere). Walk through and execute/document each of the following, producing docs/DEPLOYMENT-CHECKLIST.md as you go with a checked/unchecked box per item and the exact value or command used (redact actual secret values, but confirm each was set):

### A. Supabase (Production Project)
- [ ] Create a separate Supabase PRODUCTION project (never reuse the dev project for production data).
- [ ] Apply every migration from supabase/migrations/ in order (0001 through the latest, including 0008_fix_privilege_escalation.sql) to the production project via `supabase db push` or the dashboard SQL editor — confirm final schema matches dev exactly.
- [ ] Re-register the Custom Access Token Auth Hook (Prompt 5) in the production project's Authentication > Hooks settings — this does NOT come along with a schema migration and must be manually re-linked.
- [ ] Re-run the RLS isolation test suite against the PRODUCTION project's connection string (with disposable test orgs you delete afterward) to confirm RLS behaves identically in production.

### B. Hosting (Vercel or Cloudflare Pages — confirm which one this project actually uses and proceed accordingly)
- [ ] Connect the GitHub repo, set the production branch to `main`.
- [ ] Set every environment variable from .env.local.example in the hosting provider's dashboard for the Production environment specifically (not just Preview): NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, GROQ_API_KEY, UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN, CLOUDFLARE_R2_*, RESEND_API_KEY, NEXT_PUBLIC_POSTHOG_KEY, and CRON_SECRET.
- [ ] Confirm the production Groq API key is separate from any dev/test key if Groq's dashboard supports key scoping, so dev experimentation never risks production rate limits.
- [ ] Set up the Vercel Cron (or equivalent) job for the weekly AI summary pointing at /api/v1/ai/weekly-summary with the Authorization header matching CRON_SECRET.

### C. Cloudflare R2
- [ ] Confirm the production R2 bucket is separate from any dev bucket.
- [ ] Set CORS policy on the bucket to only allow the production domain's origin for presigned upload PUT requests.

### D. Resend (Email)
- [ ] Verify the sending domain (SPF/DKIM/DMARC records) so emails don't land in spam — this is required for deliverability, not optional.
- [ ] Send one real test email through each notification type (assigned, due-soon, overdue, mention, weekly summary) to confirm formatting and deliverability in production.

### E. Domain & TLS
- [ ] Attach the custom domain to the hosting provider, confirm HTTPS/TLS is active (auto-provisioned by Vercel/Cloudflare — confirm, don't assume).

### F. Monitoring (Free Tier)
- [ ] Confirm PostHog production project is separate from dev, events flowing correctly.
- [ ] Set up a free uptime monitor (e.g., UptimeRobot free tier or Cloudflare's own health checks — no AWS CloudWatch) pinging the production URL every 5 minutes with an alert to your email.

### G. Final Go-Live Gate
- [ ] Re-confirm zero AWS services anywhere in the production configuration (not just code — check hosting provider's own add-ons/marketplace integrations too, some platforms silently offer AWS-backed add-ons).
- [ ] Re-confirm current usage against every free-tier limit (Supabase rows/DB size, Upstash commands/day, R2 storage/operations, Resend emails/month, Groq tokens/day, Vercel/Cloudflare bandwidth) with actual current numbers, not estimates, and flag anything within 70% of its free-tier ceiling.
- [ ] Final verdict at the bottom of docs/DEPLOYMENT-CHECKLIST.md: "LIVE" with the production URL, or "BLOCKED" with the exact remaining item.
```

---

## Sequence So Far (for reference)
1–31: Build (foundation → AI layer → PWA/security scaffolding)
32: DDS structure migration
33: Final implementation verification
34: Advanced security audit
35: Security remediation (✅ done — 97/100)
36: Post-remediation functional re-verification ← run this next
37: Production deployment & go-live checklist ← then this
