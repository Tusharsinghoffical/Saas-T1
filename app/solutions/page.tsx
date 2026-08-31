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
  const [selectedRole, setSelectedRole] = useState<"founders" | "engineering" | "operations">("founders");

  return (
    <div className="min-h-screen bg-white bg-[radial-gradient(#d1d5db_1px,transparent_1px)] [background-size:24px_24px] text-slate-900 selection:bg-indigo-500/20 selection:text-indigo-900 font-sans antialiased">
      <MarketingNav />

      {/* Hero Section */}
      <section className="py-16 sm:py-24 text-center max-w-5xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-mono font-bold text-indigo-700 uppercase tracking-wide">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Tailored Team Solutions</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight leading-tight">
          Purpose-Built Workflows for Every Department in Your Organization
        </h1>
        <p className="text-base sm:text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
          From fast-paced marketing sprint campaigns to engineering releases and multi-branch SMB operations, TASQ-ONE provides customized views and automated AI deliverables.
        </p>

        {/* Role Switcher Tabs */}
        <div className="inline-flex p-1.5 rounded-2xl bg-slate-100 border border-slate-200 shadow-inner gap-2 max-w-md mx-auto">
          <button
            type="button"
            onClick={() => setSelectedRole("founders")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              selectedRole === "founders"
                ? "bg-white text-indigo-600 shadow-sm border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Founders &amp; Marketing</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedRole("engineering")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              selectedRole === "engineering"
                ? "bg-white text-emerald-600 shadow-sm border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Software &amp; Product</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedRole("operations")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              selectedRole === "operations"
                ? "bg-white text-amber-600 shadow-sm border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Operations &amp; SMBs</span>
          </button>
        </div>
      </section>

      {/* Dynamic Content Display */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        {selectedRole === "founders" && (
          <div className="p-8 sm:p-12 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-8 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                <Briefcase className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900">Founders, Marketing &amp; Agencies</h3>
                <p className="text-xs sm:text-sm text-slate-500">Eliminate WhatsApp client chaos and manage multi-account deliverables effortlessly.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Instant Client Delivery Proof</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Generate instant executive status cards without spending 2 hours compiling WhatsApp updates or spreadsheet reports.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>AI Campaign Breakdown</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Type a quick goal like &quot;Diwali Social Media Blitz&quot; and let Groq AI break it down into creative assets, copywriting, and ad schedules.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Zero Overdue Surprises</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Visual urgency badges highlight deadlines due today or blocked prerequisites before clients notice a delay.
                </p>
              </div>
            </div>
          </div>
        )}

        {selectedRole === "engineering" && (
          <div className="p-8 sm:p-12 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-8 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                <Terminal className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900">Software &amp; Product Engineering</h3>
                <p className="text-xs sm:text-sm text-slate-500">Strict DAG dependency blocking, sub-second ticket creation, and clean async workflows.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Dependency DAG Enforcement</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Tasks are hard-blocked from reaching &quot;Completed&quot; until all prerequisite tickets are verified and merged.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Llama 3.3 Acceptance Criteria</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Instant Definition of Done generation with edge cases, schema impacts, and testing checkpoints in under 1 second.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Slack Release Sync</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Automated rich Slack webhook cards dispatch on ticket completions without developers leaving their IDE.
                </p>
              </div>
            </div>
          </div>
        )}

        {selectedRole === "operations" && (
          <div className="p-8 sm:p-12 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-8 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100">
                <Building className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900">Operations &amp; SMB Workspaces</h3>
                <p className="text-xs sm:text-sm text-slate-500">Standardize daily compliance, vendor onboarding, and branch operations checklists.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Daily Morning Checklist</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Staff get a focused &quot;Due Today&quot; list with clear time estimates and single-click completion toggles.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Immutable Audit Log</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Every task change, attachment upload, and status transition is recorded with timestamp and actor ID for compliance.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>₹0 Starter Free Pilot</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Equip up to 5 branch or office members with full task coordination without upfront enterprise licensing fees.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Global CTA */}
        <div className="mt-12 p-8 sm:p-12 rounded-3xl bg-slate-950 text-white text-center space-y-6">
          <h3 className="text-2xl sm:text-3xl font-black">Ready to Streamline Your Team&apos;s Deliverables?</h3>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Set up your organization workspace in 60 seconds with our ₹0 Free Starter Pilot. No credit card or UPI mandate required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <span>Register Your Company</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 font-bold text-sm border border-slate-700 transition-all text-slate-200"
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
