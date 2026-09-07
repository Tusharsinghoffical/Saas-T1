"use client";

import React from "react";
import { ShieldCheck, Lock } from "lucide-react";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 antialiased selection:bg-indigo-500/20 selection:text-indigo-900">
      <MarketingNav />

      {/* Header Banner */}
      <section className="border-b border-slate-200 bg-slate-50/70 py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600">
            <ShieldCheck className="h-4 w-4" />
            <span>Trust &amp; Data Protection</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Privacy Policy &amp; Data Governance
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
            Last Updated: August 31, 2026 • Applies to TASQ-ONE Work OS (
            <a
              href="https://tasq-one.onrender.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 underline"
            >
              tasq-one.onrender.com
            </a>
            )
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl space-y-10 px-4 py-12 text-sm leading-relaxed text-slate-700 sm:px-6 sm:text-base lg:px-8">
        {/* Intro callout */}
        <div className="space-y-1.5 rounded-2xl border border-indigo-200/80 bg-indigo-50/60 p-5 text-xs text-indigo-950 sm:text-sm">
          <div className="flex items-center gap-2 font-bold">
            <Lock className="h-4 w-4 text-indigo-600" />
            <span>Our Privacy Commitment to High-Velocity Teams</span>
          </div>
          <p className="text-indigo-900">
            TASQ-ONE (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is a
            multi-tenant task management Work OS operated from India (Delhi /
            Pune). We do not sell your personal data, nor do we train public AI
            models on your task content.
          </p>
        </div>

        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-xl font-black text-slate-900 sm:text-2xl">
            1. Who We Are &amp; Contact
          </h2>
          <p>
            TASQ-ONE is operated from India with engineering and infrastructure
            centered in Delhi / Pune. For any privacy queries, data access
            requests, or regulatory questions under the DPDP Act 2023, please
            reach our dedicated Data Protection Desk:
          </p>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-xs text-slate-800">
            Email:{" "}
            <a
              href="mailto:tasqoneworkos@gmail.com"
              className="font-bold text-indigo-600 underline"
            >
              tasqoneworkos@gmail.com
            </a>{" "}
            (Response within 2 business hours)
          </div>
        </section>

        {/* Section 2 */}
        <section className="space-y-4">
          <h2 className="text-xl font-black text-slate-900 sm:text-2xl">
            2. Data We Collect
          </h2>
          <div className="space-y-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                2.1 Account &amp; Organization Data (Provided by You)
              </h3>
              <p className="mt-1">
                - Full name, email address, and salted password hash (we never
                store or see your plaintext password) — collected at company
                signup (
                <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">
                  /signup
                </code>
                ) or when accepting an invite (
                <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">
                  /accept-invite
                </code>
                ).
                <br />
                - Organization name, department squads, and workspace
                configuration.
                <br />- Role assignment (
                <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">
                  admin
                </code>
                ,{" "}
                <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">
                  manager
                </code>
                , or{" "}
                <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">
                  employee
                </code>
                ).
              </p>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">
                2.2 Content You Create &amp; Manage
              </h3>
              <p className="mt-1">
                - Task deliverables, descriptions, acceptance criteria,
                checklists, comments, due dates, priorities, and dependency DAG
                relations.
                <br />- File attachments and assets uploaded (stored in
                Cloudflare R2 with tenant-isolated paths{" "}
                <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">
                  ${`{orgId}`}/${`{taskId}`}/...
                </code>
                ).
                <br />- Text submitted to &quot;Enhance with AI&quot; (processed
                in ephemeral memory via Groq Llama 3.3 70B TLS 1.3 tunnels).
              </p>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">
                2.3 Automatically Collected Telemetry &amp; Logs
              </h3>
              <p className="mt-1">
                - Authentication timestamps, IP address, and browser headers for
                distributed rate limiting (Upstash Redis).
                <br />- Immutable audit trail: every deliverable update, status
                change, and assignee transfer is logged with actor ID for
                organizational compliance.
              </p>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">
                2.4 Data We Do NOT Collect
              </h3>
              <p className="mt-1">
                - We do not collect credit card or payment credentials during
                the ₹0 Free Starter Pilot.
                <br />- We do not knowingly collect personal data from anyone
                under the age of 18.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3 */}
        <section className="space-y-4">
          <h2 className="text-xl font-black text-slate-900 sm:text-2xl">
            3. How We Use Your Data (Legal Basis)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full overflow-hidden rounded-xl border border-slate-200 text-xs sm:text-sm">
              <thead className="bg-slate-100 font-bold text-slate-900">
                <tr>
                  <th className="border-b border-slate-200 p-3 text-left">
                    Purpose
                  </th>
                  <th className="border-b border-slate-200 p-3 text-left">
                    Legal Basis (DPDP Act 2023 / GDPR)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-600">
                <tr>
                  <td className="p-3 font-semibold text-slate-800">
                    Operate Work OS (Kanban, dashboards, checklists)
                  </td>
                  <td className="p-3">
                    Performance of Contract with your organization
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-800">
                    Authenticate &amp; enforce strict 3-way RBAC
                  </td>
                  <td className="p-3">
                    Performance of Contract &amp; System Security
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-800">
                    Dispatch transactional notifications &amp; Slack cards
                  </td>
                  <td className="p-3">Performance of Contract</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-800">
                    AI Task Decomposition (Groq 70B inference)
                  </td>
                  <td className="p-3">
                    Explicit User Action / Contract Performance
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-800">
                    Detect &amp; mitigate DDoS / brute-force attacks
                  </td>
                  <td className="p-3">
                    Legitimate Interest &amp; Security Obligation
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 4 */}
        <section className="space-y-4">
          <h2 className="text-xl font-black text-slate-900 sm:text-2xl">
            4. Third-Party Sub-Processors
          </h2>
          <p>
            We partner exclusively with enterprise-grade cloud infrastructure
            providers that enforce strict data isolation:
          </p>
          <ul className="list-inside list-disc space-y-2 text-slate-600">
            <li>
              <strong>Supabase Cloud:</strong> PostgreSQL database engine &amp;
              GoTrue authentication (Asia-South Mumbai cloud region).
            </li>
            <li>
              <strong>Groq Cloud:</strong> Ultra-low latency Llama 3.3 70B
              inference (zero data retention policy).
            </li>
            <li>
              <strong>Cloudflare R2:</strong> S3-compatible encrypted object
              storage for attachments.
            </li>
            <li>
              <strong>Upstash:</strong> Serverless Redis for distributed
              sliding-window rate limiting.
            </li>
            <li>
              <strong>Slack Technologies:</strong> Incoming webhook dispatch
              (configured strictly by Workspace Admins).
            </li>
            <li>
              <strong>Resend:</strong> High-deliverability transactional email
              dispatch.
            </li>
          </ul>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <h2 className="text-xl font-black text-slate-900 sm:text-2xl">
            5. Your Rights Under Indian DPDP Act 2023
          </h2>
          <p>
            As a registered user or organization data principal in India, you
            hold complete statutory rights:
          </p>
          <ul className="list-inside list-disc space-y-2 text-slate-600">
            <li>
              <strong>Right to Access &amp; Summary:</strong> Request an export
              of all workspace tasks, profiles, and audit records.
            </li>
            <li>
              <strong>Right to Correction &amp; Erasure:</strong> Update profile
              info or request complete tenant deletion with zero residual
              retention.
            </li>
            <li>
              <strong>Right to Grievance Redressal:</strong> Dedicated response
              within 2 business hours via{" "}
              <a
                href="mailto:tasqoneworkos@gmail.com"
                className="text-indigo-600 underline"
              >
                tasqoneworkos@gmail.com
              </a>
              .
            </li>
          </ul>
        </section>

        {/* Section 6 */}
        <section className="space-y-3 border-t border-slate-200 pt-6">
          <h2 className="text-xl font-black text-slate-900 sm:text-2xl">
            6. Data Retention &amp; Workspace Deletion
          </h2>
          <p>
            When an Admin deactivates an employee account, their authentication
            session is terminated immediately (soft-delete), while task
            authorship is preserved for audit compliance. If a Workspace Admin
            requests full organization deletion, all tenant records across
            Supabase, Cloudflare R2, and Upstash are permanently purged within
            30 days.
          </p>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
