# TASQ-ONE — Advanced Security Audit Prompt

Continues numbering from `08-DDS-MIGRATION-AND-VERIFICATION-PROMPTS.md`. Run this **after** Prompt 33 (Final Verification) comes back "READY FOR LAUNCH" — security audit should test a functionally-complete, DDS-structured codebase, not a half-built one.

This is your original prompt, enhanced: generic SaaS categories kept, but every category is now tied to TASQ-ONE's *actual* stack (Supabase Auth + RLS, Upstash Redis, Next.js Edge, Groq, Cloudflare R2, Resend), your DDS folder layout, and multi-tenant-specific attack vectors that a generic checklist misses (tenant isolation, JWT claim tampering, AI prompt injection, presigned-URL abuse).

---

## Prompt 34 — Senior AppSec Audit (Stack-Specific, Multi-Tenant SaaS)

```
Act as a senior application security engineer with SaaS/multi-tenant experience. Perform a comprehensive security audit of the TASQ-ONE codebase as it actually exists right now (not a generic checklist — inspect real files, real RLS policies, real API routes under domains/*/api/ and app/api/v1/**). Save the full report as docs/SECURITY-AUDIT-REPORT.md.

For EVERY item below: state PASS / FAIL / NOT-APPLICABLE, cite the exact file/line or Supabase policy inspected, assign a risk level (Low/Medium/High/Critical) for every FAIL, give a concrete fix (code snippet or config change, not vague advice), and note the modern best-practice this aligns to. Do not mark PASS without having actually inspected the relevant code — no assumptions, no generic filler.

### 1. Login & Brute-Force Protection
- Confirm Upstash Redis rate limiting is applied to /api/v1/auth/* (login, signup, magic-link) — not just the AI endpoints from Prompt 19. Check exact limits (requests/IP, requests/email) and whether they're bypassable via header spoofing or distributed IPs.
- Confirm Supabase Auth's built-in password hashing (bcrypt) is used unmodified — flag if any custom password handling exists anywhere in domains/auth/.
- Check for account lockout / progressive delay after repeated failed logins, and CAPTCHA (e.g., Cloudflare Turnstile — free tier, no AWS) on signup and login forms.

### 2. Signup, Verification & Input Validation
- Confirm email verification is enforced before a new admin/employee can access any (admin) or (employee) route — trace the actual check in middleware.ts and domains/auth/usecases/.
- Confirm every zod schema in domains/*/entities and shared/validators rejects unexpected fields (no silent pass-through of extra JSON keys into DB inserts).
- Test for duplicate/fake org creation abuse: can one email spam-create unlimited organizations? Confirm a rate limit or cooldown on /auth/signup-org.
- Check XSS: confirm all user-generated content (task titles, descriptions, comments) is rendered safely (React's default escaping intact, no dangerouslySetInnerHTML on unsanitized input anywhere in components/tasks/ or components/kanban/).

### 3. Session & Token Security
- Confirm JWT expiration and refresh-token rotation settings in the Supabase project match production norms (short-lived access token, e.g. ≤1hr; refresh token rotation enabled).
- Confirm session cookies (if used alongside/instead of localStorage token storage) are httpOnly, Secure, SameSite=Lax or Strict.
- Test session fixation: does a session ID/token issued before login remain valid and privilege-escalate after login?
- Confirm logout actually revokes the refresh token server-side (Supabase signOut with scope: 'global' where appropriate), not just client-side token deletion.

### 4. Error Handling & Information Leakage
- Grep every domains/*/api/ controller and app/api/v1/**/route.ts for raw error objects, stack traces, or Supabase/Postgres error messages being returned directly in HTTP responses. Every FAIL here is at least Medium risk (schema/table name leakage aids attackers).
- Confirm a centralized error handler in shared/middleware/ returns generic messages to the client while logging full detail server-side only.
- Confirm Supabase's service-role key, Groq API key, and Upstash/R2/Resend credentials never appear in any client-bundled code (search built .next output, not just source, since env vars without NEXT_PUBLIC_ prefix should never reach the browser bundle — verify this, don't assume Next.js handles it correctly).

### 5. Password Reset Flow
- Confirm reset tokens are single-use, short-expiry (Supabase default is reasonable — confirm it hasn't been overridden), and invalidate all other active sessions on successful reset.
- Test user enumeration: does the "forgot password" endpoint respond differently for a valid vs. invalid email? It must not (identical response/timing for both).

### 6. Multi-Factor Authentication (MFA)
- Confirm current MFA availability (Supabase supports TOTP-based MFA) — even if not enforced for MVP, confirm the enrollment flow works and document whether it's enforced for the 'admin' role specifically (recommended: require MFA for admin role given they control org-wide data and billing later).
- If MFA is not yet implemented, mark this NOT-YET-IMPLEMENTED (not FAIL) and add it to the Section-end priority list as a pre-Phase-2 requirement, since it wasn't in the original 31 build prompts.

### 7. Backend & API Security (Stack-Specific)
- **Authorization on every route:** For each route in app/api/v1/**, confirm shared/middleware/rbacGuard.ts is actually called (not just present in the codebase — trace the call chain) before any domain usecase executes. List any route missing this.
- **IDOR / cross-tenant access:** For task/comment/attachment/notification endpoints that take an :id param, confirm the repository query filters by BOTH id AND org_id (not id alone) — an attacker guessing a valid UUID from another org must still be rejected by RLS even if application code has a bug. Explicitly test this against RLS, not just application logic.
- **JWT claim tampering:** Confirm that a client cannot self-supply or modify the org_id/role claims (e.g., via a manipulated request body or header) to escalate privileges — these must come ONLY from the verified JWT set by the Auth Hook (Prompt 5), never trusted from request payloads.
- **SQL injection:** Confirm all Supabase queries use the parameterized query builder / RPC calls, with zero raw string-concatenated SQL anywhere in repository/ files.
- **CSRF:** Confirm state-changing API routes reject requests without a valid same-origin check or CSRF token if cookie-based sessions are used (less critical if using Bearer-token-in-header pattern exclusively — state which pattern TASQ-ONE actually uses and audit accordingly).
- **File upload abuse (Cloudflare R2):** Confirm presigned upload URLs are scoped (short expiry, single-use where possible, correct content-type/size constraints enforced server-side before URL generation, not just client-side per Prompt 12) and that uploaded file URLs served back to users can't be used to enumerate/access other orgs' files (path must include org_id and not be guessable).
- **AI/Groq-specific — prompt injection:** Since task titles/descriptions (user-controlled, cross-tenant-visible-to-nobody-but-attacker-controlled-text) get sent into Groq prompts (Prompt 18-19), confirm domains/tasks/usecases/enhanceTaskWithAI.ts and suggestAssignee.ts treat all user input as DATA, not instructions — check the prompt template in infrastructure/ai/prompts.ts properly delimits user content (e.g., clear delimiters/system-prompt separation) so a malicious task description can't hijack the system prompt or exfiltrate other prompt context. Flag if raw user text is concatenated directly into the system prompt string.
- **Rate limiting coverage:** Confirm Upstash rate limits exist not just on /ai/* (Prompt 19) but on ALL mutating endpoints (task create/update, comment/attachment upload, invite-user) to prevent abuse/spam at the free-tier's expense.

### 8. Logging & Monitoring
- Confirm activity_logs (domains/activity/) captures every security-relevant event: login, failed login, role change, org settings change, data export — not just task CRUD.
- Confirm PostHog (Prompt 26) events don't accidentally capture PII beyond what's needed (e.g., don't send full task descriptions or comment bodies as event properties).
- Confirm there is at least a basic suspicious-activity signal: e.g., N failed logins from one IP/email in T minutes gets logged distinctly from normal activity (even if automated alerting is a Phase 2 item, the log signal should exist now).
- Confirm logs are centralized somewhere queryable (Supabase table + PostHog is acceptable for MVP) rather than scattered across console.log calls with no retention.

### 9. Authorization / RBAC / Tenant Isolation (Deep Pass)
- Re-run the RLS isolation test suite (Prompt 24) and additionally add/verify NEW test cases for: (a) an employee attempting to modify another employee's task status, (b) a manager attempting to access another manager's team data within the SAME org, (c) a removed/deactivated user's token still being accepted after removal (test token revocation on user removal from org).
- Confirm privilege escalation is impossible: an employee cannot PATCH their own profile's `role` field to 'admin' via /api/v1/users — the role field must be admin-only-writable at both the API layer (rbacGuard) and RLS layer.
- Confirm the DDS boundary itself is a security asset, not just an org pattern: verify no domains/*/repository/ file for one domain directly queries another domain's table without going through that domain's own repository/usecase (this prevents a bug in e.g. `notifications` repository from bypassing `tasks` domain's own access rules).

---

### Required Report Structure (docs/SECURITY-AUDIT-REPORT.md)
1. Executive summary — total findings by risk level (Critical/High/Medium/Low counts)
2. Section-by-section findings table (Category | Item | Status | Risk | File/Policy Cited | Fix)
3. Top 5 "fix before launch" items, ranked by exploitability × impact
4. Items explicitly deferred to Phase 2 (e.g., MFA enforcement, CAPTCHA if not yet added) with justification
5. Final verdict: "SECURE FOR MVP LAUNCH" or "NOT SECURE — N critical/high blockers" with the blockers listed
```

---

## Notes
- This prompt assumes Prompts 1–33 (build + DDS migration + verification) are done — it audits real code, not a spec.
- Run this audit **again after every major feature addition** (Slack integration, Stripe billing, mobile app) — a security audit is a snapshot, not a one-time certificate.
- If Prompt 34's report comes back with any Critical/High finding, treat it like Section B/C/D failures from Prompt 33 — fix before deploying, no exceptions, even under launch-date pressure.
