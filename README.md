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
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker)](https://www.docker.com/)
[![Currency](https://img.shields.io/badge/Currency-₹_INR_Localized-blue?style=for-the-badge)](#)

[Live Demo Experience](#live-workspace-simulator) • [Features](#-key-features) • [Quickstart](#-quickstart-guide) • [Docker](#-docker-deployment) • [Security & Compliance](#-security--compliance) • [Roadmap](#-documentation--roadmap)

</div>

---

## 📖 Overview

**TASQ-ONE** is an enterprise-grade, multi-tenant Task Operating System designed specifically for modern startups, agencies, and engineering teams who want complete clarity without software bloat.

By combining **Groq Llama 3.3 70B AI task decomposition**, **distraction-free employee morning checklists**, **dependency DAG enforcement**, and **automated async broadcasts**, TASQ-ONE helps founders and managers reclaim **10+ hours every week** and eliminates status check-in calls.

---

## ✨ Key Features

### 1. 🗂️ Live Sprint Kanban Board
- Multi-column drag-and-drop workflow (`To Do`, `In Progress`, `Done`, `Blocked`).
- Real-time task priority badges (`Urgent`, `High`, `Medium`, `Low`).
- Task search, department filtering, and instant deliverable creation.

### 2. 🤖 Instant AI Task Decomposer (Groq Llama 3.3 70B)
- Turn vague 1-line requests into structured, unambiguous deliverable specifications in seconds.
- Auto-generates **Acceptance Criteria**, estimated hours, department tagging, and assignee recommendations.

### 3. 🎯 "Due Today" Employee Morning Focus
- Distraction-free personal morning view for team members.
- Interactive checklist with real-time completion progress tracking.
- Prevents cognitive overload by hiding irrelevant backlog items.

### 4. 📢 Automated Async Broadcasts
- Automated Slack release cards and webhook notifications when tasks complete.
- Weekly executive velocity digest (On-Time completion rate, Done count, Blocked alerts).

### 5. 🔗 Task Dependency DAG (Directed Acyclic Graph)
- Visually links prerequisite tasks and prevents premature status transitions until dependencies are verified Done.

### 6. 💰 ROI Capacity Calculator
- Interactive savings calculator calibrated to the Indian tech ecosystem (**₹1,200/hr** average value).
- Displays live monthly hours saved and rupee cost savings.

### 7. 🇮🇳 Indian Localization & DPDP Act 2023 Compliance
- Full currency localization in Indian Rupees (**₹0 Free Starter Pilot**, **₹999 SMB Pro**, **₹2,499 Enterprise**).
- Data residency in **Asia-South (Mumbai)** region.
- Aligned with India's **Digital Personal Data Protection (DPDP) Act 2023** and ISO/IEC 27001 baseline.

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend Framework** | Next.js 14 (App Router, Standalone Build), React 18 |
| **Styling & UI** | Tailwind CSS, Lucide Icons, Glassmorphism design system |
| **Language** | TypeScript (Strict mode enabled) |
| **Database & Auth** | Supabase (PostgreSQL with Multi-Tenant Row-Level Security) |
| **AI Inference** | Groq Cloud SDK (`llama-3.3-70b-versatile`) |
| **Rate Limiting & Cache** | Upstash Redis (Sliding window token-bucket rate limiting) |
| **Object Storage** | Cloudflare R2 / AWS S3 (Presigned URLs with 10MB limit) |
| **Notifications** | Slack Webhooks, Resend Transactional Email, Gupshup WhatsApp |
| **Containerization** | Docker, Docker Compose (`node:22-alpine` multi-stage runner) |

---

## 🚀 Quickstart Guide

### Prerequisites
- [Node.js](https://nodejs.org/) v20+ or v22+
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)
- [Docker & Docker Desktop](https://www.docker.com/) (Optional, for containerized run)

### 1. Clone the Repository
```bash
git clone https://github.com/Tusharsinghoffical/Saas-T1.git
cd Saas-T1
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Copy `.env.local.example` to `.env.local`:
```bash
cp .env.local.example .env.local
```
Configure your keys:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Groq AI
GROQ_API_KEY=your_groq_api_key

# Upstash Redis
UPSTASH_REDIS_REST_URL=your_upstash_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_token
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🐳 Docker Deployment

The application includes a production-ready, multi-stage `Dockerfile` and `docker-compose.yml` leveraging Next.js standalone output.

### 1. Build and Start Container
```bash
docker compose up --build -d
```

### 2. Verify Container Health
```bash
docker compose ps
# Output: tasq-one-app | Up (healthy) | 0.0.0.0:3000->3000/tcp
```

### 3. Stop Container
```bash
docker compose down
```

---

## 🔒 Security & Compliance

- **PostgreSQL Row-Level Security (RLS):** Strict multi-tenant isolation enforced at the database engine level.
- **Role-Based Access Control (RBAC):** Admin vs Employee permissions with server-side guard enforcement (`shared/middleware/rbacGuard.ts`).
- **Privilege Escalation Protection:** Self-role modification blocked via dedicated database policy (`0008_fix_privilege_escalation.sql`).
- **Rate Limiting:** Authentication and public endpoints protected against brute-force and DDoS via Upstash Redis.
- **Presigned Uploads:** Cloudflare R2 presigned URLs enforce strict 10MB limits and MIME type allowlists (`image/*`, `application/pdf`, `text/*`).
- **Privacy & Cookie Control:** Built-in interactive Cookie Consent Manager and DPDP Act 2023 compliance disclosure.

---

## 📁 Repository Structure

```
TASQ-ONE/
├── app/                        # Next.js 14 App Router Pages & API Routes
│   ├── (admin)/admin/          # Admin Dashboard, Settings & Pricing
│   ├── (employee)/employee/    # Employee Morning Focus Checklist
│   ├── api/v1/                 # REST API endpoints (tasks, AI, auth, activity)
│   ├── page.tsx                # Master Landing Page & Live Simulator
│   └── layout.tsx              # Root HTML & Metadata Layout
├── components/                 # Reusable UI & Modal components
├── docs/                       # Architecture, Security Reports & Guides
│   ├── PENDING-TASKS-AND-ROADMAP.md # Detailed QA & Production Checklist
│   ├── SECURITY-AUDIT-REPORT.md     # Comprehensive Security Audit Report
│   └── DOCKER_GUIDE.md              # Containerization & Run Instructions
├── domains/                    # Domain-Driven Architecture (Tasks, Auth, Org, Users)
│   ├── auth/                   # Authentication usecases & repositories
│   ├── tasks/                  # Task engine, AI decomposition, attachments
│   └── organization/           # Org settings & billing scaffolding
├── infrastructure/             # External SDK clients (Supabase, Groq, Redis, R2)
├── lib/                        # Utilities, validators & billing configuration
├── public/                     # Static assets, PWA manifest, and logos
├── supabase/migrations/        # SQL Migrations (0001_init to 0008_privilege_fix)
├── Dockerfile                  # Node 22 Alpine Multi-Stage Production Dockerfile
└── docker-compose.yml          # Container Orchestration Configuration
```

---

## 📚 Documentation & Roadmap

- 📋 [Pending Tasks & Production Roadmap](docs/PENDING-TASKS-AND-ROADMAP.md)
- 🛡️ [Security Audit & Vulnerability Remediation Report](docs/SECURITY-AUDIT-REPORT.md)
- 🐳 [Docker Run & Deployment Guide](docs/DOCKER_GUIDE.md)

---

## 📄 License

This project is licensed under the **MIT License**.

---

<div align="center">
Made with ❤️ for Indian Startups & High-Velocity Growing Teams Worldwide.
</div>