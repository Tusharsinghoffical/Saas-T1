<div align="center">

# ⚡ TASQ-ONE
### The Intelligent Task Operating System for High-Velocity Teams

**Stop Managing Tasks in WhatsApp Group Chats & Messy Spreadsheets.**  
*Assign deliverables with single-sentence clarity, track verified progress in real time, and eliminate endless follow-up meetings.*

[![Next.js 14](https://img.shields.io/badge/Next.js-14.2.35-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL_RLS-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Groq AI](https://img.shields.io/badge/Groq_AI-Llama_3.3_70B-F55036?style=for-the-badge)](https://groq.com/)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-R2_&_Edge-F38020?style=for-the-badge&logo=cloudflare)](https://cloudflare.com/)
[![Currency](https://img.shields.io/badge/Currency-₹_INR_Localized-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](#-license)

<br/>

<img src="docs/assets/hero-banner.png" alt="TASQ-ONE Hero Interface" width="100%" style="border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);" />

<br/>

[Overview](#-overview) • [The Problem & Solution](#-the-problem--the-solution) • [Visual Product Tour](#-visual-product-tour) • [Core Capabilities](#-core-capabilities) • [Enterprise Security](#-enterprise-security--multi-tenant-architecture) • [Indian Localization](#-indian-localization--compliance) • [Tech Stack](#-technology-stack-deep-dive) • [Contact](#-support--contact)

<br/>

> 🌐 **Live Production Instance:** [https://tasq-one.onrender.com](https://tasq-one.onrender.com)  
> 💼 **Tailored Solutions:** [/solutions](https://tasq-one.onrender.com/solutions) • 💳 **Pricing:** [/pricing](https://tasq-one.onrender.com/pricing) • ⚡ **Features:** [/features](https://tasq-one.onrender.com/features)

</div>

---

## 📖 Overview

**TASQ-ONE** is an enterprise-grade, multi-tenant Task Operating System architected specifically for growing startups, digital agencies, and engineering organizations who demand **complete operational clarity without software bloat**.

Traditional project management tools suffer from steep learning curves, cluttered feature sets, and lack of real-time accountability—forcing teams back into unstructured WhatsApp group chats and stale spreadsheets. TASQ-ONE bridges this gap with **single-click AI deliverable decomposition**, **distraction-free employee morning checklists**, **strict dependency DAG enforcement**, and **automated multi-channel async broadcasts**, empowering founders and managers to reclaim **10+ hours every week**.

---

## ⚖️ The Problem & The Solution

When work is scattered across fragmented messages, emails, and notes, deadlines get missed and leaders waste hours chasing status updates. TASQ-ONE creates **one unified, verified source of truth**.

<div align="center">
  <img src="docs/assets/chat-chaos-comparison.png" alt="Without TASQ-ONE vs With TASQ-ONE" width="100%" style="border-radius: 10px; border: 1px solid #e2e8f0;" />
</div>

<br/>

| Everyday Chaos (Without TASQ-ONE) | Streamlined Velocity (With TASQ-ONE) |
| :--- | :--- |
| ❌ Tasks get buried in noisy WhatsApp groups and lost email threads. | ✅ **Centralized Board:** Every task has a verified owner, priority, and strict deadline. |
| ❌ Daily 45-minute status meetings where nobody has clear answers. | ✅ **Zero Status Meetings:** Check verified deliverable progress in 5 seconds without disturbing teammates. |
| ❌ Managers constantly chase employees asking *"What are you working on?"*. | ✅ **AI Task Decomposition:** Converts vague requests into bulletproof specifications with acceptance criteria. |
| ❌ Overloaded teammates miss client deadlines due to unbalanced workload. | ✅ **Automated Async Alerts:** Automated Slack & Email updates ensure nothing ever slips through the cracks. |

---

## 📸 Visual Product Tour

### 1. 🗂️ Live Sprint Delivery Board
Interactive Kanban workspace with drag-and-drop column transitions, real-time priority badges, assignee avatars, and instantaneous filtering across squads.

<div align="center">
  <img src="docs/assets/sprint-delivery-board.png" alt="Sprint Delivery Board Simulator" width="100%" style="border-radius: 10px; border: 1px solid #e2e8f0;" />
</div>

<br/>

### 2. ⚡ Workspace Management Dashboard
Admin executive view providing macro-level tracking across departments, task status distributions, and team velocity metrics.

<div align="center">
  <img src="docs/assets/workspace-dashboard.png" alt="Workspace Management Dashboard" width="100%" style="border-radius: 10px; border: 1px solid #e2e8f0;" />
</div>

<br/>

### 3. 🔍 Immutable Activity & Audit Trail
Real-time tamper-proof audit trail capturing every task mutation, status shift, assignee change, and file upload for compliance and team transparency.

<div align="center">
  <img src="docs/assets/activity-audit-trail.png" alt="Activity and Audit Trail Log" width="100%" style="border-radius: 10px; border: 1px solid #e2e8f0;" />
</div>

---

## 🚀 Core Capabilities

### 1. 🤖 Instant AI Task Decomposer (Groq Llama 3.3 70B)
Transforms ambiguous 1-line inputs into production-ready task specifications in milliseconds:
- **Acceptance Criteria Generation:** Generates 4-point verifiable checklist items for each deliverable.
- **Effort & Time Estimation:** Predicts realistic completion hours and milestone timelines.
- **Smart Assignee Recommendation:** Analyzes team department workloads and suggests the ideal assignee.
- **Department Routing:** Automatically tags deliverables (`Engineering`, `Sales & Legal`, `Design`, `Operations`).

### 2. 🎯 "Due Today" Employee Morning Focus View
Designed to eliminate cognitive overload for team members:
- **Personal Morning Checklist:** Displays only deliverables scheduled for today.
- **Interactive Progress Bar:** Visual completion percentages update in real-time as tasks are checked off.
- **Distraction Shield:** Hides broad backlog noise until active daily priorities are resolved.

### 3. 📢 Automated Multi-Channel Async Broadcasts
Keeps leadership and cross-functional teams in sync without synchronous interruptions:
- **Slack Release Cards:** Instant webhook broadcasts dispatching rich cards when deliverables reach `Completed`.
- **Weekly Executive Velocity Digest:** Automated Monday digests summarizing on-time completion rates, closed deliverables, and active blockers.

### 4. 🔗 Task Dependency DAG (Directed Acyclic Graph)
- Visually establishes dependency chains between interdependent deliverables.
- Enforces strict execution order: downstream tasks cannot transition to `In Progress` until prerequisite tasks are verified `Completed`.

### 5. 💰 ROI Capacity Calculator
- Interactive savings engine calibrated to the Indian tech ecosystem (**₹1,200/hr** average knowledge worker value).
- Quantifies exact monthly hours saved and direct rupee bottom-line savings based on team size.

---

## 🔒 Enterprise Security & Multi-Tenant Architecture

TASQ-ONE is built with a **Security-First, Zero-Trust Architecture** adhering to modern enterprise governance standards:

```
[Client Request] ──► [Upstash Redis Rate Limiter] ──► [Next.js Middleware JWT Verification]
                                                                  │
                                                                  ▼
[PostgreSQL Database] ◄── [Strict Row-Level Security (RLS) Policy Enforcement (Tenant Org ID)]
```

### Key Security Safeguards:
1. **PostgreSQL Row-Level Security (RLS):**
   - Every database query automatically filters against `(auth.jwt() ->> 'org_id')::uuid`.
   - Complete multi-tenant cryptographic isolation: Tenant A cannot view, mutate, or query Tenant B records under any circumstance.
2. **Privilege Escalation Defense (`0008_fix_privilege_escalation.sql`):**
   - Non-admin employees are strictly blocked from self-modifying their `role` or `org_id` columns via split database policies.
3. **Distributed Rate Limiting:**
   - Public and authentication endpoints are protected against brute-force attacks and DDoS via Upstash Redis sliding-window token buckets.
4. **Secure Cloudflare R2 Presigned Uploads:**
   - Direct-to-storage presigned URLs with strict 10MB file size ceiling and verified MIME type allowlists (`image/*`, `application/pdf`, `text/*`).
5. **Session Integrity & Custom JWT Claims:**
   - Dedicated Supabase Auth Hook (`custom_access_token_hook`) dynamically injects tenant context upon every authentication token issuance.

---

## 🇮🇳 Indian Localization & Compliance

TASQ-ONE is tailored specifically for Indian startups, MSMEs, and high-velocity engineering hubs:

- **Currency & Numerals:** 100% localized in Indian Rupees (`₹` INR) with Indian comma numbering formatting (`en-IN`).
- **Data Privacy:** Designed in compliance with India's **Digital Personal Data Protection (DPDP) Act 2023** and GDPR principles.
- **Zero AI Model Training:** Customer proprietary workspace deliverables and task notes are never utilized to train public LLM models.
- **Enterprise Headquarters:** Designed with engineering operations centered in Delhi / Pune & Mumbai.

---

## 🛠️ Technology Stack Deep-Dive

| Subsystem | Technology | Purpose & Architectural Rationale |
| :--- | :--- | :--- |
| **Frontend Framework** | **Next.js 14 (App Router)** | Server-side rendering (SSR), streaming components, standalone Docker optimization |
| **Language** | **TypeScript 5.0+** | Strict end-to-end type safety across API boundaries and database schemas |
| **Styling & Design** | **Tailwind CSS 3.4** | Custom glassmorphism design system, micro-interactions, responsive layouts |
| **Database Engine** | **Supabase (PostgreSQL 15)** | Relational data integrity, ACID compliance, Row-Level Security (RLS) policies |
| **AI Engine** | **Groq Cloud (Llama 3.3 70B)** | Sub-second ultra-fast LLM inference for deliverable decomposition |
| **Distributed Cache** | **Upstash Redis** | Serverless low-latency rate limiting and session protection |
| **Object Storage** | **Cloudflare R2** | Zero-egress fee S3-compatible storage for task attachments and media |
| **Event Dispatch** | **Slack Incoming Webhooks** | Automated asynchronous delivery notifications |
| **Email Infrastructure** | **Resend** | High-deliverability transactional emails and executive weekly digests |
| **Quality Assurance** | **Vitest** | Automated unit test suite and multi-tenant RLS isolation test runner |

---

## 📬 Support & Contact

For enterprise inquiries, pilot onboarding, bug reports, or feature requests:

- **📧 Engineering Support Desk:** [tasqoneworkos@gmail.com](mailto:tasqoneworkos@gmail.com) *(Response within 2 business hours)*
- **🐛 Issue Tracker:** [https://github.com/Tusharsinghoffical/Saas-T1/issues](https://github.com/Tusharsinghoffical/Saas-T1/issues)
- **🏢 Headquarters:** Delhi / Pune, India

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

<div align="center">
Made with ❤️ for Indian Startups & High-Velocity Growing Teams Worldwide.<br/>
<b>TASQ-ONE Platform Inc.</b> • <a href="mailto:tasqoneworkos@gmail.com">tasqoneworkos@gmail.com</a>
</div>