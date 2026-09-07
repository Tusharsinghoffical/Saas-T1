"use client";

import React from "react";
import { Zap, CheckCircle2, Server } from "lucide-react";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

export default function ServiceLevelAgreementPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 antialiased selection:bg-indigo-500/20 selection:text-indigo-900">
      <MarketingNav />

      {/* Header Banner */}
      <section className="border-b border-slate-200 bg-slate-50/70 py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600">
            <Zap className="h-4 w-4" />
            <span>Service Commitment &amp; Uptime</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            SaaS Subscription Agreement &amp; SLA
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
            Last Updated: August 31, 2026 • Plan Architecture &amp; Service
            Level Commitments
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl space-y-10 px-4 py-12 text-sm leading-relaxed text-slate-700 sm:px-6 sm:text-base lg:px-8">
        {/* Intro */}
        <div className="space-y-1.5 rounded-2xl border border-indigo-200 bg-indigo-50/70 p-5 text-xs text-indigo-950 sm:text-sm">
          <div className="flex items-center gap-2 font-bold text-indigo-900">
            <Server className="h-4 w-4 text-indigo-600" />
            <span>Commercial Subscription Architecture</span>
          </div>
          <p className="text-indigo-900">
            This document outlines the commercial tier structures, service
            availability targets, and support response commitments for TASQ-ONE
            Work OS.
          </p>
        </div>

        {/* Section 1 */}
        <section className="space-y-4">
          <h2 className="text-xl font-black text-slate-900 sm:text-2xl">
            1. Subscription Plans Breakdown
          </h2>

          <div className="grid grid-cols-1 gap-4 pt-2 md:grid-cols-3">
            {/* Free Starter Pilot */}
            <div className="space-y-3 rounded-2xl border-2 border-indigo-600 bg-white p-5 shadow-sm">
              <div className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-700">
                ● ACTIVE &amp; AVAILABLE
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Free Starter Pilot
                </h3>
                <div className="mt-0.5 text-2xl font-black text-slate-900">
                  ₹0{" "}
                  <span className="text-xs font-normal text-slate-500">
                    / forever
                  </span>
                </div>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-600">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />{" "}
                  Up to 5 team members
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />{" "}
                  Unlimited Kanban deliverables
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />{" "}
                  Core Groq AI Decomposer
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />{" "}
                  PostgreSQL RLS security
                </li>
              </ul>
            </div>

            {/* SMB Pro */}
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 opacity-90">
              <div className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-800">
                PHASE 2 ROADMAP
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">SMB Pro</h3>
                <div className="mt-0.5 text-2xl font-black text-slate-400">
                  ₹999{" "}
                  <span className="text-xs font-normal text-slate-400">
                    / org / mo
                  </span>
                </div>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-500">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />{" "}
                  Unlimited team members
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />{" "}
                  Priority Groq AI 70B
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />{" "}
                  Automated Slack release cards
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />{" "}
                  10GB Cloudflare R2 storage
                </li>
              </ul>
            </div>

            {/* Enterprise Scale */}
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 opacity-90">
              <div className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-800">
                PHASE 2 ROADMAP
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Enterprise Scale
                </h3>
                <div className="mt-0.5 text-2xl font-black text-slate-400">
                  ₹2,499{" "}
                  <span className="text-xs font-normal text-slate-400">
                    / org / mo
                  </span>
                </div>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-500">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />{" "}
                  Custom domain + SSL
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />{" "}
                  SAML/SSO Authentication
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />{" "}
                  99.99% Uptime commitment
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />{" "}
                  Dedicated SLA agreements
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-xl font-black text-slate-900 sm:text-2xl">
            2. Service Availability &amp; Infrastructure
          </h2>
          <p>
            - <strong>Free Starter Pilot:</strong> Provided on a
            high-availability best-effort basis across Supabase, Cloudflare, and
            Render cloud nodes.
            <br />- <strong>Scheduled Maintenance:</strong> Conducted during
            off-peak Indian business hours with advance dashboard announcements.
            <br />- <strong>Data Redundancy:</strong> Managed PostgreSQL volume
            backups and multi-region replication via Supabase.
          </p>
        </section>

        {/* Section 3 */}
        <section className="space-y-3 border-t border-slate-200 pt-6">
          <h2 className="text-xl font-black text-slate-900 sm:text-2xl">
            3. Support Response SLA
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full overflow-hidden rounded-xl border border-slate-200 text-xs sm:text-sm">
              <thead className="bg-slate-100 font-bold text-slate-900">
                <tr>
                  <th className="border-b border-slate-200 p-3 text-left">
                    Severity Tier
                  </th>
                  <th className="border-b border-slate-200 p-3 text-left">
                    Target First Response Time
                  </th>
                  <th className="border-b border-slate-200 p-3 text-left">
                    Support Channel
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-600">
                <tr>
                  <td className="p-3 font-semibold text-rose-600">
                    Critical (Workspace Outage)
                  </td>
                  <td className="p-3 font-mono font-bold text-slate-800">
                    &lt; 2 Hours
                  </td>
                  <td className="p-3">
                    Priority Email (
                    <a
                      href="mailto:tasqoneworkos@gmail.com"
                      className="text-indigo-600 underline"
                    >
                      tasqoneworkos@gmail.com
                    </a>
                    )
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-amber-600">
                    Standard (Feature / Task Issue)
                  </td>
                  <td className="p-3 font-mono text-slate-800">&lt; 8 Hours</td>
                  <td className="p-3">Email Desk</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-600">
                    General Inquiry / Pilot Setup
                  </td>
                  <td className="p-3 font-mono text-slate-800">
                    &lt; 24 Hours
                  </td>
                  <td className="p-3">Email &amp; Documentation</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
