"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Sparkles,
  ArrowRight,
  LayoutDashboard,
  Users,
  Clock,
  CheckCircle2,
  Bell,
  CheckSquare,
  ChevronDown,
  TrendingUp,
  Target,
  Briefcase,
  Layers,
  MessageSquare,
  Smartphone,
  Shield,
  Zap,
  Check,
  XCircle,
  HelpCircle,
  Play,
  Calendar,
  Lock,
  FileText,
  Building,
  Bot,
  Flame,
  ChevronRight,
  CreditCard,
  CheckCheck,
  Terminal,
  Activity,
  GitBranch,
  Filter,
  Search,
  Plus,
  RefreshCw,
  Sliders,
  Send,
  AlertTriangle,
  FileCheck,
  Cpu,
  Database,
  Eye,
  Key,
  FolderGit2,
  SlidersHorizontal,
  Command,
  Hash,
  Calculator,
  Workflow,
  BarChart3,
  Gauge,
  Inbox,
  Radio,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

interface DemoTask {
  id: string;
  title: string;
  column: "todo" | "in_progress" | "review" | "completed";
  priority: "urgent" | "high" | "medium" | "low" | "verified";
  desc: string;
  tag: string;
  assignee: string;
  due: string;
  blocker: string | null;
}

interface ChecklistItem {
  id: string;
  title: string;
  duration: string;
  done: boolean;
  tag: string;
}

interface AiResult {
  key: string;
  title: string;
  priority: string;
  department: string;
  assignee: string;
  criteria: string[];
  estimate: string;
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<"kanban" | "ai" | "employee" | "broadcast">("kanban");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Role Showcase State
  const [selectedRole, setSelectedRole] = useState<"founders" | "engineering" | "operations">("founders");

  // ROI Calculator State
  const [teamSize, setTeamSize] = useState<number>(8);
  const [hoursWastedPerPerson, setHoursWastedPerPerson] = useState<number>(4);

