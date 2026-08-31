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
    <div className="min-h-screen bg-white bg-[radial-gradient(#d1d5db_1px,transparent_1px)] [background-size:24px_24px] text-slate-900 selection:bg-indigo-500/20 selection:text-indigo-900 font-sans antialiased">
      <MarketingNav />

      {/* Hero */}
      <section className="py-16 sm:py-24 text-center max-w-5xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-mono font-bold text-emerald-700 uppercase tracking-wide">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Simple, Transparent Pricing</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight leading-tight">
          Launch for Free. Scale As Your Deliverables Grow.
        </h1>
        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          No hidden fees, no per-seat surprise bills. Get started with our ₹0 Free Starter Pilot today.
        </p>
      </section>

      {/* Pricing Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {/* Plan 1: Free Starter Pilot (Active) */}
          <div className="p-8 sm:p-10 rounded-3xl bg-white border-2 border-emerald-500 shadow-xl flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-emerald-500 text-white font-bold text-[10px] uppercase tracking-wider px-4 py-1 rounded-bl-xl">
              Active Pilot
            </div>
            <div className="space-y-6">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-600">Starter Tier</span>
                <h3 className="text-2xl font-black text-slate-900 mt-1">₹0 Free Pilot</h3>
                <p className="text-xs text-slate-500 mt-1">Perfect for founders, small agencies, and pilot teams.</p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-4xl sm:text-5xl font-black text-slate-900">₹0</span>
                <span className="text-xs text-slate-500 font-bold">/ forever</span>
              </div>

              <ul className="space-y-3 pt-4 border-t border-slate-100 text-xs text-slate-700">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Up to 5 Team Members</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Unlimited Tasks &amp; Sprint Boards</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Groq AI Task Decomposer (Llama 3.3 70B)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Due Today Morning Checklist</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>PostgreSQL Row-Level Security Isolation</span>
                </li>
              </ul>
            </div>

            <div className="pt-8">
              <Link
                href="/signup"
                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 font-bold text-white text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Plan 2: SMB Pro (Phase 2) */}
          <div className="p-8 sm:p-10 rounded-3xl bg-slate-50 border border-slate-200 shadow-sm flex flex-col justify-between opacity-95">
            <div className="space-y-6">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-600">Phase 2 Tier</span>
                <h3 className="text-2xl font-black text-slate-900 mt-1">SMB Pro</h3>
                <p className="text-xs text-slate-500 mt-1">For scaling teams with multi-project workflows.</p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-4xl sm:text-5xl font-black text-slate-900">₹999</span>
                <span className="text-xs text-slate-500 font-bold">/ month</span>
              </div>

              <ul className="space-y-3 pt-4 border-t border-slate-200 text-xs text-slate-700">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Unlimited Team Members</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Slack Broadcast Integration</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>10GB Cloudflare R2 Storage</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Automated AI Weekly Summaries</span>
                </li>
              </ul>
            </div>

            <div className="pt-8">
              <button
                disabled
                className="w-full py-3.5 px-4 rounded-2xl bg-slate-200 text-slate-500 font-bold text-xs cursor-not-allowed"
              >
                Coming in Phase 2
              </button>
            </div>
          </div>

          {/* Plan 3: Enterprise Scale */}
          <div className="p-8 sm:p-10 rounded-3xl bg-slate-50 border border-slate-200 shadow-sm flex flex-col justify-between opacity-95">
            <div className="space-y-6">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-purple-600">Enterprise</span>
                <h3 className="text-2xl font-black text-slate-900 mt-1">Custom Scale</h3>
                <p className="text-xs text-slate-500 mt-1">Dedicated cloud tenant &amp; SLA guarantee.</p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-4xl sm:text-5xl font-black text-slate-900">₹2,499</span>
                <span className="text-xs text-slate-500 font-bold">/ month</span>
              </div>

              <ul className="space-y-3 pt-4 border-t border-slate-200 text-xs text-slate-700">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>Custom Subdomains &amp; SSO</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>99.9% Uptime SLA</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>Immutable Audit Log Export</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>Priority 24/7 Support</span>
                </li>
              </ul>
            </div>

            <div className="pt-8">
              <a
                href="mailto:tasqoneworkos@gmail.com?subject=Enterprise%20Inquiry"
                className="w-full py-3.5 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all flex items-center justify-center gap-2"
              >
                <span>Contact Enterprise</span>
              </a>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Frequently Asked Questions</h2>
            <p className="text-xs sm:text-sm text-slate-500">Everything you need to know about TASQ-ONE pricing and plans.</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-slate-900 hover:bg-slate-50 cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                      openFaq === idx ? "rotate-180 text-indigo-600" : ""
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3 animate-fade-in">
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
