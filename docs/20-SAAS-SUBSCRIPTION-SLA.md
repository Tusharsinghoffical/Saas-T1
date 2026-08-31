# TASQ-ONE — SaaS Subscription & Service Level Agreement (SLA)

**Last Updated:** August 31, 2026

This document describes the commercial subscription structure of TASQ-ONE and the service-level commitments attached to each plan. This is the "SaaS product" document referenced across our other policies — read alongside the Terms of Service, Privacy Policy, Security Policy, and Acceptable Use Policy.

> ⚠️ **Legal note:** Especially the uptime/credit commitments below should be reviewed by a lawyer and only published once you're confident you can actually meet them on your current infrastructure (free-tier hosting has real availability limitations — don't promise more than Render/Supabase/Cloudflare free tiers can actually deliver).

---

## 1. Subscription Plans

### 1.1 Free Starter Pilot (Current, Active)
- **Price:** ₹0/month
- **Team size:** Up to 5 members per Workspace
- **Includes:** Unlimited tasks and Kanban boards, core Groq AI Task Decomposer, full RLS-based data security, PWA access, in-app + email notifications.
- **No credit card or payment mandate required.**
- **Support:** Best-effort community/email support (see Section 4).

### 1.2 SMB Pro Tier (Planned — Phase 2)
- **Price:** ₹999/month (indicative — subject to change before launch)
- **Includes:** Unlimited team members, priority AI processing, automated Slack release cards, 10GB Cloudflare R2 storage.
- **Not yet available** — this SLA section will be finalized and re-published before this tier goes live.

### 1.3 Enterprise Scale (Planned — Phase 2)
- **Price:** ₹2,499/month (indicative — subject to change before launch)
- **Includes:** Custom domain support, SSO, immutable audit log export, dedicated SLA terms (to be negotiated per enterprise customer).
- **Not yet available.**

---

## 2. Service Availability Commitment

### 2.1 Free Starter Pilot
- The Free Starter Pilot is offered on a **best-effort basis**. We do not commit to a specific uptime percentage or service credits at this tier, consistent with operating on free-tier cloud infrastructure (Render, Supabase, Upstash, Cloudflare, Resend, Groq free tiers).
- We will make reasonable efforts to maintain high availability and to communicate planned maintenance windows in advance where possible.

### 2.2 Future Paid Tiers
- Once paid tiers launch, we intend to commit to a stated uptime target (e.g., 99.5% monthly uptime, to be finalized based on our infrastructure at the time) with defined service credits for shortfalls, published in an updated version of this SLA.
- Enterprise customers may negotiate custom SLA terms as part of a separate agreement.

### 2.3 Exclusions from Any Uptime Commitment
Regardless of tier, the following are excluded from any uptime calculation:
- Scheduled maintenance windows communicated at least [Insert notice period] in advance.
- Outages caused by third-party sub-processor failures outside our reasonable control (e.g., a Supabase or Cloudflare regional outage).
- Force majeure events.
- Issues caused by your own network, browser, or misconfiguration (e.g., a misconfigured Slack webhook).

---

## 3. Data Backup & Recovery

- Your Workspace data is stored in Supabase's managed PostgreSQL, which includes provider-level backup mechanisms.
- We recommend Workspace admins periodically export critical data (e.g., via the Activity Log CSV export) as an additional safeguard, especially during the Free Starter Pilot phase where no formal backup SLA is offered.
- In the event of data loss due to our error, we will make reasonable efforts to restore from the most recent available backup, but do not guarantee zero data loss on the Free tier.

---

## 4. Support

| Tier | Support channel | Target response time |
|---|---|---|
| Free Starter Pilot | Email ([tasqoneworkos@gmail.com](mailto:tasqoneworkos@gmail.com)) | Best-effort, no guaranteed SLA |
| SMB Pro (planned) | Priority email support | Target: within 1 business day (to be finalized at launch) |
| Enterprise (planned) | Dedicated support channel | Custom, per enterprise agreement |

---

## 5. Onboarding & Implementation

- Free Starter Pilot Workspaces are self-service: company registration to first task creation is designed to take under 5 minutes with no assisted onboarding required.
- Future Enterprise customers may receive guided onboarding as part of their negotiated agreement (not yet defined — to be scoped per customer at that time).

---

## 6. Changes to Plans & Pricing

- We will provide advance notice to Workspace admins before:
  - Introducing a paid tier that affects features currently available for free.
  - Changing the pricing of an existing paid tier.
- Your continued use after a plan change takes effect, where you have been given the required notice and the opportunity to review the change, constitutes acceptance — except where a change requires your affirmative consent (e.g., moving from a free to a paid plan), which will never happen automatically or without your explicit action.

---

## 7. Termination & Downgrade

- You may cancel or downgrade your subscription at any time by contacting [tasqoneworkos@gmail.com](mailto:tasqoneworkos@gmail.com) (self-service cancellation to be added once paid billing launches).
- If a future paid Workspace is downgraded or cancelled, we will provide a reasonable window to export your data before any deletion, consistent with our Privacy Policy's retention terms.

---

## 8. Relationship to Other Documents

This SLA is part of a set of documents governing your use of TASQ-ONE:
- **Terms of Service** — overarching legal agreement.
- **Terms & Conditions (Acceptable Use Policy)** — day-to-day usage rules.
- **Privacy Policy** — data handling practices.
- **Security Policy** — technical security measures.

In case of conflict between this SLA and the Terms of Service on commercial/billing matters, this SLA governs; on all other matters, the Terms of Service governs.

---

## 9. Contact

**Sales / billing questions:** [tasqoneworkos@gmail.com](mailto:tasqoneworkos@gmail.com)
**Location:** Delhi / Pune, India
