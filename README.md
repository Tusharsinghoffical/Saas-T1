<div align="center">

<br/>

```
████████╗ █████╗ ███████╗ ██████╗        ██████╗ ███╗   ██╗███████╗
╚══██╔══╝██╔══██╗██╔════╝██╔═══██╗      ██╔═══██╗████╗  ██║██╔════╝
   ██║   ███████║███████╗██║   ██║█████╗██║   ██║██╔██╗ ██║█████╗  
   ██║   ██╔══██║╚════██║██║▄▄ ██║╚════╝██║   ██║██║╚██╗██║██╔══╝  
   ██║   ██║  ██║███████║╚██████╔╝      ╚██████╔╝██║ ╚████║███████╗
   ╚═╝   ╚═╝  ╚═╝╚══════╝ ╚══▀▀═╝        ╚═════╝ ╚═╝  ╚═══╝╚══════╝
```

<br/>

<h2>The Intelligent Task Operating System for High-Velocity Teams</h2>

<p><em>Stop managing tasks in WhatsApp chats and messy spreadsheets. <br/>Assign with clarity, track in real-time, eliminate follow-up meetings.</em></p>

<br/>

![Version](https://img.shields.io/badge/⚡_VERSION-2.5-6366F1?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-14.2.35-000000?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL_RLS-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)

![Groq AI](https://img.shields.io/badge/Groq_AI-Llama_3.3_70B-F55036?style=for-the-badge)
![Redis](https://img.shields.io/badge/Upstash_Redis-Multi--Layer_Cache-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Cloudflare](https://img.shields.io/badge/Cloudflare-R2_Storage-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-22C55E?style=for-the-badge)

<br/>

<img src="docs/assets/hero-banner.png" alt="TASQ-ONE Platform" width="90%" style="border-radius: 16px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);" />

<br/><br/>

[![Live Demo](https://img.shields.io/badge/🌐_LIVE_DEMO-tasq--one.onrender.com-6366F1?style=for-the-badge)](https://tasq-one.onrender.com)
[![Features](https://img.shields.io/badge/⚡_Features-/features-8B5CF6?style=for-the-badge)](https://tasq-one.onrender.com/features)
[![Pricing](https://img.shields.io/badge/💳_Pricing-/pricing-EC4899?style=for-the-badge)](https://tasq-one.onrender.com/pricing)

</div>

<br/>

##

<div align="center">

### ╔═══════════════════════════════════════════════╗
### ║  Navigate: &nbsp; [Overview](#-overview) &nbsp;•&nbsp; [v2.5 Changes](#-whats-new-in-v25) &nbsp;•&nbsp; [Features](#-core-capabilities) &nbsp;•&nbsp; [Roles](#-role-based-access-portals) &nbsp;•&nbsp; [Performance](#-performance-architecture) &nbsp;•&nbsp; [Security](#-enterprise-security) &nbsp;•&nbsp; [Quick Start](#-quick-start)
### ╚═══════════════════════════════════════════════╝

</div>

<br/>

---

<br/>

## 🎯 Overview

> **TASQ-ONE v2.5** is an enterprise-grade, multi-tenant Task Operating System built for startups, agencies, and engineering orgs who need **real operational clarity — without the bloat.**

Traditional tools have steep learning curves, cluttered UIs, and zero accountability — pushing teams back to WhatsApp and spreadsheets. TASQ-ONE fixes this with:

- 🤖 **AI-powered task decomposition** via Groq Llama 3.3 70B (millisecond inference)
- 📋 **Personal employee morning checklists** — only see what's due *today*
- 🔗 **Task Dependency DAG** enforcement — no downstream task starts early
- 🔐 **Immutable cryptographic audit logs** — tamper-proof, real-time, exportable
- 📢 **Async multi-channel broadcasts** — Slack + Email, zero synchronous meetings

> Founders and managers reclaim **10+ hours every week.**

<br/>

---

<br/>

## 🆕 What's New in v2.5

<div align="center">

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      🚀  VERSION 2.5 HIGHLIGHTS                        │
├──────────────────────────────────────┬──────────────────────────────────┤
│  ⚡ Performance Overhaul            │  10-15s load → 1-3s              │
│  🔄 Auto-Refresh on All Dashboards  │  10s cycle + ON/OFF toggle       │
│  🎨 Employee Dashboard Redesign     │  Profile hero, metric tiles      │
│  📊 Audit Trail Redesign            │  Zero raw JSON, CSV export       │
│  👥 Inline Team Assignment          │  Edit team in table row          │
│  🏗️ Admin Sidebar Cleanup           │  Removed redundant cards         │
│  🐛 TypeScript Bug Fixes            │  KanbanTaskItem, OrgMember fixes │
└──────────────────────────────────────┴──────────────────────────────────┘
```

</div>

<br/>

### ⚡ Performance Overhaul — The Biggest Change in v2.5

**Root Cause Found:** Pages loaded in 10-15 seconds because of sequential database waterfall queries — each call waited for the previous one to finish.

**Fix Applied:** All sequential queries converted to `Promise.all` parallel execution + multi-layer caching:

| Bottleneck | Before | After | Gain |
|:-----------|:------:|:-----:|:----:|
| `listOrgMembers` (profiles + auth + teams) | ~12s sequential | ~3s parallel | **4× faster** |
| Employee dashboard task fetch | 2-query chain | `Promise.all` | **2× faster** |
| Manager dashboard team resolve | 2-query chain | `Promise.all` | **2× faster** |
| `requireAuth()` — Supabase auth hit | Every request | 15s memory cache | **~0ms** |
| Org member lookup | No cache | 20s Redis + L1 cache | **~0ms** |
| Redis client calls | No timeout (could hang) | 600ms hard timeout + L1 | **Safe** |

<br/>

### 🔄 Auto-Refresh — New on All 6 Dashboards

Every role dashboard now has a **live auto-refresh system**:

```
  ┌────────────────────────────────┐
  │  🟢 Auto-refresh in  7s  [■]  │  ← countdown badge + toggle
  └────────────────────────────────┘
```

- Animated **countdown badge** (live seconds display)
- **Toggle ON/OFF** with one click
- **Manual sync** button with spinning refresh animation
- Pages covered: Admin Dashboard · Admin Team · Admin Activity · Manager Dashboard · Manager Team · Employee Dashboard

<br/>

### 🎨 Employee Dashboard — Fully Redesigned

```
╔══════════════════════════════════════════════════════════╗
║  👤  Krishan Kumar          [EMP-XXXX  📋]  Good Evening ║
║      Workspace Member · Engineering Team                  ║
╠══════════════════════════════════════════════════════════╣
║  [ Due Today: 2 ] [ In Progress: 1 ] [ Upcoming: 4 ] [✓] ║
╠══════════════════════════════════════════════════════════╣
║  🔍 Search tasks...     [Priority ▼]    [Status ▼]       ║
╠══════════════════════════════════════════════════════════╣
║  ○ Fix API rate limiting bug    🔴 URGENT  Due: Today     ║
║  ○ Draft Q3 sprint review       🟠 HIGH    Due: Tomorrow  ║
╚══════════════════════════════════════════════════════════╝
```

<br/>

### 📊 Audit Trail — Zero Raw JSON

**Before v2.5:** Entries showed raw `{"status":"in_review","task_id":"..."}` JSON blobs.

**After v2.5:** Every entry renders as structured human-readable cards:

```
  Sep 1, 05:51 PM  ·  Admin User  ·  Status Changed  ·  tasks
  ┌──────────────┐       ┌──────────────┐
  │  title       │  →    │  status      │
  │  "Fix Login" │       │  in_review   │
  └──────────────┘       └──────────────┘     [Inspect ▶]
```

<br/>

---

<br/>

## 🔥 The Problem & The Solution

<div align="center">

```
WITHOUT TASQ-ONE                      WITH TASQ-ONE
──────────────────                    ─────────────────
❌ Tasks buried in                    ✅ One centralized board
   WhatsApp noise                        with verified owners

❌ 45-min status meetings             ✅ 5-second progress check,
   with no clear answers                 no meetings needed

❌ "What are you working on?"         ✅ AI converts 1 sentence
   messages all day                      into full task specs

❌ Missed deadlines from              ✅ Auto Slack + Email alerts,
   unbalanced workload                   nothing slips

❌ No record of who changed           ✅ Immutable cryptographic
   what or when                          audit trail
```

</div>

<br/>

---

<br/>

## 🚀 Core Capabilities

<br/>

### `01` 🤖 AI Task Decomposer *(Groq Llama 3.3 70B)*

Write one sentence. Get a production-ready task spec in milliseconds.

```
Input:  "Build the user profile settings page"
        ↓
Output: ✓ Title (enhanced)
        ✓ Description with context
        ✓ 4-point Acceptance Criteria
        ✓ Priority level
        ✓ Estimated hours
        ✓ Suggested assignee
        ✓ Department tag (Engineering / Design / Ops / Sales)
```

<br/>

### `02` 🎯 Personal Focus Dashboard *(Employee)*

Distraction-free morning checklist — only what's due *today*:
- **Profile Hero Card:** Time-of-day greeting, Employee ID (1-click copy), team badge
- **Metric Tiles:** Due Today · In Progress · Upcoming (7D) · Completed — each is a clickable filter
- **Premium Task Cards:** Priority badge, overdue alert, subtask counter, quick-complete circle, inline status dropdown
- **Live Search + Filter Bar:** Real-time search across title, description, and tags

<br/>

### `03` 📊 Immutable Activity & Audit Trail

- **Cryptographically verifiable** — tamper-proof log of every workspace mutation
- **Human-readable entries** — status chips, priority pills, comment quotes, team tags
- **Structured inspector modal** — diff card view of changed `property → value` pairs
- **Export to CSV** with active filters applied
- **Auto-backfill synthesis** from existing tasks and profiles

<br/>

### `04` 🔗 Task Dependency DAG

```
  [Task A: Design Mockups]  ──►  [Task B: Frontend Build]  ──►  [Task C: QA Testing]
        ✅ Completed               🔒 Blocked until A done         🔒 Blocked until B done
```

Downstream tasks are **blocked at the UI level** until their prerequisite is marked `Completed`.

<br/>

### `05` 🔔 Real-Time Notification System

```
  🔔 3  ← unread badge, live via Supabase Realtime
  ├── 🔴 "Fix Login Bug" is overdue!
  ├── 📌 "Krishan Kumar" assigned you a task
  └── 💬 "Admin User" mentioned you in a comment
```

Delivered via Supabase Realtime channels — zero polling, instant push.

<br/>

### `06` 📢 Automated Multi-Channel Broadcasts

- **Slack Release Cards** — rich formatted block when task reaches `Completed`
- **Weekly Executive Digest** — Monday summary of velocity, on-time rate, and blockers via Resend email

<br/>

### `07` 💰 ROI Capacity Calculator

Interactive savings calculator calibrated to the **Indian tech ecosystem**:

```
  Team Size: 10 people     Rate: ₹1,200/hr (avg knowledge worker)
  ─────────────────────────────────────────────────────
  Hours saved per month:        40h
  Monthly bottom-line savings:  ₹48,000
```

<br/>

---

<br/>

## 🧑‍💼 Role-Based Access Portals

<div align="center">

```
┌──────────────────────────────────────────────────────────────────┐
│                     3-TIER RBAC SYSTEM                          │
├──────────────────────┬───────────────┬───────────────┬──────────┤
│ Feature              │  👑 Admin     │  ⚡ Manager   │ 👤 Emp  │
├──────────────────────┼───────────────┼───────────────┼──────────┤
│ Create & assign tasks│      ✅       │   ✅ (team)   │   ❌    │
│ View all org tasks   │      ✅       │   ✅ (team)   │   ❌    │
│ Add / remove members │      ✅       │   ✅ (emp)    │   ❌    │
│ Activity Audit Trail │      ✅       │      ❌       │   ❌    │
│ Assign team to users │      ✅       │      ❌       │   ❌    │
│ Update task status   │      ✅       │      ✅       │   ✅    │
│ Personal dashboard   │      ✅       │      ✅       │   ✅    │
│ Export Audit CSV     │      ✅       │      ❌       │   ❌    │
│ Manage org settings  │      ✅       │      ❌       │   ❌    │
└──────────────────────┴───────────────┴───────────────┴──────────┘
```

</div>

<br/>

---

<br/>

## ⚡ Performance Architecture

<div align="center">

```
                        ┌─────────────────────┐
                        │   Browser Request   │
                        └──────────┬──────────┘
                                   │
                        ┌──────────▼──────────┐
                        │  Next.js API Route  │
                        └──────────┬──────────┘
                                   │
              ┌────────────────────▼────────────────────┐
              │           requireAuth()                 │
              │    L1 authContextCache (15s, ~0ms) ⚡   │
              └────────────────────┬────────────────────┘
                                   │
              ┌────────────────────▼────────────────────┐
              │          listOrgMembers()               │
              │   L1 + Redis members cache (20s, ~0ms) │
              └────────────────────┬────────────────────┘
                                   │
                           Cache Miss?
                                   │
              ┌────────────────────▼────────────────────┐
              │              Promise.all()              │
              ├──────────────────────────────────────── ┤
              │  [ profiles query ]                     │
              │  [ auth.admin.listUsers ]  ← PARALLEL   │
              │  [ team_members query  ]                │
              └────────────────────┬────────────────────┘
                                   │
              ┌────────────────────▼────────────────────┐
              │  dashboardRepository                    │
              │  tasks + assignments → Promise.all()    │
              └────────────────────┬────────────────────┘
                                   │
                        ┌──────────▼──────────┐
                        │  Response: 1-3s ✅  │
                        └─────────────────────┘
```

</div>

<br/>

### Cache Layers Summary

| Layer | TTL | Hit Latency | Scope |
|:------|:---:|:-----------:|:------|
| `authContextCache` in-memory | 15s | ~0ms | Per user session |
| `listOrgMembers` Redis + L1 | 20s | ~0ms | Per organization |
| `redisClient` L1 memory | 30s | ~0ms | Per cache key |
| Redis Upstash remote | 60s | ~30ms | Dashboard charts |
| Redis timeout guard | 600ms max | — | All remote calls |

<br/>

---

<br/>

## 🔒 Enterprise Security

<div align="center">

```
[Client] ──► [Rate Limiter: Upstash Redis] ──► [JWT Verify: Next.js Middleware]
                                                          │
                                              ┌───────────▼───────────┐
                                              │   RLS Policy Check    │
                                              │   auth.jwt() org_id   │
                                              └───────────┬───────────┘
                                                          │
                                              ┌───────────▼───────────┐
                                              │   PostgreSQL DB        │
                                              │  Tenant-Isolated Data  │
                                              └───────────────────────┘
```

</div>

<br/>

| # | Security Layer | Description |
|:--|:--------------|:------------|
| 1 | **PostgreSQL RLS** | Every query auto-filters by `(auth.jwt() ->> 'org_id')::uuid` — Tenant A can never read Tenant B data |
| 2 | **Privilege Escalation Defense** | Migration `0008_fix_privilege_escalation.sql` blocks self-`role` and self-`org_id` mutation |
| 3 | **Distributed Rate Limiting** | Upstash Redis sliding-window token buckets on all public + auth endpoints |
| 4 | **Presigned R2 Uploads** | 10MB limit + MIME type allowlist (`image/*`, `application/pdf`, `text/*`) |
| 5 | **Custom JWT Claims Hook** | Supabase `custom_access_token_hook` injects tenant context on every token issue |
| 6 | **In-Memory Auth Cache** | `(userId, orgId, role)` cached 15s — no repeated Supabase auth calls without security compromise |

<br/>

---

<br/>

## 🛠️ Technology Stack

<div align="center">

```
┌─────────────────────────────────────────────────────────────────────┐
│                         TECH STACK                                 │
├──────────────────────────┬──────────────────────────────────────────┤
│  Next.js 14 (App Router) │  SSR, streaming, standalone Docker       │
│  TypeScript 5.0+         │  End-to-end strict type safety           │
│  Tailwind CSS 3.4        │  Glassmorphism design system             │
├──────────────────────────┼──────────────────────────────────────────┤
│  Supabase PostgreSQL 15  │  ACID, RLS, Realtime subscriptions       │
│  Groq Cloud Llama 3.3    │  Sub-second LLM inference                │
│  Upstash Redis           │  Serverless rate limiting + L2 cache     │
├──────────────────────────┼──────────────────────────────────────────┤
│  Cloudflare R2           │  Zero-egress S3 file storage             │
│  Resend                  │  Transactional email + weekly digest      │
│  Slack Webhooks          │  Async task completion broadcasts         │
├──────────────────────────┼──────────────────────────────────────────┤
│  PostHog                 │  Product analytics + funnels             │
│  Vitest                  │  Unit tests + RLS isolation tests         │
│  Docker + Compose        │  Self-hosted zero-dependency deploy       │
│  Render.com              │  Auto-deploy + managed SSL                │
└──────────────────────────┴──────────────────────────────────────────┘
```

</div>

<br/>

---

<br/>

## 📁 Project Structure

```
TASQ-ONE/
│
├── 📂 app/
│   ├── (admin)/admin/              👑 Admin Portal
│   │   ├── dashboard/              →  Org overview + Kanban
│   │   ├── team/                   →  Full member CRUD
│   │   ├── activity/               →  Audit trail + CSV export
│   │   └── settings/               →  Org configuration
│   │
│   ├── (manager)/manager/          ⚡ Manager Portal
│   │   ├── dashboard/              →  Team tasks + Kanban
│   │   └── team/                   →  Scoped member management
│   │
│   ├── (employee)/employee/        👤 Employee Portal
│   │   └── dashboard/              →  Personal focus dashboard
│   │
│   └── api/v1/                     🔌 REST API
│       ├── dashboard/              →  admin / manager / me
│       ├── tasks/[id]/             →  CRUD, comments, attachments
│       ├── org/members/            →  Team management
│       ├── activity/               →  Audit log
│       └── ai/                     →  Groq AI endpoints
│
├── 📂 components/
│   ├── kanban/                     →  KanbanBoard, Column, TaskCard
│   ├── tasks/                      →  TaskFormModal, TaskDetail
│   ├── ui/                         →  Badge, Modal, AutoRefreshControl...
│   ├── dashboard/                  →  ProductivityChart, MetricCard
│   └── notifications/              →  NotificationBell, NotificationList
│
├── 📂 domains/                     🏗️ Clean Architecture Business Logic
│   ├── tasks/                      →  Entity, Repository, Use Cases
│   ├── users/                      →  Entity, Repository, Use Cases
│   ├── activity/                   →  Audit Log Repository
│   └── organization/               →  Org Repository
│
├── 📂 infrastructure/
│   ├── redis/                      →  redisClient (L1 + Upstash, 600ms timeout)
│   └── supabase/                   →  Server client, browser client, types
│
├── 📂 shared/
│   └── middleware/                 →  rbacGuard (requireAuth + 15s cache)
│
├── 📂 supabase/migrations/
│   ├── 0001_init_schema.sql
│   ├── 0002_rls_policies.sql
│   ├── 0003_team_assignment.sql
│   ├── ...
│   └── 0008_fix_privilege_escalation.sql
│
└── 📂 tests/
    ├── rls/                        →  Cross-tenant isolation tests
    └── unit/                       →  Use case unit tests
```

<br/>

---

<br/>

## 🚀 Quick Start

### Prerequisites

```
Node.js ≥ 18 (v22 recommended)
Supabase project
Groq API key
```

### 1 · Clone & Install

```bash
git clone https://github.com/Tusharsinghoffical/Saas-T1.git
cd Saas-T1
npm install
```

### 2 · Configure Environment

```bash
cp .env.local.example .env.local
```

```env
# ── Supabase ─────────────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# ── Groq AI ──────────────────────────────────────────────────────
GROQ_API_KEY=gsk_your_groq_api_key

# ── Upstash Redis (optional, fallback: in-memory) ────────────────
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token

# ── Cloudflare R2 (optional, for file attachments) ───────────────
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=tasq-attachments
R2_PUBLIC_URL=https://pub-xxx.r2.dev

# ── Resend Email (optional) ───────────────────────────────────────
RESEND_API_KEY=re_your_key
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

### 3 · Apply Database Migrations

Run all files from `supabase/migrations/` in your Supabase SQL editor — in order from `0001_` to `0008_`.

### 4 · Start Dev Server

```bash
npm run dev
```

Open → [http://localhost:3000](http://localhost:3000)

### 5 · Docker (Self-Hosted)

```bash
docker-compose up --build

# or use included batch scripts:
docker-start.bat    # ← start
docker-stop.bat     # ← stop
```

<br/>

---

<br/>

## 📋 Changelog

<br/>

### `v2.5` — September 2026 *(Current)*

```
⚡ Performance
   └── 10-15s page loads → 1-3s via Promise.all parallelization + multi-layer caching
   └── 15s in-memory authContextCache in requireAuth
   └── 20s Redis + L1 cache in listOrgMembersUseCase
   └── 600ms hard timeout on all Redis calls

🔄 Auto-Refresh
   └── 10-second live sync across all 6 dashboards
   └── Animated countdown badge + ON/OFF toggle + manual sync button

🎨 UI / UX
   └── Employee Dashboard: profile hero card, interactive metric tiles, premium task cards
   └── Activity Audit Trail: human-readable entries, structured inspector modal, CSV export
   └── Admin Sidebar: removed redundant Workspace/Organization/Plan card

👥 Team Management
   └── Inline team assignment: edit dropdown directly in table row (no modal)

🐛 Bug Fixes
   └── Fixed OrgMember fullName vs full_name property mismatch
   └── Fixed missing KanbanTaskItem import in Admin Dashboard
   └── Fixed optional field type errors across multiple components
```

<br/>

### `v2.0` — August 2026

```
🏗️ Foundation
   └── Multi-role RBAC portal system (Admin / Manager / Employee)
   └── Groq AI task decomposer integration
   └── Supabase Realtime Kanban board
   └── Immutable activity & audit trail
   └── Cloudflare R2 file attachments
   └── Multi-tenant RLS security hardening (migrations 0001–0008)
```

<br/>

---

<br/>

## 🇮🇳 Indian Localization

| Feature | Detail |
|:--------|:-------|
| **Currency** | 100% `₹` INR with `en-IN` number formatting |
| **Data Privacy** | DPDP Act 2023 compliant + GDPR principles |
| **AI Privacy** | Customer data never used to train public LLMs |
| **HQ** | Delhi / Pune · India |

<br/>

---

<br/>

## 📬 Contact & Support

<div align="center">

| Channel | Details |
|:--------|:--------|
| 📧 **Support Email** | [tasqoneworkos@gmail.com](mailto:tasqoneworkos@gmail.com) — Response within 2 business hours |
| 👨‍💻 **Lead Developer** | [Tushar Singh](https://codewithmrsingh.me/) — `codewithmrsingh.me` |
| 🐛 **Issue Tracker** | [github.com/Tusharsinghoffical/Saas-T1/issues](https://github.com/Tusharsinghoffical/Saas-T1/issues) |
| 🏢 **Headquarters** | Delhi / Pune, India |

</div>

<br/>

---

<br/>

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](./LICENSE) for full terms.

<br/>

---

<br/>

<div align="center">

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│     ⚡  TASQ-ONE  v2.5  — Built for Speed. Built for Teams.    │
│                                                                 │
│     Crafted with ❤️  by  Tushar Singh  (codewithmrsingh.me)    │
│     tasqoneworkos@gmail.com  ·  Delhi / Pune, India            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

</div>