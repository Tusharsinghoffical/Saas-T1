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
  const [activeTab, setActiveTab] = useState<"kanban" | "ai" | "employee" | "broadcast">("kanban");
  const [aiPrompt, setAiPrompt] = useState("Launch UPI Auto-Pay integration for recurring B2B subscriptions");
  const [aiGenerating, setAiGenerating] = useState(false);

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
    <div className="min-h-screen bg-white bg-[radial-gradient(#d1d5db_1px,transparent_1px)] [background-size:24px_24px] text-slate-900 selection:bg-indigo-500/20 selection:text-indigo-900 font-sans antialiased">
      <MarketingNav />

      {/* Hero */}
      <section className="py-16 sm:py-24 text-center max-w-5xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-mono font-bold text-indigo-700 uppercase tracking-wide">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Core Platform Features</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight leading-tight">
          Everything Your Team Needs to Execute Without Meeting Fatigue
        </h1>
        <p className="text-base sm:text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
          Explore the interactive features of TASQ-ONE: from real-time Kanban sprint tracking and sub-second Groq AI ticket decomposition to morning focus checklists.
        </p>

        {/* Feature Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto pt-4">
          <button
            type="button"
            onClick={() => setActiveTab("kanban")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "kanban"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-indigo-400" />
            <span>Sprint Kanban Board</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("ai")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "ai"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <Bot className="w-4 h-4 text-purple-400" />
            <span>AI Task Decomposer</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("employee")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "employee"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <CheckSquare className="w-4 h-4 text-emerald-400" />
            <span>Due Today Focus Mode</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("broadcast")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "broadcast"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <Bell className="w-4 h-4 text-blue-400" />
            <span>Slack &amp; Email Alerts</span>
          </button>
        </div>
      </section>

      {/* Interactive Feature Sandbox */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        <div className="p-6 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-2xl space-y-8">
          {activeTab === "kanban" && (
            <div id="kanban" className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-slate-900">Sprint Delivery Board</h3>
                  <p className="text-xs text-slate-500">Live multi-column drag-and-drop board with DAG dependency blocking.</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold">
                  Interactive Simulator
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                    <span>To Do</span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-200 text-[10px]">1</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
                    <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">TSQ-101</span>
                    <div className="text-xs font-bold text-slate-900">Prepare Enterprise Client Proposal &amp; SLA</div>
                    <div className="text-[11px] text-slate-500">Assignee: Aarav Sharma</div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                    <span>In Progress</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px]">2</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
                    <span className="text-[10px] font-mono font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">TSQ-103</span>
                    <div className="text-xs font-bold text-slate-900">Mobile App Redesign &amp; UPI Flow</div>
                    <div className="text-[11px] text-slate-500">Assignee: Ananya Roy</div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                    <span>Completed</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px]">1</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white border border-emerald-200 shadow-xs space-y-2">
                    <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">TSQ-105</span>
                    <div className="text-xs font-bold text-slate-900">Monthly GST &amp; TDS Invoicing Audit</div>
                    <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Verified Done</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "ai" && (
            <div id="ai" className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-xl font-black text-slate-900">Groq Llama 3.3 70B AI Task Decomposer</h3>
                <p className="text-xs text-slate-500">Transform a single prompt into structured Definition of Done items in &lt;1 second.</p>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter a task description..."
                  />
                  <button
                    type="button"
                    onClick={() => handleSimulateAi(aiPrompt)}
                    disabled={aiGenerating}
                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    <Bot className="w-4 h-4" />
                    <span>{aiGenerating ? "Decomposing..." : "Enhance with AI"}</span>
                  </button>
                </div>

                {/* AI Result Card */}
                <div className="p-5 rounded-2xl bg-purple-50/50 border border-purple-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">{aiResult.key}</span>
                    <span className="text-xs font-bold text-purple-700">Estimate: {aiResult.estimate}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{aiResult.title}</h4>
                  <div className="space-y-1.5">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-600">Acceptance Criteria:</div>
                    <ul className="space-y-1">
                      {aiResult.criteria.map((item, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-xs text-slate-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
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
            <div id="employee" className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-xl font-black text-slate-900">Due Today Focus Mode</h3>
                <p className="text-xs text-slate-500">Distraction-free morning checklist tailored for knowledge workers and mobile devices.</p>
              </div>

              <div className="space-y-3 max-w-xl">
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-emerald-600" />
                    <div>
                      <div className="text-xs font-bold text-slate-900 line-through text-slate-400">Review Razorpay UPI Webhook PR #412</div>
                      <div className="text-[10px] text-slate-400">45m • Code Review</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px] font-bold">Done</span>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-white flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" className="w-4 h-4 rounded text-emerald-600" />
                    <div>
                      <div className="text-xs font-bold text-slate-900">Optimize Redis rate limiter for Diwali spike</div>
                      <div className="text-[10px] text-slate-500">1h 15m • Performance</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-700 text-[10px] font-bold">Due 4 PM</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "broadcast" && (
            <div id="alerts" className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-xl font-black text-slate-900">Automated Async Alerts &amp; Slack Webhooks</h3>
                <p className="text-xs text-slate-500">Zero manual status meetings: real-time Slack release cards and weekly email digests.</p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 text-white font-mono text-xs space-y-3 max-w-xl">
                <div className="flex items-center gap-2 text-indigo-400">
                  <Bell className="w-4 h-4" />
                  <span>[SLACK BOT] #sprint-updates</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-800 border border-slate-700 space-y-2">
                  <div className="font-bold text-emerald-400">🚀 Deliverable Completed: TSQ-105</div>
                  <div className="text-slate-300">Monthly GST &amp; TDS Invoicing Audit verified by Vikram Malhotra.</div>
                  <div className="text-[10px] text-slate-500">No remaining blockers in Sprint Q3.</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Banner */}
        <div className="mt-12 p-8 sm:p-12 rounded-3xl bg-indigo-600 text-white text-center space-y-6">
          <h3 className="text-2xl sm:text-3xl font-black">Experience the Power of TASQ-ONE Live</h3>
          <p className="text-sm text-indigo-100 max-w-xl mx-auto">
            Get started with our ₹0 Free Starter Pilot in 60 seconds.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white text-indigo-700 hover:bg-indigo-50 font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <span>Register Company</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/pricing"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs border border-indigo-500 transition-all"
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
