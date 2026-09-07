"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import {
  LayoutDashboard,
  Bot,
  CheckSquare,
  Bell,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Layers,
  Zap,
  TrendingUp,
  Flame,
} from "lucide-react";

export default function FeaturesPage() {
  const [activeTab, setActiveTab] = useState<
    "kanban" | "ai" | "employee" | "broadcast"
  >("kanban");
  const [aiPrompt, setAiPrompt] = useState(
    "Launch UPI Auto-Pay integration for recurring B2B subscriptions"
  );
  const [aiGenerating, setAiGenerating] = useState(false);

  React.useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash) {
      const hash = window.location.hash.replace("#", "");
      if (["kanban", "ai", "employee", "broadcast"].includes(hash)) {
        setActiveTab(hash as "kanban" | "ai" | "employee" | "broadcast");
      }
    }
  }, []);

  const [aiResult, setAiResult] = useState<{
    key: string;
    title: string;
    priority: string;
    department: string;
    assignee: string;
    criteria: string[];
    estimate: string;
  }>({
    key: "TSQ-128",
    title: "Launch UPI Auto-Pay Integration for Recurring B2B Subscriptions",
    priority: "urgent",
    department: "Engineering (Delhi / Pune HQ)",
    assignee: "Rohan Verma (Tech Lead)",
    criteria: [
      "Integrate UPI Intent flow & QR code tokenization via Razorpay SDK",
      "Configure real-time webhook listener with HMAC-SHA256 signature verification",
      "Set up automatic WhatsApp and Email payment receipts via Gupshup/Resend",
      "Validate fallback netbanking and RuPay card transaction flows",
    ],
    estimate: "6 Hours (2 Days)",
  });

  const handleSimulateAi = (prompt: string) => {
    setAiGenerating(true);
    setAiPrompt(prompt);
    setTimeout(() => {
      setAiResult({
        key: "TSQ-130",
        title: prompt.toUpperCase(),
        priority: "high",
        department: "Engineering / Operations",
        assignee: "Rohan Verma",
        criteria: [
          "Validate schema requirements and dependency constraints",
          "Ensure PostgreSQL RLS security compliance",
          "Test end-to-end user acceptance criteria",
          "Deploy verified release to staging environment",
        ],
        estimate: "4 Hours (1 Day)",
      });
      setAiGenerating(false);
    }, 450);
  };

  return (
    <div className="min-h-screen bg-white bg-[radial-gradient(#d1d5db_1px,transparent_1px)] font-sans text-slate-900 antialiased [background-size:24px_24px] selection:bg-indigo-500/20 selection:text-indigo-900">
      <MarketingNav />

      {/* Hero */}
      <section className="mx-auto max-w-5xl space-y-6 px-4 py-16 text-center sm:px-6 sm:py-24">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3.5 py-1 font-mono text-xs font-bold uppercase tracking-wide text-indigo-700">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Core Platform Features</span>
        </div>
        <h1 className="text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
          Everything Your Team Needs to Execute Without Meeting Fatigue
        </h1>
        <p className="mx-auto max-w-3xl text-base leading-relaxed text-slate-600 sm:text-lg">
          Explore the interactive features of TASQ-ONE: from real-time Kanban
          sprint tracking and sub-second Groq AI ticket decomposition to morning
          focus checklists.
        </p>

        {/* Feature Tabs */}
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-2 pt-4">
          <button
            type="button"
            onClick={() => setActiveTab("kanban")}
            className={`flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === "kanban"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <LayoutDashboard className="h-4 w-4 text-indigo-400" />
            <span>Sprint Kanban Board</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("ai")}
            className={`flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === "ai"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <Bot className="h-4 w-4 text-purple-400" />
            <span>AI Task Decomposer</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("employee")}
            className={`flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === "employee"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <CheckSquare className="h-4 w-4 text-emerald-400" />
            <span>Due Today Focus Mode</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("broadcast")}
            className={`flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === "broadcast"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <Bell className="h-4 w-4 text-blue-400" />
            <span>Slack &amp; Email Alerts</span>
          </button>
        </div>
      </section>

      {/* Interactive Feature Sandbox */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="space-y-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-10">
          {activeTab === "kanban" && (
            <div id="kanban" className="animate-fade-in space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-slate-900">
                    Sprint Delivery Board
                  </h3>
                  <p className="text-xs text-slate-500">
                    Live multi-column drag-and-drop board with DAG dependency
                    blocking.
                  </p>
                </div>
                <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
                  Interactive Simulator
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
                    <span>To Do</span>
                    <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px]">
                      1
                    </span>
                  </div>
                  <div className="shadow-xs space-y-2 rounded-xl border border-slate-200 bg-white p-3.5">
                    <span className="rounded bg-indigo-50 px-2 py-0.5 font-mono text-[10px] font-bold text-indigo-600">
                      TSQ-101
                    </span>
                    <div className="text-xs font-bold text-slate-900">
                      Prepare Enterprise Client Proposal &amp; SLA
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Assignee: Aarav Sharma
                    </div>
                  </div>
                </div>

                <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
                    <span>In Progress</span>
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] text-amber-700">
                      2
                    </span>
                  </div>
                  <div className="shadow-xs space-y-2 rounded-xl border border-slate-200 bg-white p-3.5">
                    <span className="rounded bg-amber-50 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-600">
                      TSQ-103
                    </span>
                    <div className="text-xs font-bold text-slate-900">
                      Mobile App Redesign &amp; UPI Flow
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Assignee: Ananya Roy
                    </div>
                  </div>
                </div>

                <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
                    <span>Completed</span>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] text-emerald-700">
                      1
                    </span>
                  </div>
                  <div className="shadow-xs space-y-2 rounded-xl border border-emerald-200 bg-white p-3.5">
                    <span className="rounded bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-600">
                      TSQ-105
                    </span>
                    <div className="text-xs font-bold text-slate-900">
                      Monthly GST &amp; TDS Invoicing Audit
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Verified Done</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "ai" && (
            <div id="ai" className="animate-fade-in space-y-6">
              <div>
                <h3 className="text-xl font-black text-slate-900">
                  Groq Llama 3.3 70B AI Task Decomposer
                </h3>
                <p className="text-xs text-slate-500">
                  Transform a single prompt into structured Definition of Done
                  items in &lt;1 second.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter a task description..."
                  />
                  <button
                    type="button"
                    onClick={() => handleSimulateAi(aiPrompt)}
                    disabled={aiGenerating}
                    className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-purple-700 disabled:opacity-60"
                  >
                    <Bot className="h-4 w-4" />
                    <span>
                      {aiGenerating ? "Decomposing..." : "Enhance with AI"}
                    </span>
                  </button>
                </div>

                {/* AI Result Card */}
                <div className="space-y-4 rounded-2xl border border-purple-200 bg-purple-50/50 p-5">
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-purple-100 px-2 py-0.5 font-mono text-xs font-bold text-purple-700">
                      {aiResult.key}
                    </span>
                    <span className="text-xs font-bold text-purple-700">
                      Estimate: {aiResult.estimate}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {aiResult.title}
                  </h4>
                  <div className="space-y-1.5">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      Acceptance Criteria:
                    </div>
                    <ul className="space-y-1">
                      {aiResult.criteria.map((item, idx) => (
                        <li
                          key={idx}
                          className="flex items-center gap-2 text-xs text-slate-700"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-purple-600" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "employee" && (
            <div id="employee" className="animate-fade-in space-y-6">
              <div>
                <h3 className="text-xl font-black text-slate-900">
                  Due Today Focus Mode
                </h3>
                <p className="text-xs text-slate-500">
                  Distraction-free morning checklist tailored for knowledge
                  workers and mobile devices.
                </p>
              </div>

              <div className="max-w-xl space-y-3">
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="h-4 w-4 rounded text-emerald-600"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-400 text-slate-900 line-through">
                        Review Razorpay UPI Webhook PR #412
                      </div>
                      <div className="text-[10px] text-slate-400">
                        45m • Code Review
                      </div>
                    </div>
                  </div>
                  <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                    Done
                  </span>
                </div>

                <div className="shadow-xs flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded text-emerald-600"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        Optimize Redis rate limiter for Diwali spike
                      </div>
                      <div className="text-[10px] text-slate-500">
                        1h 15m • Performance
                      </div>
                    </div>
                  </div>
                  <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                    Due 4 PM
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "broadcast" && (
            <div id="alerts" className="animate-fade-in space-y-6">
              <div>
                <h3 className="text-xl font-black text-slate-900">
                  Automated Async Alerts &amp; Slack Webhooks
                </h3>
                <p className="text-xs text-slate-500">
                  Zero manual status meetings: real-time Slack release cards and
                  weekly email digests.
                </p>
              </div>

              <div className="max-w-xl space-y-3 rounded-2xl bg-slate-900 p-5 font-mono text-xs text-white">
                <div className="flex items-center gap-2 text-indigo-400">
                  <Bell className="h-4 w-4" />
                  <span>[SLACK BOT] #sprint-updates</span>
                </div>
                <div className="space-y-2 rounded-xl border border-slate-700 bg-slate-800 p-3.5">
                  <div className="font-bold text-emerald-400">
                    🚀 Deliverable Completed: TSQ-105
                  </div>
                  <div className="text-slate-300">
                    Monthly GST &amp; TDS Invoicing Audit verified by Vikram
                    Malhotra.
                  </div>
                  <div className="text-[10px] text-slate-500">
                    No remaining blockers in Sprint Q3.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Banner */}
        <div className="mt-12 space-y-6 rounded-3xl bg-indigo-600 p-8 text-center text-white sm:p-12">
          <h3 className="text-2xl font-black sm:text-3xl">
            Experience the Power of TASQ-ONE Live
          </h3>
          <p className="mx-auto max-w-xl text-sm text-indigo-100">
            Get started with our ₹0 Free Starter Pilot in 60 seconds.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/signup"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-xs font-bold text-indigo-700 shadow-lg transition-all hover:bg-indigo-50 sm:w-auto"
            >
              <span>Register Company</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/pricing"
              className="w-full rounded-2xl border border-indigo-500 bg-indigo-700 px-6 py-3.5 text-xs font-bold text-white transition-all hover:bg-indigo-800 sm:w-auto"
            >
              <span>View Free Pricing</span>
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
