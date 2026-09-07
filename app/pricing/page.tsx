"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import {
  Check,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  HelpCircle,
  Clock,
  Layers,
  ChevronDown,
} from "lucide-react";

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: "Is the ₹0 Free Starter Pilot really free forever?",
      a: "Yes! Our Free Starter Pilot includes unlimited deliverables, AI task decomposition, employee focus views, and multi-tenant RLS isolation for up to 5 members with zero credit card or UPI mandate required.",
    },
    {
      q: "When will paid tiers (SMB Pro & Enterprise) launch?",
      a: "Paid plans will go live in Phase 2 with Razorpay UPI AutoPay and Stripe integration. Existing Pilot teams will retain their data and settings seamlessly.",
    },
    {
      q: "How does TASQ-ONE isolate our company's data?",
      a: "Every single database query is filtered at the PostgreSQL engine level using Supabase Row-Level Security (RLS) policies and cryptographically verified JWT tokens.",
    },
    {
      q: "Can we invite our entire team easily?",
      a: "Yes! Workspace Admins and Managers can invite employees via single-use email invitation links with server-enforced roles.",
    },
  ];

  return (
    <div className="min-h-screen bg-white bg-[radial-gradient(#d1d5db_1px,transparent_1px)] font-sans text-slate-900 antialiased [background-size:24px_24px] selection:bg-indigo-500/20 selection:text-indigo-900">
      <MarketingNav />

      {/* Hero */}
      <section className="mx-auto max-w-5xl space-y-6 px-4 py-16 text-center sm:px-6 sm:py-24">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1 font-mono text-xs font-bold uppercase tracking-wide text-emerald-700">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Simple, Transparent Pricing</span>
        </div>
        <h1 className="text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
          Launch for Free. Scale As Your Deliverables Grow.
        </h1>
        <p className="mx-auto max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
          No hidden fees, no per-seat surprise bills. Get started with our ₹0
          Free Starter Pilot today.
        </p>
      </section>

      {/* Pricing Cards */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-3">
          {/* Plan 1: Free Starter Pilot (Active) */}
          <div className="relative flex flex-col justify-between overflow-hidden rounded-3xl border-2 border-emerald-500 bg-white p-8 shadow-xl sm:p-10">
            <div className="absolute right-0 top-0 rounded-bl-xl bg-emerald-500 px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
              Active Pilot
            </div>
            <div className="space-y-6">
              <div>
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-emerald-600">
                  Starter Tier
                </span>
                <h3 className="mt-1 text-2xl font-black text-slate-900">
                  ₹0 Free Pilot
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Perfect for founders, small agencies, and pilot teams.
                </p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-slate-900 sm:text-5xl">
                  ₹0
                </span>
                <span className="text-xs font-bold text-slate-500">
                  / forever
                </span>
              </div>

              <ul className="space-y-3 border-t border-slate-100 pt-4 text-xs text-slate-700">
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>Up to 5 Team Members</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>Unlimited Tasks &amp; Sprint Boards</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>Groq AI Task Decomposer (Llama 3.3 70B)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>Due Today Morning Checklist</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>PostgreSQL Row-Level Security Isolation</span>
                </li>
              </ul>
            </div>

            <div className="pt-8">
              <Link
                href="/signup"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3.5 text-xs font-bold text-white shadow-md transition-all hover:bg-emerald-700"
              >
                <span>Get Started Free</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Plan 2: SMB Pro (Phase 2) */}
          <div className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-slate-50 p-8 opacity-95 shadow-sm sm:p-10">
            <div className="space-y-6">
              <div>
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-indigo-600">
                  Phase 2 Tier
                </span>
                <h3 className="mt-1 text-2xl font-black text-slate-900">
                  SMB Pro
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  For scaling teams with multi-project workflows.
                </p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-slate-900 sm:text-5xl">
                  ₹999
                </span>
                <span className="text-xs font-bold text-slate-500">
                  / month
                </span>
              </div>

              <ul className="space-y-3 border-t border-slate-200 pt-4 text-xs text-slate-700">
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 shrink-0 text-indigo-600" />
                  <span>Unlimited Team Members</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 shrink-0 text-indigo-600" />
                  <span>Slack Broadcast Integration</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 shrink-0 text-indigo-600" />
                  <span>10GB Cloudflare R2 Storage</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 shrink-0 text-indigo-600" />
                  <span>Automated AI Weekly Summaries</span>
                </li>
              </ul>
            </div>

            <div className="pt-8">
              <button
                disabled
                className="w-full cursor-not-allowed rounded-2xl bg-slate-200 px-4 py-3.5 text-xs font-bold text-slate-500"
              >
                Coming in Phase 2
              </button>
            </div>
          </div>

          {/* Plan 3: Enterprise Scale */}
          <div className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-slate-50 p-8 opacity-95 shadow-sm sm:p-10">
            <div className="space-y-6">
              <div>
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-purple-600">
                  Enterprise
                </span>
                <h3 className="mt-1 text-2xl font-black text-slate-900">
                  Custom Scale
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Dedicated cloud tenant &amp; SLA guarantee.
                </p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-slate-900 sm:text-5xl">
                  ₹2,499
                </span>
                <span className="text-xs font-bold text-slate-500">
                  / month
                </span>
              </div>

              <ul className="space-y-3 border-t border-slate-200 pt-4 text-xs text-slate-700">
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 shrink-0 text-purple-600" />
                  <span>Custom Subdomains &amp; SSO</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 shrink-0 text-purple-600" />
                  <span>99.9% Uptime SLA</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 shrink-0 text-purple-600" />
                  <span>Immutable Audit Log Export</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 shrink-0 text-purple-600" />
                  <span>Priority 24/7 Support</span>
                </li>
              </ul>
            </div>

            <div className="pt-8">
              <a
                href="mailto:tasqoneworkos@gmail.com?subject=Enterprise%20Inquiry"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3.5 text-xs font-bold text-white transition-all hover:bg-slate-800"
              >
                <span>Contact Enterprise</span>
              </a>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mx-auto mt-20 max-w-4xl space-y-8">
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
              Frequently Asked Questions
            </h2>
            <p className="text-xs text-slate-500 sm:text-sm">
              Everything you need to know about TASQ-ONE pricing and plans.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="shadow-xs overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="flex w-full cursor-pointer items-center justify-between gap-4 p-5 text-left text-sm font-bold text-slate-900 hover:bg-slate-50"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${
                      openFaq === idx ? "rotate-180 text-indigo-600" : ""
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="animate-fade-in border-t border-slate-100 px-5 pb-5 pt-3 text-xs leading-relaxed text-slate-600">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
