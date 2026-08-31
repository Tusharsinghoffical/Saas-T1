"use client";

import React from "react";
import Link from "next/link";
import { Zap, CheckCircle2, ShieldCheck, Clock, Server, ArrowRight } from "lucide-react";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

export default function ServiceLevelAgreementPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased selection:bg-indigo-500/20 selection:text-indigo-900">
      <MarketingNav />

      {/* Header Banner */}
      <section className="border-b border-slate-200 bg-slate-50/70 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3">
            <Zap className="w-4 h-4" />
            <span>Service Commitment &amp; Uptime</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            SaaS Subscription Agreement &amp; SLA
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
            Last Updated: August 31, 2026 • Plan Architecture &amp; Service Level Commitments
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 text-sm sm:text-base text-slate-700 leading-relaxed">
        {/* Intro */}
        <div className="p-5 rounded-2xl bg-indigo-50/70 border border-indigo-200 text-xs sm:text-sm text-indigo-950 space-y-1.5">
          <div className="font-bold flex items-center gap-2 text-indigo-900">
            <Server className="w-4 h-4 text-indigo-600" />
            <span>Commercial Subscription Architecture</span>
          </div>
          <p className="text-indigo-900">
            This document outlines the commercial tier structures, service availability targets, and support response commitments for TASQ-ONE Work OS.
          </p>
        </div>

        {/* Section 1 */}
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">1. Subscription Plans Breakdown</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* Free Starter Pilot */}
            <div className="p-5 rounded-2xl border-2 border-indigo-600 bg-white space-y-3 shadow-sm">
              <div className="inline-flex px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono font-bold">
                ● ACTIVE &amp; AVAILABLE
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Free Starter Pilot</h3>
                <div className="text-2xl font-black text-slate-900 mt-0.5">₹0 <span className="text-xs text-slate-500 font-normal">/ forever</span></div>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-600">
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Up to 5 team members</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Unlimited Kanban deliverables</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Core Groq AI Decomposer</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> PostgreSQL RLS security</li>
              </ul>
            </div>

            {/* SMB Pro */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-3 opacity-90">
              <div className="inline-flex px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-mono font-bold">
                PHASE 2 ROADMAP
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">SMB Pro</h3>
                <div className="text-2xl font-black text-slate-400 mt-0.5">₹999 <span className="text-xs text-slate-400 font-normal">/ org / mo</span></div>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-500">
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-slate-400 shrink-0" /> Unlimited team members</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-slate-400 shrink-0" /> Priority Groq AI 70B</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-slate-400 shrink-0" /> Automated Slack release cards</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-slate-400 shrink-0" /> 10GB Cloudflare R2 storage</li>
              </ul>
            </div>

            {/* Enterprise Scale */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-3 opacity-90">
              <div className="inline-flex px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-mono font-bold">
                PHASE 2 ROADMAP
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Enterprise Scale</h3>
                <div className="text-2xl font-black text-slate-400 mt-0.5">₹2,499 <span className="text-xs text-slate-400 font-normal">/ org / mo</span></div>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-500">
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-slate-400 shrink-0" /> Custom domain + SSL</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-slate-400 shrink-0" /> SAML/SSO Authentication</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-slate-400 shrink-0" /> 99.99% Uptime commitment</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-slate-400 shrink-0" /> Dedicated SLA agreements</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">2. Service Availability &amp; Infrastructure</h2>
          <p>
            - <strong>Free Starter Pilot:</strong> Provided on a high-availability best-effort basis across Supabase, Cloudflare, and Render cloud nodes.<br />
            - <strong>Scheduled Maintenance:</strong> Conducted during off-peak Indian business hours with advance dashboard announcements.<br />
            - <strong>Data Redundancy:</strong> Managed PostgreSQL volume backups and multi-region replication via Supabase.
          </p>
        </section>

        {/* Section 3 */}
        <section className="space-y-3 pt-6 border-t border-slate-200">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">3. Support Response SLA</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-100 text-slate-900 font-bold">
                <tr>
                  <th className="p-3 text-left border-b border-slate-200">Severity Tier</th>
                  <th className="p-3 text-left border-b border-slate-200">Target First Response Time</th>
                  <th className="p-3 text-left border-b border-slate-200">Support Channel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-600">
                <tr>
                  <td className="p-3 font-semibold text-rose-600">Critical (Workspace Outage)</td>
                  <td className="p-3 font-mono font-bold text-slate-800">&lt; 2 Hours</td>
                  <td className="p-3">Priority Email (<a href="mailto:tasqoneworkos@gmail.com" className="text-indigo-600 underline">tasqoneworkos@gmail.com</a>)</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-amber-600">Standard (Feature / Task Issue)</td>
                  <td className="p-3 font-mono text-slate-800">&lt; 8 Hours</td>
                  <td className="p-3">Email Desk</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-600">General Inquiry / Pilot Setup</td>
                  <td className="p-3 font-mono text-slate-800">&lt; 24 Hours</td>
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
