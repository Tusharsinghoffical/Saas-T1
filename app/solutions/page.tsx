"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import {
  Briefcase,
  Terminal,
  Building,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Zap,
  Shield,
  Layers,
  Bot,
  CheckSquare,
} from "lucide-react";

export default function SolutionsPage() {
  const [selectedRole, setSelectedRole] = useState<
    "founders" | "engineering" | "operations"
  >("founders");

  return (
    <div className="min-h-screen bg-white bg-[radial-gradient(#d1d5db_1px,transparent_1px)] font-sans text-slate-900 antialiased [background-size:24px_24px] selection:bg-indigo-500/20 selection:text-indigo-900">
      <MarketingNav />

      {/* Hero Section */}
      <section className="mx-auto max-w-5xl space-y-6 px-4 py-16 text-center sm:px-6 sm:py-24">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3.5 py-1 font-mono text-xs font-bold uppercase tracking-wide text-indigo-700">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Tailored Team Solutions</span>
        </div>
        <h1 className="text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
          Purpose-Built Workflows for Every Department in Your Organization
        </h1>
        <p className="mx-auto max-w-3xl text-base leading-relaxed text-slate-600 sm:text-lg">
          From fast-paced marketing sprint campaigns to engineering releases and
          multi-branch SMB operations, TASQ-ONE provides customized views and
          automated AI deliverables.
        </p>

        {/* Role Switcher Tabs */}
        <div className="mx-auto inline-flex max-w-md gap-2 rounded-2xl border border-slate-200 bg-slate-100 p-1.5 shadow-inner">
          <button
            type="button"
            onClick={() => setSelectedRole("founders")}
            className={`flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              selectedRole === "founders"
                ? "border border-slate-200 bg-white text-indigo-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Briefcase className="h-4 w-4" />
            <span>Founders &amp; Marketing</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedRole("engineering")}
            className={`flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              selectedRole === "engineering"
                ? "border border-slate-200 bg-white text-emerald-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Terminal className="h-4 w-4" />
            <span>Software &amp; Product</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedRole("operations")}
            className={`flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              selectedRole === "operations"
                ? "border border-slate-200 bg-white text-amber-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Building className="h-4 w-4" />
            <span>Operations &amp; SMBs</span>
          </button>
        </div>
      </section>

      {/* Dynamic Content Display */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        {selectedRole === "founders" && (
          <div className="animate-fade-in space-y-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-xl sm:p-12">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-3 text-indigo-600">
                <Briefcase className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 sm:text-2xl">
                  Founders, Marketing &amp; Agencies
                </h3>
                <p className="text-xs text-slate-500 sm:text-sm">
                  Eliminate WhatsApp client chaos and manage multi-account
                  deliverables effortlessly.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 pt-4 md:grid-cols-3">
              <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>Instant Client Delivery Proof</span>
                </div>
                <p className="text-xs leading-relaxed text-slate-600">
                  Generate instant executive status cards without spending 2
                  hours compiling WhatsApp updates or spreadsheet reports.
                </p>
              </div>

              <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>AI Campaign Breakdown</span>
                </div>
                <p className="text-xs leading-relaxed text-slate-600">
                  Type a quick goal like &quot;Diwali Social Media Blitz&quot;
                  and let Groq AI break it down into creative assets,
                  copywriting, and ad schedules.
                </p>
              </div>

              <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>Zero Overdue Surprises</span>
                </div>
                <p className="text-xs leading-relaxed text-slate-600">
                  Visual urgency badges highlight deadlines due today or blocked
                  prerequisites before clients notice a delay.
                </p>
              </div>
            </div>
          </div>
        )}

        {selectedRole === "engineering" && (
          <div className="animate-fade-in space-y-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-xl sm:p-12">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-emerald-600">
                <Terminal className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 sm:text-2xl">
                  Software &amp; Product Engineering
                </h3>
                <p className="text-xs text-slate-500 sm:text-sm">
                  Strict DAG dependency blocking, sub-second ticket creation,
                  and clean async workflows.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 pt-4 md:grid-cols-3">
              <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>Dependency DAG Enforcement</span>
                </div>
                <p className="text-xs leading-relaxed text-slate-600">
                  Tasks are hard-blocked from reaching &quot;Completed&quot;
                  until all prerequisite tickets are verified and merged.
                </p>
              </div>

              <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>Llama 3.3 Acceptance Criteria</span>
                </div>
                <p className="text-xs leading-relaxed text-slate-600">
                  Instant Definition of Done generation with edge cases, schema
                  impacts, and testing checkpoints in under 1 second.
                </p>
              </div>

              <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>Slack Release Sync</span>
                </div>
                <p className="text-xs leading-relaxed text-slate-600">
                  Automated rich Slack webhook cards dispatch on ticket
                  completions without developers leaving their IDE.
                </p>
              </div>
            </div>
          </div>
        )}

        {selectedRole === "operations" && (
          <div className="animate-fade-in space-y-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-xl sm:p-12">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-amber-100 bg-amber-50 p-3 text-amber-600">
                <Building className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 sm:text-2xl">
                  Operations &amp; SMB Workspaces
                </h3>
                <p className="text-xs text-slate-500 sm:text-sm">
                  Standardize daily compliance, vendor onboarding, and branch
                  operations checklists.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 pt-4 md:grid-cols-3">
              <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>Daily Morning Checklist</span>
                </div>
                <p className="text-xs leading-relaxed text-slate-600">
                  Staff get a focused &quot;Due Today&quot; list with clear time
                  estimates and single-click completion toggles.
                </p>
              </div>

              <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>Immutable Audit Log</span>
                </div>
                <p className="text-xs leading-relaxed text-slate-600">
                  Every task change, attachment upload, and status transition is
                  recorded with timestamp and actor ID for compliance.
                </p>
              </div>

              <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>₹0 Starter Free Pilot</span>
                </div>
                <p className="text-xs leading-relaxed text-slate-600">
                  Equip up to 5 branch or office members with full task
                  coordination without upfront enterprise licensing fees.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Global CTA */}
        <div className="mt-12 space-y-6 rounded-3xl bg-slate-950 p-8 text-center text-white sm:p-12">
          <h3 className="text-2xl font-black sm:text-3xl">
            Ready to Streamline Your Team&apos;s Deliverables?
          </h3>
          <p className="mx-auto max-w-xl text-sm text-slate-400">
            Set up your organization workspace in 60 seconds with our ₹0 Free
            Starter Pilot. No credit card or UPI mandate required.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/signup"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3.5 text-sm font-bold shadow-lg transition-all hover:bg-indigo-700 sm:w-auto"
            >
              <span>Register Your Company</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="w-full rounded-2xl border border-slate-700 bg-slate-800 px-6 py-3.5 text-sm font-bold text-slate-200 transition-all hover:bg-slate-700 sm:w-auto"
            >
              <span>Employee Sign In</span>
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
