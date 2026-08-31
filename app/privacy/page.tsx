"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, ArrowLeft, Lock, FileText, CheckCircle2, Globe, Mail } from "lucide-react";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased selection:bg-indigo-500/20 selection:text-indigo-900">
      <MarketingNav />

      {/* Header Banner */}
      <section className="border-b border-slate-200 bg-slate-50/70 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3">
            <ShieldCheck className="w-4 h-4" />
            <span>Trust &amp; Data Protection</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Privacy Policy &amp; Data Governance
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
            Last Updated: August 31, 2026 • Applies to TASQ-ONE Work OS (<a href="https://tasq-one.onrender.com" className="text-indigo-600 underline">tasq-one.onrender.com</a>)
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 text-sm sm:text-base text-slate-700 leading-relaxed">
        {/* Intro callout */}
        <div className="p-5 rounded-2xl bg-indigo-50/60 border border-indigo-200/80 text-xs sm:text-sm text-indigo-950 space-y-1.5">
          <div className="font-bold flex items-center gap-2">
            <Lock className="w-4 h-4 text-indigo-600" />
            <span>Our Privacy Commitment to High-Velocity Teams</span>
          </div>
          <p className="text-indigo-900">
            TASQ-ONE (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is a multi-tenant task management Work OS operated from India (Delhi / Pune). We do not sell your personal data, nor do we train public AI models on your task content.
          </p>
        </div>

        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">1. Who We Are &amp; Contact</h2>
          <p>
            TASQ-ONE is operated from India with engineering and infrastructure centered in Delhi / Pune. For any privacy queries, data access requests, or regulatory questions under the DPDP Act 2023, please reach our dedicated Data Protection Desk:
          </p>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-800">
            Email: <a href="mailto:tasqoneworkos@gmail.com" className="text-indigo-600 font-bold underline">tasqoneworkos@gmail.com</a> (Response within 2 business hours)
          </div>
        </section>

        {/* Section 2 */}
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">2. Data We Collect</h2>
          <div className="space-y-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base">2.1 Account &amp; Organization Data (Provided by You)</h3>
              <p className="mt-1">
                - Full name, email address, and salted password hash (we never store or see your plaintext password) — collected at company signup (<code className="bg-slate-100 px-1 py-0.5 rounded text-xs">/signup</code>) or when accepting an invite (<code className="bg-slate-100 px-1 py-0.5 rounded text-xs">/accept-invite</code>).<br />
                - Organization name, department squads, and workspace configuration.<br />
                - Role assignment (<code className="bg-slate-100 px-1 py-0.5 rounded text-xs">admin</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">manager</code>, or <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">employee</code>).
              </p>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 text-base">2.2 Content You Create &amp; Manage</h3>
              <p className="mt-1">
                - Task deliverables, descriptions, acceptance criteria, checklists, comments, due dates, priorities, and dependency DAG relations.<br />
                - File attachments and assets uploaded (stored in Cloudflare R2 with tenant-isolated paths <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">${`{orgId}`}/${`{taskId}`}/...</code>).<br />
                - Text submitted to &quot;Enhance with AI&quot; (processed in ephemeral memory via Groq Llama 3.3 70B TLS 1.3 tunnels).
              </p>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 text-base">2.3 Automatically Collected Telemetry &amp; Logs</h3>
              <p className="mt-1">
                - Authentication timestamps, IP address, and browser headers for distributed rate limiting (Upstash Redis).<br />
                - Immutable audit trail: every deliverable update, status change, and assignee transfer is logged with actor ID for organizational compliance.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 text-base">2.4 Data We Do NOT Collect</h3>
              <p className="mt-1">
                - We do not collect credit card or payment credentials during the ₹0 Free Starter Pilot.<br />
                - We do not knowingly collect personal data from anyone under the age of 18.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3 */}
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">3. How We Use Your Data (Legal Basis)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-100 text-slate-900 font-bold">
                <tr>
                  <th className="p-3 text-left border-b border-slate-200">Purpose</th>
                  <th className="p-3 text-left border-b border-slate-200">Legal Basis (DPDP Act 2023 / GDPR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-600">
                <tr>
                  <td className="p-3 font-semibold text-slate-800">Operate Work OS (Kanban, dashboards, checklists)</td>
                  <td className="p-3">Performance of Contract with your organization</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-800">Authenticate &amp; enforce strict 3-way RBAC</td>
                  <td className="p-3">Performance of Contract &amp; System Security</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-800">Dispatch transactional notifications &amp; Slack cards</td>
                  <td className="p-3">Performance of Contract</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-800">AI Task Decomposition (Groq 70B inference)</td>
                  <td className="p-3">Explicit User Action / Contract Performance</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-800">Detect &amp; mitigate DDoS / brute-force attacks</td>
                  <td className="p-3">Legitimate Interest &amp; Security Obligation</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 4 */}
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">4. Third-Party Sub-Processors</h2>
          <p>
            We partner exclusively with enterprise-grade cloud infrastructure providers that enforce strict data isolation:
          </p>
          <ul className="space-y-2 list-disc list-inside text-slate-600">
            <li><strong>Supabase Cloud:</strong> PostgreSQL database engine &amp; GoTrue authentication (Asia-South Mumbai cloud region).</li>
            <li><strong>Groq Cloud:</strong> Ultra-low latency Llama 3.3 70B inference (zero data retention policy).</li>
            <li><strong>Cloudflare R2:</strong> S3-compatible encrypted object storage for attachments.</li>
            <li><strong>Upstash:</strong> Serverless Redis for distributed sliding-window rate limiting.</li>
            <li><strong>Slack Technologies:</strong> Incoming webhook dispatch (configured strictly by Workspace Admins).</li>
            <li><strong>Resend:</strong> High-deliverability transactional email dispatch.</li>
          </ul>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">5. Your Rights Under Indian DPDP Act 2023</h2>
          <p>
            As a registered user or organization data principal in India, you hold complete statutory rights:
          </p>
          <ul className="space-y-2 list-disc list-inside text-slate-600">
            <li><strong>Right to Access &amp; Summary:</strong> Request an export of all workspace tasks, profiles, and audit records.</li>
            <li><strong>Right to Correction &amp; Erasure:</strong> Update profile info or request complete tenant deletion with zero residual retention.</li>
            <li><strong>Right to Grievance Redressal:</strong> Dedicated response within 2 business hours via <a href="mailto:tasqoneworkos@gmail.com" className="text-indigo-600 underline">tasqoneworkos@gmail.com</a>.</li>
          </ul>
        </section>

        {/* Section 6 */}
        <section className="space-y-3 pt-6 border-t border-slate-200">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">6. Data Retention &amp; Workspace Deletion</h2>
          <p>
            When an Admin deactivates an employee account, their authentication session is terminated immediately (soft-delete), while task authorship is preserved for audit compliance. If a Workspace Admin requests full organization deletion, all tenant records across Supabase, Cloudflare R2, and Upstash are permanently purged within 30 days.
          </p>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
