"use client";

import React from "react";
import { FileText, Scale } from "lucide-react";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 antialiased selection:bg-indigo-500/20 selection:text-indigo-900">
      <MarketingNav />

      {/* Header Banner */}
      <section className="border-b border-slate-200 bg-slate-50/70 py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600">
            <Scale className="h-4 w-4" />
            <span>Legal Agreement</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Terms of Service
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
        <div className="space-y-1.5 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-xs text-slate-800 sm:text-sm">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <FileText className="h-4 w-4 text-indigo-600" />
            <span>Summary of Contractual Relationship</span>
          </div>
          <p className="text-slate-600">
            By registering a company workspace, accepting a team invitation, or
            using TASQ-ONE, you agree to be bound by these Terms of Service
            (&quot;Terms&quot;). If registering on behalf of an organization,
            you represent that you have authority to bind the entity.
          </p>
        </div>

        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-xl font-black text-slate-900 sm:text-2xl">
            1. The Service
          </h2>
          <p>
            TASQ-ONE is a multi-tenant Work Operating System providing real-time
            Kanban task management, AI-assisted ticket decomposition,
            distraction-free morning checklists, dependency DAG blocking, and
            automated asynchronous alerts to registered organizations
            (&quot;Workspaces&quot;).
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-4">
          <h2 className="text-xl font-black text-slate-900 sm:text-2xl">
            2. Accounts &amp; Strict Role Confinement
          </h2>
          <div className="space-y-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                2.1 Company Registration &amp; Admin Authority
              </h3>
              <p className="mt-1">
                Only an authorized company representative may register a new
                Workspace via{" "}
                <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">
                  /signup
                </code>
                . This grants the{" "}
                <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">
                  admin
                </code>{" "}
                role responsible for member invitations, billing settings, and
                workspace governance.
              </p>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">
                2.2 Team Members (Invite-Only Access)
              </h3>
              <p className="mt-1">
                Individual team members cannot self-register. Members join
                exclusively via secure single-use expiring token links issued by
                an active Admin or Manager.
              </p>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">
                2.3 Account Responsibility
              </h3>
              <p className="mt-1">
                The organization Admin is responsible for all activity occurring
                under the workspace account. Any security breach or unauthorized
                credential use must be reported immediately to{" "}
                <a
                  href="mailto:tasqoneworkos@gmail.com"
                  className="font-semibold text-indigo-600 underline"
                >
                  tasqoneworkos@gmail.com
                </a>
                .
              </p>
            </div>
          </div>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="text-xl font-black text-slate-900 sm:text-2xl">
            3. Customer Content Ownership
          </h2>
          <p>
            You and your organization retain 100% ownership of all deliverables,
            task titles, descriptions, comments, checklists, and uploaded files
            (&quot;Your Content&quot;). You grant TASQ-ONE a strictly limited
            license to host, encrypt, process, and transmit Your Content solely
            to provide the Work OS service.
          </p>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="text-xl font-black text-slate-900 sm:text-2xl">
            4. Prohibited Uses &amp; Fair Access
          </h2>
          <p>You agree not to:</p>
          <ul className="list-inside list-disc space-y-2 text-slate-600">
            <li>
              Attempt to probe, scrape, or access another organization&apos;s
              workspace data.
            </li>
            <li>
              Bypass rate limits, authentication tokens, or role-based routing
              controls.
            </li>
            <li>Upload malicious scripts, viruses, or illegal materials.</li>
            <li>
              Use the AI feature for malicious prompt injection, system prompt
              extraction, or non-task spam.
            </li>
            <li>
              Resell or sublicense the Service to third parties without prior
              written consent.
            </li>
          </ul>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <h2 className="text-xl font-black text-slate-900 sm:text-2xl">
            5. ₹0 Free Starter Pilot &amp; Subscription Terms
          </h2>
          <p>
            TASQ-ONE currently operates on the ₹0 Free Starter Pilot model for
            up to 5 team members. We do not require a credit card or UPI mandate
            to begin. When optional paid tiers (SMB Pro &amp; Enterprise Scale)
            become active in Phase 2, pricing will be clearly displayed in
            Indian Rupees (₹ INR) with advance notice before any billing
            activation.
          </p>
        </section>

        {/* Section 6 */}
        <section className="space-y-3 border-t border-slate-200 pt-6">
          <h2 className="text-xl font-black text-slate-900 sm:text-2xl">
            6. Governing Law &amp; Jurisdiction
          </h2>
          <p>
            These Terms shall be governed by and construed in accordance with
            the laws of India. Any disputes arising out of or related to these
            Terms shall be subject to the exclusive jurisdiction of the courts
            located in Delhi / Pune, India.
          </p>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
