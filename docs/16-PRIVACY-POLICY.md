# TASQ-ONE — Privacy Policy

**Effective Date:** [Insert launch date]
**Last Updated:** August 31, 2026
**Applies to:** TASQ-ONE Work OS, available at [https://tasq-one.onrender.com](https://tasq-one.onrender.com) and any successor domain (the "Service")

> ⚠️ **Legal note:** This is a draft prepared for TASQ-ONE based on its actual architecture and data flows. It is not a substitute for review by a qualified lawyer licensed in India before publication, particularly the DPDP Act 2023 sections and any clauses affecting user rights.

---

## 1. Who We Are

TASQ-ONE ("we", "us", "our") is a multi-tenant task management Work OS operated from India (Delhi/Pune). This Privacy Policy explains what personal data we collect from you as a visitor, registered admin, manager, or employee user of TASQ-ONE, why we collect it, and what rights you have over it.

**Contact for privacy matters:** [tasqoneworkos@gmail.com](mailto:tasqoneworkos@gmail.com)

---

## 2. Data We Collect

### 2.1 Account & Organization Data (provided by you)
- Full name, email address, and password (stored as a salted hash — we never see or store your plaintext password) — collected at company registration (`/signup`) or when you accept a team invite (`/accept-invite`).
- Company/organization name, and any organization settings an admin configures.
- Role assignment (`admin`, `manager`, or `employee`) within your organization.

### 2.2 Content You Create
- Tasks, task descriptions, comments, checklists, due dates, priorities, and tags.
- File attachments you upload (stored in Cloudflare R2, tenant-isolated by organization).
- Any text you submit to the "Enhance with AI" feature (sent to our AI provider, Groq, for processing — see Section 4).

### 2.3 Automatically Collected Data
- Login timestamps, IP address, and device/browser information, for security and rate-limiting purposes (via Upstash Redis).
- Product usage analytics (page views, feature usage events) via PostHog — configured to avoid capturing full task/comment content in analytics events.
- Activity logs: every create/update/delete action is recorded with the actor's user ID and a timestamp, for audit and security purposes (see our Security Policy).

### 2.4 Data We Do NOT Collect
- We do not require or collect payment card details at this stage (TASQ-ONE currently operates on a ₹0 Free Starter Pilot model).
- We do not knowingly collect data from anyone under the age of 18 — TASQ-ONE is a business tool intended for working professionals (see Section 9).

---

## 3. How We Use Your Data

| Purpose | Legal basis (DPDP Act 2023) |
|---|---|
| Provide and operate the Service (task management, dashboards, notifications) | Performance of contract with you/your organization |
| Authenticate you and enforce role-based access control | Performance of contract |
| Send transactional emails (task assigned, overdue reminders, invite links, weekly summaries) | Performance of contract |
| Process your task text through Groq's AI to generate suggestions | Performance of contract, based on your organization's use of the AI feature |
| Detect and prevent abuse, fraud, or security incidents | Legitimate interest / legal obligation |
| Improve the Service through aggregated, privacy-conscious analytics | Legitimate interest |

We do not sell your personal data. We do not use your task content to train any public or third-party AI model.

---

## 4. Third Parties We Share Data With (Sub-Processors)

TASQ-ONE is built on the following infrastructure providers, each of which processes a limited slice of your data solely to provide the Service:

| Provider | Purpose | Data they process |
|---|---|---|
| **Supabase** | Database, authentication | All account, organization, and task data (encrypted at rest) |
| **Groq** | AI task-enhancement inference | Text you submit to the "Enhance with AI" / workload-suggestion features |
| **Upstash** | Rate limiting, caching | Request metadata (IP, user ID, timestamps) — not task content |
| **Cloudflare (R2)** | File attachment storage | Files you upload to tasks |
| **Resend** | Transactional email delivery | Your email address, and the content of notification emails |
| **Slack** (optional, org-configured) | Task-completion notifications | Task titles/summaries, only if your organization's admin configures a Slack webhook |
| **PostHog** | Product analytics | Anonymized/pseudonymized usage events |
| **Render** | Application hosting | All data in transit to/from the application server |

We do not permit any sub-processor to use your data for their own purposes beyond providing their service to us. If we add or change a sub-processor in a way that materially affects how your data is processed, we will update this policy and, where required by law, notify organization admins.

---

## 5. Data Residency & Security

- We aim to use data-hosting regions appropriate for Indian users where our providers support it, in line with DPDP Act expectations around data handling.
- All data in transit is encrypted via TLS/HTTPS.
- Multi-tenant data isolation is enforced at the database level via PostgreSQL Row-Level Security — no organization can access another organization's data through the application or API.
- See our separate **Security Policy** for full technical detail on how we protect your data.

---

## 6. Data Retention

- Account and task data is retained for as long as your organization maintains an active TASQ-ONE account.
- When an admin removes a team member, that person's profile is deactivated (soft-deleted) and their login access is revoked, but their historical task authorship and comments are retained for your organization's audit continuity, consistent with your organization's own record-keeping needs.
- If your organization closes its account, we will delete or anonymize your organizational data within [Insert retention period, e.g. 30/90 days], except where we are required to retain records for legal compliance.
- Activity/audit logs are retained for [Insert period] to support security investigations.

---

## 7. Your Rights (DPDP Act 2023 & General Principles)

Subject to applicable law, you have the right to:
- **Access** the personal data we hold about you.
- **Correct** inaccurate personal data.
- **Request erasure** of your personal data, subject to our legitimate need to retain records (e.g., audit logs, legal obligations).
- **Withdraw consent** for optional processing (e.g., analytics) where consent is the basis for that processing.
- **Data portability** — request an export of your task/account data in a common format.
- **Grievance redressal** — raise a complaint about how your data is handled.

To exercise any of these rights, contact us at [tasqoneworkos@gmail.com](mailto:tasqoneworkos@gmail.com). Note that if you are an employee/manager user, some data (e.g., your assigned tasks) is owned and controlled by your organization's admin — we may need to direct certain requests to your organization admin, as they are the data controller for your workspace content, while we act as data processor.

---

## 8. Cookies & Similar Technologies

We use essential cookies/local storage for session management (keeping you logged in) and, where enabled, analytics cookies via PostHog. We do not use third-party advertising cookies — TASQ-ONE does not run ads.

---

## 9. Children's Privacy

TASQ-ONE is a business productivity tool intended for use by working professionals aged 18 and above. We do not knowingly collect personal data from individuals under 18. If you believe a minor has provided us data, contact us and we will take steps to remove it.

---

## 10. Changes to This Policy

We may update this Privacy Policy from time to time. Material changes will be communicated to organization admins via email or an in-app notice. Continued use of the Service after a change takes effect constitutes acceptance of the revised policy.

---

## 11. Contact Us

For any privacy questions, data requests, or complaints:
**Email:** [tasqoneworkos@gmail.com](mailto:tasqoneworkos@gmail.com)
**Location:** Delhi / Pune, India