  const aiTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (aiTimeoutRef.current) {
        clearTimeout(aiTimeoutRef.current);
      }
    };
  }, []);

  const scrollToSection = (id: string) => {
    if (typeof window !== "undefined") {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  // Interactive Live Demo Tasks State with realistic Indian names and business deliverables
  const [demoTasks, setDemoTasks] = useState<DemoTask[]>([
    {
      id: "TSQ-101",
      title: "Prepare Enterprise Client Proposal & SLA",
      column: "todo",
      priority: "medium",
      desc: "Draft Q3 deliverables timeline and SLA terms for leadership review.",
      tag: "Sales",
      assignee: "Aarav Sharma",
      due: "Pending",
      blocker: null,
    },
    {
      id: "TSQ-102",
      title: "Diwali Product Launch & Ad Campaign",
      column: "todo",
      priority: "low",
      desc: "Schedule Meta graphics and publish pan-India product announcement.",
      tag: "Marketing",
      assignee: "Priya Patel",
      due: "Pending",
      blocker: null,
    },
    {
      id: "TSQ-103",
      title: "Mobile App Redesign & Razorpay UPI Flow",
      column: "in_progress",
      priority: "urgent",
      desc: "Finalize responsive navigation and test one-click UPI checkout.",
      tag: "Design",
      assignee: "Ananya Roy",
      due: "Due Today at 5 PM",
      blocker: null,
    },
    {
      id: "TSQ-104",
      title: "PostgreSQL Index Optimization & Latency Fix",
      column: "in_progress",
      priority: "high",
      desc: "Add composite btree indexes to task_assignees and activity logs.",
      tag: "Engineering",
      assignee: "Rohan Verma",
      due: "Due Tomorrow",
      blocker: null,
    },
    {
      id: "TSQ-105",
      title: "Monthly GST & TDS Invoicing Audit",
      column: "completed",
      priority: "verified",
      desc: "Reconcile vendor invoices and verify GST 2B input tax credits.",
      tag: "Finance",
      assignee: "Vikram Malhotra",
      due: "Verified",
      blocker: null,
    },
  ]);

  // Interactive Employee Focus Checklist State (Indian SMB Workflow)
  const [employeeChecklist, setEmployeeChecklist] = useState<ChecklistItem[]>([
    { id: "e1", title: "Review Razorpay UPI Webhook PR #412", duration: "45m", done: true, tag: "Code Review" },
    { id: "e2", title: "Optimize Redis rate limiter for Diwali traffic spike", duration: "1h 15m", done: false, tag: "Performance" },
    { id: "e3", title: "Deploy GST & TDS invoice schema to staging", duration: "30m", done: false, tag: "DevOps" },
  ]);

  // AI Task Decomposition Simulator State
  const [aiPrompt, setAiPrompt] = useState("Launch UPI Auto-Pay integration for recurring B2B subscriptions");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiResult, setAiResult] = useState<AiResult>({
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
    if (aiTimeoutRef.current) {
      clearTimeout(aiTimeoutRef.current);
    }
    aiTimeoutRef.current = setTimeout(() => {
      if (prompt.toLowerCase().includes("proposal") || prompt.toLowerCase().includes("sla") || prompt.toLowerCase().includes("sales")) {
        setAiResult({
          key: "TSQ-132",
          title: "Prepare Enterprise Tier SLA & Security Addendum",
          priority: "high",
          department: "Sales & Legal (Mumbai)",
          assignee: "Aarav Sharma (Account Executive)",
          criteria: [
            "Draft Q3 deliverables timeline with milestone sign-off dates",
            "Detail 24/7 incident response SLA and custom support escalation matrix",
            "Calculate tier pricing breakdown in ₹ INR with annual volume discount",
            "Obtain legal review on multi-tenant data processing addendum for India",
          ],
          estimate: "4 Hours (1 Day)",
        });
      } else if (prompt.toLowerCase().includes("database") || prompt.toLowerCase().includes("index") || prompt.toLowerCase().includes("sql")) {
        setAiResult({
          key: "TSQ-135",
          title: "PostgreSQL Query Optimization & B-Tree Indexing",
          priority: "urgent",
          department: "Engineering (Pune)",
          assignee: "Rohan Verma (Backend Engineer)",
          criteria: [
            "Analyze slow query logs on task_assignees and activity tables",
            "Create composite btree indexes for tenant_id + status filters",
            "Verify query execution time drops below 15ms under 5k concurrent load",
            "Deploy non-blocking index creation concurrently on production database",
          ],
          estimate: "3 Hours (1 Day)",
        });
      } else {
        setAiResult({
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
      }
      setAiGenerating(false);
    }, 450);
  };

  const moveTask = (taskId: string, targetCol: "todo" | "in_progress" | "completed") => {
    setDemoTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, column: targetCol } : t))
    );
  };

  const toggleChecklist = (id: string) => {
    setEmployeeChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
  };

  // Monthly Hours & Rupees Calculation for ROI section (Average ₹1,200/hr in Indian tech & SMB ecosystem)
  const totalHoursSavedMonthly = teamSize * hoursWastedPerPerson * 4.2;
  const totalRupeesSavedMonthly = Math.round(totalHoursSavedMonthly * 1200);

  const faqs = [
    {
      q: "How does TASQ-ONE completely eliminate status check-in meetings?",
      a: "Instead of asking 'What are you working on?' across WhatsApp group chats or daily standup calls, TASQ-ONE provides a live, verified execution matrix. When team members mark tasks done or move them through columns, automated updates dispatch to your Slack channel and a weekly summary is compiled for management. Leaders get 100% visibility in 5 seconds without disturbing developers.",
    },
    {
      q: "What makes the Groq Llama 3.3 AI engine different from typical AI summaries?",
      a: "TASQ-ONE does not produce generic fluff. You give it a 5-word sentence (e.g. 'Deploy Redis cluster with failover'), and it produces concrete technical Acceptance Criteria, Definition of Done items, dependency checks, and routes the task to the engineer with the lowest open backlog in under 1 second.",
    },
    {
      q: "How does TASQ-ONE enforce Task Dependency Blocking (DAG)?",
      a: "If Task B depends on Task A, TASQ-ONE visually links them and prevents Task B from being marked 'In Progress' or 'Completed' until Task A is verified Done. This eliminates broken builds, premature merges, and communication bottlenecks.",
    },
    {
      q: "Is the ₹0 Free Pilot really free forever with no credit card required?",
      a: "Yes. Our starter tier is 100% free with core sprint management, employee morning focus views, AI task decomposition, and multi-tenant RLS isolation for up to 10 members. No credit card or UPI mandate is required to sign up or invite colleagues.",
    },
    {
      q: "Can we install TASQ-ONE as a mobile app on iOS and Android?",
      a: "Yes. TASQ-ONE is built as an ultra-fast installable Progressive Web App (PWA) with responsive touch optimization, offline caching, and a dedicated 'Due Today' morning mode tailored for mobile screens.",
    },
    {
      q: "How is our company data protected and isolated from other tenants?",
      a: "Every workspace is isolated at the database engine level via PostgreSQL Row-Level Security (RLS) policies and cryptographically verified JWT tokens. No tenant can ever view or query another company's records.",
    },
  ];

  return (
    <div className="min-h-screen bg-white bg-[radial-gradient(#d1d5db_1px,transparent_1px)] [background-size:24px_24px] text-slate-900 selection:bg-indigo-500/20 selection:text-indigo-900 font-sans antialiased">
      {/* ======================================================================== */}
      {/* 1. EXECUTIVE HEADER — REUSABLE MARKETING NAVIGATION                      */}
      {/* ======================================================================== */}
      <MarketingNav />

      {/* ======================================================================== */}
      {/* 2. HERO SECTION — EXACT COLORING & TEXTURE MATCHING SCREENSHOT           */}
      {/* ======================================================================== */}
      <section className="relative pt-12 pb-16 sm:pt-20 sm:pb-24 overflow-hidden">
        {/* Soft Radial Ambient Lighting */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-gradient-radial from-indigo-100/40 via-purple-50/20 to-transparent blur-3xl" />
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-7 relative z-10">
          {/* Pill Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50/90 border border-indigo-200/80 text-xs font-semibold text-indigo-600 shadow-2xs">
            <span className="h-2 w-2 rounded-full bg-indigo-600" />
            <span>AI Task OS • The Smarter Way for Growing Teams</span>
          </div>

          {/* Core Problem-Solving Headline with Exact Screenshot Colors */}
          <div className="space-y-1 sm:space-y-2">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-[#0B0F19] max-w-5xl mx-auto leading-[1.08]">
              Stop Managing Tasks in
            </h1>
            <div className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.08]">
              <span className="text-[#F43F5E]">WhatsApp &amp; Messy </span>
              <span className="bg-gradient-to-r from-[#EA580C] via-[#D97706] to-[#F59E0B] bg-clip-text text-transparent">
                Spreadsheets
              </span>
            </div>
          </div>

          {/* Sub-headline */}
          <p className="text-slate-600 text-sm sm:text-base lg:text-lg max-w-2xl mx-auto leading-relaxed font-normal pt-1">
            Assign tasks clearly, track real-time progress, and eliminate endless follow-up meetings. Built for founders, managers, and teams who want complete clarity without software complexity.
          </p>

          {/* 3-Button Cluster Exactly Matching Screenshot */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 pt-3">
            {/* 1. Primary Royal Blue CTA */}
            <Link
              href="/signup"
              className="px-7 py-3.5 rounded-2xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-extrabold text-sm sm:text-base shadow-lg shadow-indigo-300/50 transition-all flex items-center justify-center gap-2 group cursor-pointer"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>

            {/* 2. Explore Live Workspace Demo */}
            <button
              type="button"
              onClick={() => {
                setActiveTab("kanban");
                scrollToSection("workspace-experience");
              }}
              className="px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-900 font-bold text-sm sm:text-base border border-slate-200/90 shadow-sm transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <Play className="w-4 h-4 text-indigo-600 stroke-[2.5]" />
              <span>Explore Live Workspace Demo</span>
            </button>

            {/* 3. Employee Daily View (Mint Green Pill) */}
            <button
              type="button"
              onClick={() => {
                setActiveTab("employee");
                scrollToSection("workspace-experience");
              }}
              className="px-6 py-3.5 rounded-2xl bg-[#ecfdf5] hover:bg-[#d1fae5] text-[#065f46] font-bold text-sm sm:text-base border border-[#a7f3d0] shadow-2xs transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <CheckSquare className="w-4 h-4 text-[#059669] stroke-[2.5]" />
              <span>Employee Daily View</span>
            </button>
          </div>

          {/* 3 Key Value Highlights */}

        </div>
      </section>

      {/* ======================================================================== */}
      {/* 3. TASQ-ONE WORKSPACE EXPERIENCE — SPRINT DELIVERY BOARD                 */}
      {/* ======================================================================== */}
      <section id="workspace-experience" className="py-14 sm:py-20 bg-slate-50/70 border-y border-slate-200 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Section Heading */}
          <div className="text-center space-y-2.5 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-mono font-bold text-indigo-700 uppercase tracking-wide">
              TASQ-ONE Workspace Experience
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Sprint Delivery Board
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Real-time status across all active team deliverables. Drag tasks, get AI workload recommendations, and view immediate execution progress.
            </p>
          </div>

          {/* Simulator Container */}
          <div className="rounded-3xl bg-white border border-slate-200 shadow-xl overflow-hidden">
            {/* Top Workspace Header Bar */}
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-xs">
                  <CheckCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <span>All Tasks On Track</span>
                    <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Live Synced
                    </span>
                  </div>
                </div>
              </div>

              {/* View Switcher Tabs */}
              <div className="flex items-center p-1 rounded-2xl bg-slate-200/80 border border-slate-300/80 gap-1 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveTab("kanban")}
                  className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${activeTab === "kanban"
                    ? "bg-white text-indigo-700 shadow-xs border border-slate-200 font-extrabold"
                    : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Sprint Board</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("ai")}
                  className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${activeTab === "ai"
                    ? "bg-white text-indigo-700 shadow-xs border border-slate-200 font-extrabold"
                    : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>AI Decomposer</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("employee")}
                  className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${activeTab === "employee"
                    ? "bg-white text-indigo-700 shadow-xs border border-slate-200 font-extrabold"
                    : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Due Today Focus</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("broadcast")}
                  className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${activeTab === "broadcast"
                    ? "bg-white text-indigo-700 shadow-xs border border-slate-200 font-extrabold"
                    : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>Automated Alerts</span>
                </button>
              </div>
            </div>

            {/* TAB 1: SPRINT KANBAN MATRIX */}
            {activeTab === "kanban" && (
              <div className="p-5 sm:p-7 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Column: To Do (2) - Pending */}
                  <div className="rounded-2xl bg-slate-50/80 border border-slate-200 p-4 space-y-3.5">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
                        <span className="font-extrabold text-xs text-slate-800">
                          To Do ({demoTasks.filter((t) => t.column === "todo").length})
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono font-bold bg-slate-200/80 px-2 py-0.5 rounded">
                        Pending
                      </span>
                    </div>

                    <div className="space-y-3">
                      {demoTasks
                        .filter((t) => t.column === "todo")
                        .map((task) => (
                          <div
                            key={task.id}
                            className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-indigo-400 hover:shadow-md transition-all space-y-2.5"
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                                {task.tag}
                              </span>
                              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">
                                {task.priority}
                              </span>
                            </div>
                            <div className="font-bold text-xs text-slate-900 leading-snug">{task.title}</div>
                            <p className="text-[11px] text-slate-500 leading-relaxed">{task.desc}</p>
                            <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-700 font-black text-[10px] flex items-center justify-center border border-indigo-200">
                                  {task.assignee.charAt(0)}
                                </div>
                                <span className="text-slate-700 font-semibold text-[11px]">{task.assignee}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => moveTask(task.id, "in_progress")}
                                className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[10px] transition-colors cursor-pointer"
                              >
                                Start →
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Column: In Progress (2) - Active */}
                  <div className="rounded-2xl bg-slate-50/80 border-2 border-indigo-200 p-4 space-y-3.5">
                    <div className="flex items-center justify-between pb-1 border-b border-indigo-100">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
                        <span className="font-extrabold text-xs text-slate-800">
                          In Progress ({demoTasks.filter((t) => t.column === "in_progress").length})
                        </span>
                      </div>
                      <span className="text-[10px] text-amber-800 font-mono font-bold bg-amber-100 px-2 py-0.5 rounded">
                        Active
                      </span>
                    </div>

                    <div className="space-y-3">
                      {demoTasks
                        .filter((t) => t.column === "in_progress")
                        .map((task) => (
                          <div
                            key={task.id}
                            className="p-3.5 rounded-xl bg-white border-2 border-indigo-400 shadow-md transition-all space-y-2.5"
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-bold">
                                {task.tag}
                              </span>
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase ${task.priority === "urgent"
                                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                                  : "bg-amber-50 text-amber-700 border border-amber-200"
                                  }`}
                              >
                                {task.priority}
                              </span>
                            </div>
                            <div className="font-bold text-xs text-slate-900 leading-snug">{task.title}</div>
                            <p className="text-[11px] text-slate-500 leading-relaxed">{task.desc}</p>
                            <div className="flex items-center gap-1.5 text-[10px] font-mono font-semibold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              <span>{task.due}</span>
                            </div>
                            <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-full bg-amber-100 text-amber-800 font-black text-[10px] flex items-center justify-center border border-amber-200">
                                  {task.assignee.charAt(0)}
                                </div>
                                <span className="text-slate-700 font-semibold text-[11px]">{task.assignee}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => moveTask(task.id, "completed")}
                                className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] shadow-xs transition-colors cursor-pointer"
                              >
                                Mark Done ✓
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Column: Completed (1) - Done */}
                  <div className="rounded-2xl bg-slate-50/80 border border-slate-200 p-4 space-y-3.5">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                        <span className="font-extrabold text-xs text-slate-800">
                          Completed ({demoTasks.filter((t) => t.column === "completed").length})
                        </span>
                      </div>
                      <span className="text-[10px] text-emerald-800 font-mono font-bold bg-emerald-100 px-2 py-0.5 rounded">
                        Done
                      </span>
                    </div>

                    <div className="space-y-3">
                      {demoTasks
                        .filter((t) => t.column === "completed")
                        .map((task) => (
                          <div
                            key={task.id}
                            className="p-3.5 rounded-xl bg-white border border-emerald-200 shadow-xs transition-all space-y-2.5 opacity-95"
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                                {task.tag}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                                Verified
                              </span>
                            </div>
                            <div className="font-bold text-xs text-slate-500 line-through leading-snug">{task.title}</div>
                            <p className="text-[11px] text-slate-400 leading-relaxed">{task.desc}</p>
                            <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px] flex items-center justify-center border border-emerald-200">
                                  {task.assignee.charAt(0)}
                                </div>
                                <span className="text-slate-400 text-[11px]">{task.assignee}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => moveTask(task.id, "todo")}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] transition-colors cursor-pointer"
                              >
                                Reopen ↺
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: AI TASK DECOMPOSER */}
            {activeTab === "ai" && (
              <div className="p-5 sm:p-7 space-y-5">
                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span>Enter any natural language task spec to structure via Groq Llama 3.3 70B:</span>
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <input
                      type="text"
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="e.g. Prepare Client Proposal or Database Index Optimization..."
                      className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-indigo-600 shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleSimulateAi(aiPrompt)}
                      disabled={aiGenerating}
                      className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-indigo-200 transition-all shrink-0 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {aiGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      <span>Structure Ticket</span>
                    </button>
                  </div>

                  {/* Presets */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-[11px] text-slate-500 font-mono font-semibold">Try sample specs:</span>
                    <button
                      type="button"
                      onClick={() => handleSimulateAi("Prepare Enterprise Tier SLA & Security Addendum")}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium transition-colors cursor-pointer border border-slate-200"
                    >
                      Client Proposal
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSimulateAi("PostgreSQL Query Optimization & B-Tree Indexing")}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium transition-colors cursor-pointer border border-slate-200"
                    >
                      Database Indexing
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSimulateAi("Implement Apple Pay & optimize mobile checkout latency")}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium transition-colors cursor-pointer border border-slate-200"
                    >
                      Mobile Redesign
                    </button>
                  </div>
                </div>

                {/* AI Result Card */}
                <div className="p-5 rounded-2xl bg-slate-50 border-2 border-indigo-200/80 space-y-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-mono font-black text-indigo-700 px-2 py-0.5 bg-indigo-50 rounded-md border border-indigo-200">
                        {aiResult.key}
                      </span>
                      <span className="text-sm font-extrabold text-slate-900">{aiResult.title}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 font-extrabold uppercase">
                        {aiResult.priority}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-white text-slate-700 border border-slate-200 font-bold">
                        Estimate: {aiResult.estimate}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600">
                    Recommended Assignee: <strong className="text-slate-900 font-bold">{aiResult.assignee}</strong> ({aiResult.department})
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-mono font-bold text-slate-800 uppercase tracking-wider">
                      Acceptance Criteria (Definition of Done):
                    </div>
                    <ul className="space-y-1.5 text-xs text-slate-700">
                      {aiResult.criteria.map((c, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: DUE TODAY FOCUS VIEW */}
            {activeTab === "employee" && (
              <div className="p-5 sm:p-7 space-y-5 max-w-2xl mx-auto">
                <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50 via-slate-50 to-white border border-indigo-100 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-extrabold text-indigo-700 uppercase tracking-wider">Morning Protocol</span>
                    <span className="text-xs font-mono font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {employeeChecklist.filter((i) => i.done).length} of {employeeChecklist.length} Complete
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900">Good Morning, Sarah Jenkins</h3>
                  <p className="text-xs text-slate-600">
                    Here are your active deliverables for today. Zero meeting distractions.
                  </p>
                </div>

                <div className="space-y-3">
                  {employeeChecklist.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => toggleChecklist(item.id)}
                      className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${item.done
                        ? "bg-slate-50 border-slate-200 opacity-80"
                        : "bg-white border-slate-200 hover:border-indigo-400 shadow-sm"
                        }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`h-5 w-5 rounded-lg flex items-center justify-center border transition-colors ${item.done
                            ? "bg-emerald-600 border-emerald-600 text-white"
                            : "border-slate-300 bg-white"
                            }`}
                        >
                          {item.done && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <div className={`text-xs sm:text-sm font-bold ${item.done ? "line-through text-slate-400" : "text-slate-900"}`}>
                            {item.title}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">{item.tag}</div>
                        </div>
                      </div>

                      <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                        {item.duration}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: AUTOMATED ALERTS */}
            {activeTab === "broadcast" && (
              <div className="p-5 sm:p-7 space-y-6 max-w-3xl mx-auto">
                <div className="space-y-1 text-center">
                  <h3 className="text-base font-extrabold text-slate-900">Proactive Multi-Channel Notifications</h3>
                  <p className="text-xs text-slate-600">
                    Dispatched automatically to Slack and email before deadlines are ever missed.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Slack Dispatch Preview */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                        <Hash className="w-4 h-4 text-indigo-600" />
                        <span>#engineering-sprint</span>
                      </span>
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-mono font-bold border border-emerald-200">● Live Channel</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border-l-4 border-indigo-600 text-xs space-y-1.5">
                      <div className="font-bold text-slate-900">🚨 Urgent Deliverable Due in 2 Hours</div>
                      <p className="text-[11px] text-slate-600 leading-snug">
                        <strong>TSQ-103</strong>: Website Redesign Delivery
                      </p>
                      <div className="text-[10px] text-slate-500">Owner: Sarah Jenkins • Status: In Progress</div>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">Dispatched to Slack Incoming Webhook</div>
                  </div>

                  {/* Resend Email Digest Preview */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                        <Send className="w-4 h-4 text-purple-600" />
                        <span>Executive Email Digest</span>
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">Weekly Mon 9 AM</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                      <div className="font-bold text-slate-900">Sprint Velocity: 95% On-Time Delivery</div>
                      <p className="text-[11px] text-slate-600 leading-snug">
                        28 Deliverables Done • 0 Blockers • Mean Turnaround 3.8 Days
                      </p>
                      <div className="text-[10px] text-indigo-700 font-bold">Auto-compiled via Groq AI + Resend</div>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">Sent to founders & team leaders</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ======================================================================== */}
      {/* 4. WHY TEAMS SWITCH TO TASQ-ONE (BEFORE VS AFTER)                        */}
      {/* ======================================================================== */}
      <section id="why-switch" className="py-14 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2.5 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-mono font-bold text-indigo-700 uppercase tracking-wide">
              Why Teams Switch to TASQ-ONE
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Stop Losing Hours in Chaotic Group Chats
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              When work is scattered across messages, emails, and notes, deadlines get missed. TASQ-ONE creates one clear source of truth.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* The Everyday Chaos Without TASQ-ONE */}
            <div className="rounded-3xl bg-rose-50/50 border border-rose-200 p-7 sm:p-9 space-y-5 shadow-xs">
              <div>
                <div className="text-xs font-mono font-bold text-rose-700 uppercase tracking-wider">The Everyday Chaos</div>
                <div className="text-lg font-extrabold text-slate-900 mt-1">Without TASQ-ONE</div>
              </div>
              <ul className="space-y-3.5 text-xs sm:text-sm text-slate-700">
                <li className="flex items-start gap-3">
                  <span className="text-rose-600 font-black text-base shrink-0 mt-[-2px]">✕</span>
                  <span>Tasks get buried in noisy WhatsApp groups and lost email threads.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-rose-600 font-black text-base shrink-0 mt-[-2px]">✕</span>
                  <span>Daily 45-minute status meetings where nobody has clear answers.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-rose-600 font-black text-base shrink-0 mt-[-2px]">✕</span>
                  <span>Managers have to constantly chase employees with &quot;What are you working on?&quot;</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-rose-600 font-black text-base shrink-0 mt-[-2px]">✕</span>
                  <span>Overloaded teammates miss client deadlines because work was unbalanced.</span>
                </li>
              </ul>
            </div>

            {/* The Clear Workflow With TASQ-ONE */}
            <div className="rounded-3xl bg-emerald-50/50 border border-emerald-200 p-7 sm:p-9 space-y-5 shadow-xs">
              <div>
                <div className="text-xs font-mono font-bold text-emerald-700 uppercase tracking-wider">The Clear Workflow</div>
                <div className="text-lg font-extrabold text-slate-900 mt-1">With TASQ-ONE</div>
              </div>
              <ul className="space-y-3.5 text-xs sm:text-sm text-slate-700">
                <li className="flex items-start gap-3">
                  <span className="text-emerald-600 font-black text-base shrink-0 mt-[-2px]">✓</span>
                  <span>One centralized board where every task has a clear owner and deadline.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-emerald-600 font-black text-base shrink-0 mt-[-2px]">✓</span>
                  <span>Zero status meetings: check the live board anytime in 5 seconds.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-emerald-600 font-black text-base shrink-0 mt-[-2px]">✓</span>
                  <span>AI Assistant writes clear instructions so employees know exactly what to do.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-emerald-600 font-black text-base shrink-0 mt-[-2px]">✓</span>
                  <span>Automated Slack & Email reminders ensure nothing ever slips through the cracks.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================================== */}
      {/* 5. MEASURABLE BUSINESS IMPACT                                           */}
      {/* ======================================================================== */}
      <section id="business-impact" className="py-14 sm:py-20 bg-slate-50/70 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2.5 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-mono font-bold text-indigo-700 uppercase tracking-wide">
              Measurable Business Impact
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              How TASQ-ONE Saves Time and Accelerates Growth
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Transform chaotic project coordination into a smooth, self-driving execution engine.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Impact 1 */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all space-y-2.5">
              <div className="text-3xl sm:text-4xl font-black text-indigo-600">10+ Hrs</div>
              <div className="font-extrabold text-xs sm:text-sm text-slate-900">Saved per Manager / Week</div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Eliminate manual follow-up messages, status check calls, and repetitive task drafting.
              </p>
            </div>

            {/* Impact 2 */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all space-y-2.5">
              <div className="text-3xl sm:text-4xl font-black text-emerald-600">95%</div>
              <div className="font-extrabold text-xs sm:text-sm text-slate-900">On-Time Task Delivery</div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Automated reminders ensure tasks are finished before due dates, not days after.
              </p>
            </div>

            {/* Impact 3 */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-purple-300 transition-all space-y-2.5">
              <div className="text-3xl sm:text-4xl font-black text-purple-600">3x Faster</div>
              <div className="font-extrabold text-xs sm:text-sm text-slate-900">Task Delegation Speed</div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Let the AI Assistant turn vague ideas into detailed requirements in seconds.
              </p>
            </div>

            {/* Impact 4 */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all space-y-2.5">
              <div className="text-3xl sm:text-4xl font-black text-blue-600">100% Free</div>
              <div className="font-extrabold text-xs sm:text-sm text-slate-900">Zero Surprise Bills</div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Full-featured pilot mode gives your team enterprise capabilities without costly subscriptions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================================== */}
      {/* 6. TAILORED SOLUTIONS                                                    */}
      {/* ======================================================================== */}
      <section id="tailored-solutions" className="py-14 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2.5 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-mono font-bold text-indigo-700 uppercase tracking-wide">
              Tailored Solutions
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Built for High-Velocity Teams & Growing Businesses
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Marketing & Agencies */}
            <div className="p-7 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-400 transition-all space-y-3.5">
              <div className="h-10 w-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <Briefcase className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-mono font-bold text-indigo-600 uppercase">Multi-Client Sprints</div>
                <h3 className="font-extrabold text-base text-slate-900">Client & Marketing Agencies</h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Juggle multiple client deliverables, share asset attachments, and ensure client deadlines are met without team burnout.
              </p>
            </div>

            {/* Card 2: Software & Product Teams */}
            <div className="p-7 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-400 transition-all space-y-3.5">
              <div className="h-10 w-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <Terminal className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-mono font-bold text-emerald-600 uppercase">Fast Sprint Cycles</div>
                <h3 className="font-extrabold text-base text-slate-900">Software & Product Teams</h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Plan weekly sprints, track feature bugs, and let the AI Assistant draft clear technical acceptance criteria for developers.
              </p>
            </div>

            {/* Card 3: Operations & SMBs */}
            <div className="p-7 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-amber-400 transition-all space-y-3.5">
              <div className="h-10 w-10 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                <Building className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-mono font-bold text-amber-600 uppercase">Centralized Operations</div>
                <h3 className="font-extrabold text-base text-slate-900">Operations & Fast-Growing SMBs</h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Manage day-to-day business checklists, billing follow-ups, hiring tasks, and inter-departmental projects in one place.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================================== */}
      {/* 7. SIMPLE 3-STEP SETUP                                                  */}
      {/* ======================================================================== */}
      <section className="py-14 sm:py-20 bg-slate-50/70 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2.5 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-mono font-bold text-indigo-700 uppercase tracking-wide">
              Simple 3-Step Setup
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Get Your Entire Team Up & Running in Under 2 Minutes
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 01 */}
            <div className="p-7 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3 relative overflow-hidden">
              <span className="text-4xl font-black text-indigo-200 font-mono">01</span>
              <h3 className="font-extrabold text-base text-slate-900">Create Your Workspace</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Sign up in 30 seconds, choose your organization name, and invite your team with simple passwordless links.
              </p>
            </div>

            {/* Step 02 */}
            <div className="p-7 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3 relative overflow-hidden">
              <span className="text-4xl font-black text-purple-200 font-mono">02</span>
              <h3 className="font-extrabold text-base text-slate-900">Assign & Enhance with AI</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Add your tasks to the board. Click &apos;Enhance with AI&apos; to automatically clarify requirements, set priorities, and assign.
              </p>
            </div>

            {/* Step 03 */}
            <div className="p-7 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3 relative overflow-hidden">
              <span className="text-4xl font-black text-emerald-200 font-mono">03</span>
              <h3 className="font-extrabold text-base text-slate-900">Track & Deliver Without Chasing</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Employees complete their daily checklist on mobile or desktop, while automated Slack & email alerts keep managers informed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================================== */}
      {/* 8. INTERACTIVE ROI / TIME SAVED CALCULATOR                               */}
      {/* ======================================================================== */}
      <section id="roi-calculator" className="py-14 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2.5 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-mono font-bold text-indigo-700 uppercase tracking-wide">
              ROI Calculator
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Calculate Your Team&apos;s Reclaimed Hours
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              See how much time and payroll value your team reclaims each month by switching to TASQ-ONE.
            </p>
          </div>

          <div className="p-6 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-lg grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Sliders */}
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-900">
                  <span>Team Size (Colleagues & Managers)</span>
                  <span className="text-indigo-600 font-mono text-sm">{teamSize} Members</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="50"
                  value={teamSize}
                  onChange={(e) => setTeamSize(parseInt(e.target.value, 10))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>2 Members</span>
                  <span>50 Members</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-900">
                  <span>Hours Wasted Weekly on Status Follow-Ups per Person</span>
                  <span className="text-indigo-600 font-mono text-sm">{hoursWastedPerPerson} Hours / Wk</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={hoursWastedPerPerson}
                  onChange={(e) => setHoursWastedPerPerson(parseInt(e.target.value, 10))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>1 Hour</span>
                  <span>10 Hours</span>
                </div>
              </div>
            </div>

            {/* Calculated Output Card */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-50 via-slate-50 to-white border-2 border-indigo-200 text-center space-y-4 shadow-sm">
              <div>
                <span className="text-xs font-mono font-bold text-indigo-700 uppercase">Monthly Reclaimed Capacity</span>
                <div className="text-4xl sm:text-5xl font-black text-slate-900 mt-1">
                  {Math.round(totalHoursSavedMonthly)} <span className="text-base sm:text-lg font-bold text-slate-500">Hours / Mo</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200">
                <span className="text-xs text-slate-600 font-medium">Estimated Monthly Value Reclaimed:</span>
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-0.5">
                  ₹{totalRupeesSavedMonthly.toLocaleString("en-IN")} <span className="text-xs text-slate-500 font-normal">/ month</span>
                </div>
              </div>

              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition-colors"
              >
                <span>Reclaim This Time for ₹0 Free</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================================== */}
      {/* 9. FREQUENTLY ASKED QUESTIONS                                           */}
      {/* ======================================================================== */}
      <section className="py-14 sm:py-20 bg-slate-50/70 border-t border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2.5">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-mono font-bold text-indigo-700 uppercase tracking-wide">
              Got Questions?
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-xs"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-4 text-left flex items-center justify-between gap-3 text-xs sm:text-sm font-bold text-slate-900 hover:text-indigo-600 transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${openFaq === idx ? "rotate-180 text-indigo-600" : ""
                      }`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-4 pb-4 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================================================================== */}
      {/* 10. BOTTOM CALL TO ACTION                                               */}
      {/* ======================================================================== */}
      <section className="py-14 sm:py-20 relative">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 border border-indigo-500/30 p-8 sm:p-14 text-center space-y-5 shadow-2xl text-white">
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
              Bring Complete Clarity to Your Team Today
            </h2>
            <p className="text-xs sm:text-sm text-indigo-200 max-w-xl mx-auto leading-relaxed">
              Experience the smarter, simpler task platform that helps growing teams execute faster with zero friction.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
              <Link
                href="/signup"
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-white hover:bg-slate-100 text-indigo-950 text-xs sm:text-sm font-extrabold shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Create Workspace (₹0 Free)</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-indigo-900/60 hover:bg-indigo-900/90 border border-indigo-400/40 text-white text-xs sm:text-sm font-bold transition-all"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================================== */}
      {/* 11. ENTERPRISE MEGA FOOTER — STANDARDIZED MARKETING FOOTER               */}
      {/* ======================================================================== */}
      <MarketingFooter />
    </div>
  );
}