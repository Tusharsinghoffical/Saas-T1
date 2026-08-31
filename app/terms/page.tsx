"use client";

import React from "react";
import { FileText, Scale } from "lucide-react";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased selection:bg-indigo-500/20 selection:text-indigo-900">
      <MarketingNav />

      {/* Header Banner */}
      <section className="border-b border-slate-200 bg-slate-50/70 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3">
            <Scale className="w-4 h-4" />
            <span>Legal Agreement</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Terms of Service
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
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
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 text-sm sm:text-base text-slate-700 leading-relaxed">
        {/* Intro callout */}
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 space-y-1.5">
          <div className="font-bold flex items-center gap-2 text-slate-900">
            <FileText className="w-4 h-4 text-indigo-600" />
            <span>Summary of Contractual Relationship</span>
          </div>
          <p className="text-slate-600">
            By registering a company workspace, accepting a team invitation, or using TASQ-ONE, you agree to be bound by these Terms of Service (&quot;Terms&quot;). If registering on behalf of an organization, you represent that you have authority to bind the entity.
          </p>
        </div>

        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">1. The Service</h2>
          <p>
            TASQ-ONE is a multi-tenant Work Operating System providing real-time Kanban task management, AI-assisted ticket decomposition, distraction-free morning checklists, dependency DAG blocking, and automated asynchronous alerts to registered organizations (&quot;Workspaces&quot;).
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">2. Accounts &amp; Strict Role Confinement</h2>
          <div className="space-y-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base">2.1 Company Registration &amp; Admin Authority</h3>
              <p className="mt-1">
                Only an authorized company representative may register a new Workspace via <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">/signup</code>. This grants the <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">admin</code> role responsible for member invitations, billing settings, and workspace governance.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 text-base">2.2 Team Members (Invite-Only Access)</h3>
              <p className="mt-1">
                Individual team members cannot self-register. Members join exclusively via secure single-use expiring token links issued by an active Admin or Manager.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 text-base">2.3 Account Responsibility</h3>
              <p className="mt-1">
                The organization Admin is responsible for all activity occurring under the workspace account. Any security breach or unauthorized credential use must be reported immediately to <a href="mailto:tasqoneworkos@gmail.com" className="text-indigo-600 underline font-semibold">tasqoneworkos@gmail.com</a>.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">3. Customer Content Ownership</h2>
          <p>
            You and your organization retain 100% ownership of all deliverables, task titles, descriptions, comments, checklists, and uploaded files (&quot;Your Content&quot;). You grant TASQ-ONE a strictly limited license to host, encrypt, process, and transmit Your Content solely to provide the Work OS service.
          </p>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">4. Prohibited Uses &amp; Fair Access</h2>
          <p>You agree not to:</p>
          <ul className="space-y-2 list-disc list-inside text-slate-600">
            <li>Attempt to probe, scrape, or access another organization&apos;s workspace data.</li>
            <li>Bypass rate limits, authentication tokens, or role-based routing controls.</li>
            <li>Upload malicious scripts, viruses, or illegal materials.</li>
            <li>Use the AI feature for malicious prompt injection, system prompt extraction, or non-task spam.</li>
            <li>Resell or sublicense the Service to third parties without prior written consent.</li>
          </ul>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">5. ₹0 Free Starter Pilot &amp; Subscription Terms</h2>
          <p>
            TASQ-ONE currently operates on the ₹0 Free Starter Pilot model for up to 5 team members. We do not require a credit card or UPI mandate to begin. When optional paid tiers (SMB Pro &amp; Enterprise Scale) become active in Phase 2, pricing will be clearly displayed in Indian Rupees (₹ INR) with advance notice before any billing activation.
          </p>
        </section>

        {/* Section 6 */}
        <section className="space-y-3 pt-6 border-t border-slate-200">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">6. Governing Law &amp; Jurisdiction</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising out of or related to these Terms shall be subject to the exclusive jurisdiction of the courts located in Delhi / Pune, India.
          </p>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
