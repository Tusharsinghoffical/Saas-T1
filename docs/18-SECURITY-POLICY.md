# TASQ-ONE — Security Policy

**Last Updated:** August 31, 2026

This page describes, in plain terms, how TASQ-ONE protects your organization's data. It is written for customers and prospective customers evaluating TASQ-ONE's security posture — for the detailed internal engineering audit trail, see our internal `docs/SECURITY-AUDIT-REPORT.md` and related reports (available on request for enterprise due diligence).

> ⚠️ **Note on claims below:** Every item here should reflect the *actual, currently verified* state of the system — cross-check against your latest `docs/REALITY-CHECK-REPORT.md` before publishing this page externally. Do not publish a security claim that hasn't been independently, freshly verified — a public security page with an inaccurate claim is worse than no page at all.

---

## 1. Data Isolation (Multi-Tenancy)

Every organization's data on TASQ-ONE is isolated using **PostgreSQL Row-Level Security (RLS)** at the database engine level — not just in application code. Every query is scoped to your organization's ID, cryptographically verified via your session token. This means even in the event of an application-layer bug, the database itself refuses to return another organization's data.

## 2. Encryption

- All data in transit between your browser and TASQ-ONE is encrypted via TLS/HTTPS.
- Data at rest in our database (Supabase/PostgreSQL) and file storage (Cloudflare R2) is encrypted by our infrastructure providers.
- Passwords are never stored in plaintext — they are hashed using industry-standard algorithms via Supabase Auth (GoTrue).

## 3. Authentication & Access Control

- **Strict role-based access control (RBAC):** Every user is confined to exactly one of three roles — Admin, Manager, or Employee — each with clearly scoped permissions and dashboard access.
- **No open self-registration for team members:** Employees and managers can only join a Workspace via a secure, single-use, expiring invite link issued by an existing Admin or Manager. There is no way to create an unattached account.
- **Rate limiting:** Login, signup, and invite-related endpoints are protected by distributed rate limiting to defend against brute-force and credential-stuffing attempts.
- **Session security:** Sessions use secure, signed JSON Web Tokens; tampering with a token's contents is cryptographically detected and rejected.

## 4. Application Security Practices

- **Input validation:** All user input is validated against strict schemas before it reaches our database, mitigating injection-style attacks.
- **Parameterized queries only:** We use Supabase's parameterized query interfaces exclusively — no raw, string-concatenated SQL — to prevent SQL injection.
- **Output encoding:** User-generated content (task titles, comments) is rendered through React's built-in escaping, mitigating cross-site scripting (XSS).
- **File upload validation:** Uploaded attachments are validated for size and type before storage, and stored with tenant-scoped, non-guessable storage paths.
- **AI feature safeguards:** Text submitted to our AI-assisted features is processed with safeguards designed to prevent prompt injection from affecting other users or leaking system instructions.

## 5. Infrastructure & Monitoring

- TASQ-ONE runs on reputable, security-conscious infrastructure providers (Supabase, Cloudflare, Render, Upstash), each contractually/technically scoped to only the data they need to provide their function.
- Security-relevant events (logins, failed login attempts, role/permission changes) are recorded in an immutable audit log, visible to your organization's Admin.
- We conduct regular internal security reviews of our authentication, authorization, and multi-tenancy boundaries, including simulated adversarial testing before major releases.

## 6. Your Organization's Responsibilities

Security is a shared responsibility:
- Admins should use strong, unique passwords and remove departed employees' access promptly (TASQ-ONE's soft-delete removal immediately revokes their login).
- Admins are responsible for who they invite and what role they assign — TASQ-ONE enforces the technical boundary, but the judgment of who to trust with Manager/Admin access is your organization's.
- If you configure optional integrations (e.g., Slack webhooks), keep those webhook URLs confidential — they act as a credential.

## 7. Responsible Disclosure

If you believe you've found a security vulnerability in TASQ-ONE, we want to know before anyone else does. Please report it responsibly:

- **Email:** [tasqoneworkos@gmail.com](mailto:tasqoneworkos@gmail.com) with subject line "Security Disclosure"
- Please include: steps to reproduce, affected endpoint/feature, and potential impact.
- Please do **not** publicly disclose a vulnerability before we've had a reasonable opportunity to investigate and address it.
- We do not currently operate a paid bug bounty program, but we will acknowledge and credit responsible reporters (with permission).

## 8. Incident Response

In the event of a security incident affecting your data, we commit to:
1. Investigating and containing the issue as our top priority.
2. Notifying affected Workspace admins within a reasonable timeframe, consistent with our obligations under Indian law (including the DPDP Act 2023) and any applicable contractual commitments.
3. Providing a summary of the incident, its impact, and remediation steps once our investigation is complete.

## 9. Compliance

- TASQ-ONE is designed with the **DPDP Act 2023 (India)** in mind — see our Privacy Policy for details on data subject rights, retention, and sub-processors.
- As we grow, we intend to evaluate additional compliance frameworks (e.g., SOC 2) appropriate to our customer base — this is not yet in place at MVP stage, and we will not claim certifications we have not obtained.

## 10. Questions

For security questions, enterprise due-diligence requests, or to request our detailed internal audit documentation under NDA:
**Email:** [tasqoneworkos@gmail.com](mailto:tasqoneworkos@gmail.com)
