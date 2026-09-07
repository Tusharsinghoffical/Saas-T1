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
    <div className="min-h-screen bg-white font-sans text-slate-900 antialiased selection:bg-indigo-500/20 selection:text-indigo-900">
      <MarketingNav />

      {/* Header Banner */}
      <section className="border-b border-slate-200 bg-slate-50/70 py-12 sm:py-16">
        <div className="mx-auto max-w-4xl space-y-4 px-4 text-center sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
            <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" />
            <span>Built for High-Velocity Startups &amp; Growing Teams</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
            About TASQ-ONE Work OS
          </h1>
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
            Eliminating the daily chaos of managing mission-critical business
            deliverables over WhatsApp group chats and disorganized
            spreadsheets.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="mx-auto max-w-5xl space-y-16 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        {/* Mission & Origin */}
        <section className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
          <div className="space-y-4 text-sm leading-relaxed text-slate-700 sm:text-base">
            <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Why We Built TASQ-ONE
            </h2>
            <p>
              Growing teams lose over 10 hours every week simply chasing status
              updates: <em>&quot;Rohan, us client ki file ka kya hua?&quot;</em>
              , <em>&quot;Priya, design ready hai kya?&quot;</em>.
            </p>
            <p>
              Traditional tools like Jira and Asana are often too heavy, slow,
              and complex for high-velocity teams, forcing people back onto
              WhatsApp groups where accountability disappears.
            </p>
            <p>
              <strong>TASQ-ONE</strong> was engineered to bridge this gap:
              combining the speed of sub-second Groq AI task decomposition with
              distraction-free morning checklists and automated async Slack
              alerts.
            </p>
          </div>

          <div className="space-y-6 rounded-3xl bg-slate-900 p-8 text-white shadow-2xl">
            <div className="font-mono text-xs font-bold uppercase tracking-wider text-indigo-400">
              Core Architecture &amp; Team
            </div>
            <div className="space-y-3">
              <div className="text-2xl font-black text-white">Tushar Singh</div>
              <div className="text-sm text-slate-300">
                Founder &amp; Lead System Architect
              </div>
              <p className="text-xs leading-relaxed text-slate-400">
                Full-stack engineer specializing in multi-tenant SaaS
                architecture, PostgreSQL Row-Level Security, distributed
                systems, and real-time developer tooling.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <a
                href="https://codewithmrsingh.me/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-indigo-700"
              >
                <span>Visit Developer Portfolio</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <Link
                href="/contact"
                className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-slate-200 transition-all hover:bg-slate-700"
              >
                <span>Get In Touch</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Pillars / Values */}
        <section className="space-y-8">
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-black text-slate-900 sm:text-3xl">
              Our Engineering Principles
            </h2>
            <p className="text-sm text-slate-600">
              The standards behind every feature in TASQ-ONE.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="space-y-3 rounded-3xl border border-slate-200/80 bg-slate-50 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-100 font-bold text-indigo-700">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Speed &amp; Simplicity
              </h3>
              <p className="text-xs leading-relaxed text-slate-600">
                Sub-second page transitions and AI ticket generation. Zero
                configuration bloated onboarding.
              </p>
            </div>

            <div className="space-y-3 rounded-3xl border border-slate-200/80 bg-slate-50 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 font-bold text-emerald-700">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Bank-Grade Multi-Tenancy
              </h3>
              <p className="text-xs leading-relaxed text-slate-600">
                PostgreSQL Row-Level Security ensures your company&apos;s data
                is 100% cryptographically isolated.
              </p>
            </div>

            <div className="space-y-3 rounded-3xl border border-slate-200/80 bg-slate-50 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-100 font-bold text-purple-700">
                <Target className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Verified Deliverables
              </h3>
              <p className="text-xs leading-relaxed text-slate-600">
                4-point technical acceptance criteria and hard dependency DAG
                blocking for zero rework.
              </p>
            </div>
          </div>
        </section>

        {/* Headquarters & Support */}
        <section className="flex flex-col items-center justify-between gap-6 rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-purple-50 to-slate-50 p-8 md:flex-row">
          <div className="space-y-2 text-center md:text-left">
            <div className="font-mono text-xs font-bold uppercase tracking-wider text-indigo-600">
              📍 Delhi / Pune HQ • India
            </div>
            <h3 className="text-xl font-black text-slate-900 sm:text-2xl">
              Ready to Upgrade Your Team&apos;s Execution?
            </h3>
            <p className="text-xs text-slate-600 sm:text-sm">
              Start your free 5-member starter pilot in under 60 seconds with
              zero credit card required.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <Link
              href="/signup"
              className="flex items-center gap-2 rounded-2xl bg-[#0B0F19] px-6 py-3.5 text-xs font-bold text-white shadow-lg transition-all hover:bg-slate-800"
            >
              <span>Register Company</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
