"use client";

import React from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Target,
  Users,
  Building,
  Terminal,
  ExternalLink,
  Lock,
  Heart,
  CheckCircle2,
} from "lucide-react";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased selection:bg-indigo-500/20 selection:text-indigo-900">
      <MarketingNav />

      {/* Header Banner */}
      <section className="border-b border-slate-200 bg-slate-50/70 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-bold text-indigo-700">
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>Built for High-Velocity Startups &amp; Growing Teams</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
            About TASQ-ONE Work OS
          </h1>
          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-600 leading-relaxed">
            Eliminating the daily chaos of managing mission-critical business deliverables over WhatsApp group chats and disorganized spreadsheets.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-16">
        {/* Mission & Origin */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4 text-slate-700 leading-relaxed text-sm sm:text-base">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Why We Built TASQ-ONE
            </h2>
            <p>
              Growing teams lose over 10 hours every week simply chasing status updates: <em>&quot;Rohan, us client ki file ka kya hua?&quot;</em>, <em>&quot;Priya, design ready hai kya?&quot;</em>.
            </p>
            <p>
              Traditional tools like Jira and Asana are often too heavy, slow, and complex for high-velocity teams, forcing people back onto WhatsApp groups where accountability disappears.
            </p>
            <p>
              <strong>TASQ-ONE</strong> was engineered to bridge this gap: combining the speed of sub-second Groq AI task decomposition with distraction-free morning checklists and automated async Slack alerts.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-slate-900 text-white space-y-6 shadow-2xl">
            <div className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-wider">
              Core Architecture &amp; Team
            </div>
            <div className="space-y-3">
              <div className="text-2xl font-black text-white">Tushar Singh</div>
              <div className="text-sm text-slate-300">Founder &amp; Lead System Architect</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Full-stack engineer specializing in multi-tenant SaaS architecture, PostgreSQL Row-Level Security, distributed systems, and real-time developer tooling.
              </p>
            </div>
            <div className="pt-2 flex flex-wrap gap-3">
              <a
                href="https://codewithmrsingh.me/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold text-xs text-white transition-all flex items-center gap-1.5"
              >
                <span>Visit Developer Portfolio</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <Link
                href="/contact"
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 font-bold text-xs text-slate-200 transition-all flex items-center gap-1.5"
              >
                <span>Get In Touch</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Pillars / Values */}
        <section className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Our Engineering Principles</h2>
            <p className="text-sm text-slate-600">The standards behind every feature in TASQ-ONE.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Speed &amp; Simplicity</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Sub-second page transitions and AI ticket generation. Zero configuration bloated onboarding.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Bank-Grade Multi-Tenancy</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                PostgreSQL Row-Level Security ensures your company&apos;s data is 100% cryptographically isolated.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <Target className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Verified Deliverables</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                4-point technical acceptance criteria and hard dependency DAG blocking for zero rework.
              </p>
            </div>
          </div>
        </section>

        {/* Headquarters & Support */}
        <section className="p-8 rounded-3xl bg-gradient-to-br from-indigo-50 via-purple-50 to-slate-50 border border-indigo-100 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="text-xs font-mono font-bold text-indigo-600 uppercase tracking-wider">
              📍 Delhi / Pune HQ • India
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900">
              Ready to Upgrade Your Team&apos;s Execution?
            </h3>
            <p className="text-xs sm:text-sm text-slate-600">
              Start your free 5-member starter pilot in under 60 seconds with zero credit card required.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/signup"
              className="px-6 py-3.5 rounded-2xl bg-[#0B0F19] hover:bg-slate-800 font-bold text-white text-xs shadow-lg transition-all flex items-center gap-2"
            >
              <span>Register Company</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
