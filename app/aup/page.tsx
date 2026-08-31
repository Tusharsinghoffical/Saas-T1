"use client";

import React from "react";
import Link from "next/link";
import { FileCheck, ShieldAlert, CheckCircle2, AlertTriangle } from "lucide-react";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

export default function AcceptableUsePolicyPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased selection:bg-indigo-500/20 selection:text-indigo-900">
      <MarketingNav />

      {/* Header Banner */}
      <section className="border-b border-slate-200 bg-slate-50/70 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-600 uppercase tracking-wider mb-3">
            <FileCheck className="w-4 h-4" />
            <span>Usage Conduct</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Acceptable Use Policy (AUP)
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
            Last Updated: August 31, 2026 • Usage Standards for TASQ-ONE Work OS
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 text-sm sm:text-base text-slate-700 leading-relaxed">
        {/* Intro */}
        <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs sm:text-sm text-amber-950 space-y-1.5">
          <div className="font-bold flex items-center gap-2 text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Operational Integrity Standards</span>
          </div>
          <p className="text-amber-900">
            This Acceptable Use Policy sets out the rules governing user conduct, fair access limits, and content boundaries across TASQ-ONE. It works alongside our Terms of Service.
          </p>
        </div>

        {/* Section 1 */}
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">1. Workspace &amp; Membership Rules</h2>
          <div className="space-y-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base">1.1 Legitimate Workspace Registration</h3>
              <p className="mt-1">
                Only one Workspace should be registered per legitimate organization. Creating duplicate workspaces to circumvent free-tier pilot user caps is strictly prohibited.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">1.2 Invite Integrity &amp; Token Security</h3>
              <p className="mt-1">
                Team members must join solely through legitimate invitation tokens. Forging, brute-forcing, or reusing expired invite tokens is treated as an attempted security violation.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">1.3 Role Discipline</h3>
              <p className="mt-1">
                Admins and Managers must accurately assign roles based on organizational authority. Employees must not attempt to circumvent role confinement boundaries.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">2. Prohibited Content</h2>
          <p>Users may not upload, publish, or transmit through TASQ-ONE any content that:</p>
          <ul className="space-y-2 list-disc list-inside text-slate-600">
            <li>Violates Indian laws or international regulations.</li>
            <li>Contains malware, malicious macros, or viruses.</li>
            <li>Infringes on third-party intellectual property or copyright.</li>
            <li>Contains abusive, harassing, or defamatory language.</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">3. Fair Use of AI &amp; API Systems</h2>
          <p>
            The &quot;Enhance with AI&quot; feature is designed for deliverable structuring and task specification. Automated scraping, bulk automated prompts, or prompt injection probing is prohibited and subject to automated IP blacklisting.
          </p>
        </section>

        {/* Section 4 */}
        <section className="space-y-3 pt-6 border-t border-slate-200">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">4. Enforcement &amp; Account Suspension</h2>
          <p>
            Violations of this Acceptable Use Policy may result in immediate workspace suspension or permanent termination. For questions or appeals, contact <a href="mailto:tasqoneworkos@gmail.com" className="text-indigo-600 underline font-semibold">tasqoneworkos@gmail.com</a>.
          </p>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
