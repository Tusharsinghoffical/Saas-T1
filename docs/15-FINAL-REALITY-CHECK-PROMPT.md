\# TASQ-ONE — Final Reality-Check & Independent Verification Prompt

Continues numbering from `14-ADVERSARIAL-PENTEST-QA-PROMPT.md` (Prompt 40 = pentest, self-reported 28/28 PASS).

## Why This Prompt Exists
The existing reports (`AUDIT-REPORT.md`, `FINAL-SECURITY-SIGNOFF.md`, `PENTEST-QA-REPORT.md`, `FINAL-PROJECT-REPORT.md`) are **self-graded by the same agent that built the code** — every single category across all four reports shows PASS/GO with zero exceptions, which is statistically unusual for a real audit and is a known failure pattern for agentic coding tools (the agent narrates success rather than proving it). Two concrete problems already found just from reading the docs, without touching code:

1. **A real Supabase `SUPABASE_SERVICE_ROLE_KEY` and anon key are pasted in plaintext inside `docs/PENDING-TASKS-AND-ROADMAP.md`** — this must be rotated immediately regardless of anything else in this prompt, and is itself proof that the "0 secrets leaked" claim in `PENTEST-QA-REPORT.md` (SUPP-02) is not reliable.
2. **`FINAL-PROJECT-REPORT.md` claims 100% READY and a live production URL**, while **`PENDING-TASKS-AND-ROADMAP.md`, dated the same day, lists Render deployment and live smoke testing as PENDING**. These cannot both be true.

This prompt does not ask Antigravity to grade itself again — it asks for raw, externally-checkable evidence for every claim, and to resolve the contradiction before anything is called "launch-ready."

---

## Prompt 41 — Independent Reality-Check (No Self-Grading)

```
Stop generating summary verdicts. For this pass, every claim must be backed by RAW COMMAND OUTPUT or a RAW HTTP RESPONSE pasted verbatim into the report — not a narrative sentence. If you cannot produce the raw evidence for a claim, mark it UNVERIFIED, not PASS.

### STEP 0 — Immediate Secret Rotation (do this first, before anything else)
1. Confirm whether docs/PENDING-TASKS-AND-ROADMAP.md (or any other file in the repo, including git history via `git log -p | grep -i "SUPABASE_SERVICE_ROLE_KEY\|eyJhbGci"`) contains a real, live secret value rather than a placeholder.
2. If found, immediately redact it from the working tree (replace with `<set in Render dashboard>` or similar placeholder) and report the exact commit(s)/file(s) where it appears in history, so it can be manually purged with `git filter-repo` or BFG and the underlying Supabase/Render key manually rotated by the human operator (you cannot rotate the actual Supabase key yourself — clearly state that this is a manual action required from the project owner, and list the exact dashboard path to do it).
3. Re-run SUPP-02's secret scan properly this time — actually grep full git history, not just the current working tree — and report the real result with the matched lines shown (redact the actual secret value in your report output, but confirm the pattern match location).

### STEP 1 — Resolve the Deployment Status Contradiction
FINAL-PROJECT-REPORT.md claims the app is live at https://tasq-one.onrender.com with 100% readiness. PENDING-TASKS-AND-ROADMAP.md (same date) lists Render deployment and smoke testing as PENDING. Determine which is actually true right now:
1. Attempt a real HTTP request to https://tasq-one.onrender.com/api/v1/health (via terminal curl or an HTTP MCP tool if connected) and paste the raw response (status code + body) — or report the raw connection error if it's not actually live.
2. If it is NOT live, correct FINAL-PROJECT-REPORT.md's claim and explain why it was reported as 100% ready with a live URL when it wasn't — this is itself a finding to document, since it means prior reports cannot be trusted at face value.
3. If it IS live, run the actual smoke test steps from PENDING-TASKS-AND-ROADMAP.md Section 3.2 for real (signup, task creation, employee view) against the live URL and paste real responses/screenshots-equivalent evidence, not a checkbox.

### STEP 2 — Re-Verify a Sample of "PASS" Claims With Raw Evidence
Do not re-verify everything (that would just repeat Prompts 34/39/40) — instead, pick 8 specific claims across the existing reports, weighted toward ones with no raw evidence currently shown, and get raw proof for each:
1. AUDIT-REPORT.md Section D.1: paste the ACTUAL current `npx vitest run tests/rls/` output right now (not the copy from the report — a fresh run).
2. PENTEST-QA-REPORT.md SUPP-01: paste the ACTUAL raw `npm audit --production` output (the report currently just says "Audit clean" with no pasted output — get the real one, including the full dependency tree summary line).
3. FINAL-SECURITY-SIGNOFF.md Part A.1: run the RLS policy definition query directly against the actual database schema file (or live DB via Postgres MCP if connected) and paste the actual current `profiles_self_update_policy` SQL, not a paraphrase.
4. AUTH-REDESIGN-REPORT.md Section 3: attempt a live request as an 'employee' role token to /manager/dashboard and /admin/dashboard and paste the actual HTTP response (status + redirect location), not the test file's assertion.
5. PENDING-TASKS-AND-ROADMAP.md D-04: reproduce the claimed prior bug ("22P02 invalid input syntax for type uuid") is actually fixed — show the exact code handling this now, with the specific validation logic, not just "eliminated."
6. Confirm which Supabase project is actually in current use — the docs reference TWO different project refs (`aifmumudpbnovfyslwuj.supabase.co` and `lycpumrwivhvtwmeywrr.supabase.co`). Determine which one is real/current, why two appear in the docs, and whether the "old" one still has live data/RLS policies that also need auditing or decommissioning.
7. FINAL-PROJECT-REPORT.md's "30/30 tests passing" — run the full suite fresh right now, paste the real terminal output with today's timestamp, and confirm it matches the count claimed.
8. Confirm CRON_SECRET, GROQ_API_KEY, and all other secrets referenced across every doc are NOT also pasted in plaintext anywhere else in /docs (repeat the Step 0 grep pattern across every .md file in the repo, not just PENDING-TASKS-AND-ROADMAP.md).

### STEP 3 — Produce the Reality-Checked Report
Save as docs/REALITY-CHECK-REPORT.md with:
- Step 0 result: secrets found/rotated/pending-manual-action, with exact locations.
- Step 1 result: TRUE current deployment status (not the conflicting prior claims).
- Step 2: the 8 claims with raw evidence pasted, and PASS / FAIL / UNVERIFIED for each based on what was actually observed, not what a prior report said.
- A short section explicitly listing every discrepancy found between this pass and the prior reports (AUDIT-REPORT.md, FINAL-SECURITY-SIGNOFF.md, PENTEST-QA-REPORT.md, FINAL-PROJECT-REPORT.md), since discrepancies matter more than the individual pass/fail counts — they reveal how much the self-graded reports can be trusted going forward.
- Final honest status line: "VERIFIED READY" only if Steps 0–2 all check out with real evidence; otherwise "NOT YET VERIFIED — see discrepancies" — do not use the word "GO" or "100%" unless every single item in this prompt has raw evidence behind it.
```

---

## What To Do With the Result
- If Step 0 finds the secret is real and live: treat this as a live incident, not a documentation cleanup — rotate first, ask questions later.
- If Step 1 shows the app isn't actually deployed yet: that's fine, it just means you're not as far along as `FINAL-PROJECT-REPORT.md` claimed — go back to Prompt 37's deployment checklist and actually run it, then come back to this reality-check.
- Treat every future "100%" or "GO" claim from the agent with the same skepticism from now on — ask for raw output by default, not narrative summaries, especially for security-relevant claims.
