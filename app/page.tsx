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
  UserPlus,
  UserCheck,
  Volume2,
  VolumeX,
  RotateCcw,
  AtSign,
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
  dependsOn?: string | null;
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

interface SimulatedNotification {
  id: string;
  type: "task.assigned" | "task.mentioned" | "task.due_soon" | "task.reassigned";
  actor: string;
  message: string;
  taskTitle: string;
  time: string;
  isUnread: boolean;
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<
    "kanban" | "ai" | "employee" | "notifications" | "broadcast"
  >("kanban");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Manual Refresh Simulation State
  const [isSimulatingRefresh, setIsSimulatingRefresh] = useState(false);
  const [refreshToast, setRefreshToast] = useState<string | null>(null);

  // DAG Dependency Warning Toast
  const [dependencyWarning, setDependencyWarning] = useState<string | null>(null);

  // Notification Sandbox State
  const [notifFilterTab, setNotifFilterTab] = useState<"all" | "unread">("all");
  const [notifSoundEnabled, setNotifSoundEnabled] = useState(true);

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

  // Interactive Live Demo Tasks State with realistic business deliverables & DAG relations
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
      dependsOn: null,
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
      dependsOn: null,
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
      dependsOn: null,
    },
    {
      id: "TSQ-104",
      title: "PostgreSQL Index Optimization & Latency Fix",
      column: "todo",
      priority: "high",
      desc: "Add composite btree indexes to task_assignees and activity logs. (Depends on TSQ-103)",
      tag: "Engineering",
      assignee: "Rohan Verma",
      due: "Prerequisite Required",
      dependsOn: "TSQ-103",
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
      dependsOn: null,
    },
  ]);

  // Interactive Employee Focus Checklist State
  const [employeeChecklist, setEmployeeChecklist] = useState<ChecklistItem[]>([
    {
      id: "e1",
      title: "Review Razorpay UPI Webhook PR #412",
      duration: "45m",
      done: true,
      tag: "Code Review",
    },
    {
      id: "e2",
      title: "Optimize Redis rate limiter for Diwali traffic spike",
      duration: "1h 15m",
      done: false,
      tag: "Performance",
    },
    {
      id: "e3",
      title: "Deploy GST & TDS invoice schema to staging",
      duration: "30m",
      done: false,
      tag: "DevOps",
    },
  ]);

  // AI Task Decomposition Simulator State
  const [aiPrompt, setAiPrompt] = useState(
    "Launch UPI Auto-Pay integration for recurring B2B subscriptions"
  );
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

  // Simulated Notifications for the v2.8 Notification Hub
  const [simulatedNotifications, setSimulatedNotifications] = useState<
    SimulatedNotification[]
  >([
    {
      id: "notif-1",
      type: "task.assigned",
      actor: "Jane Doe (Founder)",
      message: "Assigned you to critical sprint task",
      taskTitle: "Mobile App Redesign & Razorpay UPI Flow",
      time: "Just now",
      isUnread: true,
    },
    {
      id: "notif-2",
      type: "task.mentioned",
      actor: "Rohan Verma (Tech Lead)",
      message: "Mentioned you in task comments: 'Please verify index query plans'",
      taskTitle: "PostgreSQL Index Optimization & Latency Fix",
      time: "12m ago",
      isUnread: true,
    },
    {
      id: "notif-3",
      type: "task.due_soon",
      actor: "TASQ-ONE System",
      message: "Sprint deliverable due today at 5:00 PM",
      taskTitle: "Mobile App Redesign & Razorpay UPI Flow",
      time: "2h ago",
      isUnread: false,
    },
    {
      id: "notif-4",
      type: "task.reassigned",
      actor: "Alex Smith (Engineering Lead)",
      message: "Reassigned task ownership to optimize workload balance",
      taskTitle: "Prepare Enterprise Client Proposal & SLA",
      time: "1d ago",
      isUnread: false,
    },
  ]);

  const handleSimulateAi = (promptText: string) => {
    setAiGenerating(true);
    if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);

    aiTimeoutRef.current = setTimeout(() => {
      const prompt = promptText.toLowerCase();
      if (prompt.includes("proposal") || prompt.includes("sla")) {
        setAiResult({
          key: "TSQ-142",
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
      } else if (
        prompt.includes("database") ||
        prompt.includes("index") ||
        prompt.includes("sql")
      ) {
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
          title:
            "Launch UPI Auto-Pay Integration for Recurring B2B Subscriptions",
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

  // Safe manual refresh simulator
  const handleSimulateRefresh = () => {
    setIsSimulatingRefresh(true);
    setTimeout(() => {
      setIsSimulatingRefresh(false);
      setRefreshToast("Workspace synced in 14ms! Zero draft loss or form resets.");
      setTimeout(() => setRefreshToast(null), 3500);
    }, 650);
  };

  // Safe Task Reassignment Simulator
  const handleSimulateReassign = (taskId: string) => {
    const candidateRoster = [
      { name: "Aarav Sharma", dept: "Sales" },
      { name: "Priya Patel", dept: "Marketing" },
      { name: "Rohan Verma", dept: "Engineering" },
      { name: "Ananya Roy", dept: "Design" },
    ];
    setDemoTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const currentIndex = candidateRoster.findIndex(
            (c) => c.name === t.assignee
          );
          const nextMember =
            candidateRoster[(currentIndex + 1) % candidateRoster.length];
          setRefreshToast(
            `✓ Reassigned "${t.title.slice(0, 28)}…" to ${nextMember.name} (Audit Trail: Team handover logged)`
          );
          setTimeout(() => setRefreshToast(null), 4000);
          return { ...t, assignee: nextMember.name, tag: nextMember.dept };
        }
        return t;
      })
    );
  };

  // Task transition with strict DAG dependency check simulation
  const moveTask = (
    taskId: string,
    targetCol: "todo" | "in_progress" | "completed"
  ) => {
    // Check if task has dependency
    const targetTask = demoTasks.find((t) => t.id === taskId);
    if (targetTask?.dependsOn && targetCol === "in_progress") {
      const prerequisite = demoTasks.find((t) => t.id === targetTask.dependsOn);
      if (prerequisite && prerequisite.column !== "completed") {
        setDependencyWarning(
          `⚠️ DAG Blocker Enforced: You cannot start "${targetTask.title}" until prerequisite "${prerequisite.title}" is Completed!`
        );
        setTimeout(() => setDependencyWarning(null), 5000);
        return;
      }
    }

    setDependencyWarning(null);
    setDemoTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, column: targetCol } : t))
    );
  };

  const toggleChecklist = (id: string) => {
    setEmployeeChecklist((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, done: !item.done } : item
      )
    );
  };

  const markNotificationAsRead = (id: string) => {
    setSimulatedNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isUnread: false } : n))
    );
  };

  const unreadCount = simulatedNotifications.filter((n) => n.isUnread).length;
  const filteredNotifications = simulatedNotifications.filter((n) =>
    notifFilterTab === "unread" ? n.isUnread : true
  );

  // Monthly Hours & Rupees Calculation for ROI section (Average ₹1,200/hr in Indian tech & SMB ecosystem)
  const totalHoursSavedMonthly = teamSize * hoursWastedPerPerson * 4.2;
  const totalRupeesSavedMonthly = Math.round(totalHoursSavedMonthly * 1200);

  const faqs = [
    {
      q: "Why did TASQ-ONE switch to pure Manual Refresh instead of automatic background polling?",
      a: "In traditional platforms, aggressive auto-refresh timers (e.g. every 10–20 seconds) constantly re-fetch data in the background. This silently re-renders forms, clears half-filled descriptions, wipes subtask checklists, and can even trigger premature submissions. In TASQ-ONE v2.8, background timers are disabled. Your working state is 100% sacred, and re-fetching happens on-demand when you click 'Refresh'. Realtime updates still arrive instantly through event-driven WebSockets without disrupting your typing.",
    },
    {
      q: "How does Task Reassignment and 30-Day Safe Deletion work?",
      a: "Deliverables can be reassigned between team members with mandatory transfer reasons logged to the immutable workspace audit trail. When a task is deleted, it enters an audit-safe soft-deleted state with a 30-day recovery grace period. File attachments in Cloudflare R2 are preserved during this period to prevent catastrophic data loss, and automatically pruned after 30 days via scheduled cron sweepers.",
    },
    {
      q: "How does TASQ-ONE prevent duplicate submissions and network glitches?",
      a: "All state-changing actions (task creations, updates, and reassignments) are guarded by distributed Redis idempotency token locks. If an engineer double-clicks on a fluctuating mobile network, the duplicate request is safely deduplicated without creating duplicate tickets or triggering redundant webhook events.",
    },
    {
      q: "How does the Elevated Notification Center (z-[70]) work?",
      a: "The redesigned Notification Bell uses an elevated z-[70] layer and smart mobile coordinate anchors so it never gets obscured or overlapped by dashboard headers, sticky sidebars, or modals. It features dual All/Unread segmented tabs, an interactive sound alert toggle, and reliable human-readable timestamps (Just now, 12m ago, 2d ago), permanently eliminating timestamp bugs like 'NaNd ago'.",
    },
    {
      q: "How does TASQ-ONE enforce Task Dependency Blocking (DAG)?",
      a: "If Task B depends on Task A, TASQ-ONE mathematically links them in a Directed Acyclic Graph (DAG) and prevents Task B from being started or completed until Task A is verified Done. In our live sandbox above, try starting Task TSQ-104 before completing TSQ-103 to see the dependency engine in action.",
    },
    {
      q: "What happens when I log out of TASQ-ONE?",
      a: "Instead of dumping you onto a blank login screen, TASQ-ONE v2.8 gracefully redirects you to our public marketing showcase and simulated sandbox. This ensures founders and evaluators can seamlessly explore interactive demos and test features at any time.",
    },
    {
      q: "What makes the Groq Llama 3.3 AI engine different from typical AI summaries?",
      a: "TASQ-ONE does not produce generic fluff. You give it a 5-word sentence (e.g. 'Deploy Redis cluster with failover'), and it produces concrete technical Acceptance Criteria, Definition of Done items, dependency checks, and routes the task to the engineer with the lowest open backlog in under 1 second.",
    },
    {
      q: "How is our company data protected and isolated from other tenants?",
      a: "Every workspace is isolated at the database kernel level via PostgreSQL Row-Level Security (RLS) policies and cryptographically verified JWT tokens. Customer signups are guarded by Cloudflare Turnstile with generous 100/hr ceilings, ensuring zero cross-tenant IDOR vulnerabilities.",
    },
  ];

  return (
    <div className="min-h-screen bg-white bg-[radial-gradient(#d1d5db_1px,transparent_1px)] font-sans text-slate-900 antialiased [background-size:24px_24px] selection:bg-indigo-500/20 selection:text-indigo-900">
      {/* ======================================================================== */}
      {/* 1. EXECUTIVE HEADER — REUSABLE MARKETING NAVIGATION                      */}
      {/* ======================================================================== */}
      <MarketingNav />

      {/* ======================================================================== */}
      {/* 2. HERO SECTION — HIGH-IMPACT WITH v2.8 CAPABILITY BADGES                */}
      {/* ======================================================================== */}
      <section className="relative overflow-hidden pb-16 pt-12 sm:pb-24 sm:pt-20">
        {/* Soft Radial Ambient Lighting */}
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden"
          aria-hidden="true"
        >
          <div className="bg-gradient-radial absolute -top-32 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full from-indigo-100/40 via-purple-50/20 to-transparent blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative z-10 mx-auto max-w-7xl space-y-7 px-4 text-center sm:px-6 lg:px-8">
          {/* Version 2.8 Release Pill */}
          <div className="shadow-2xs inline-flex items-center gap-2 rounded-full border border-indigo-200/90 bg-indigo-50/90 px-4 py-1.5 text-xs font-semibold text-indigo-700 backdrop-blur-md">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600" />
            </span>
            <span>v2.8 Release: Audit-Ready Task Reassignment • 30-Day Safe Deletion • Team-Scoped RBAC • On-Demand Sync</span>
          </div>

          {/* Core Problem-Solving Headline */}
          <div className="space-y-1 sm:space-y-2">
            <h1 className="mx-auto max-w-5xl text-4xl font-black leading-[1.08] tracking-tight text-[#0B0F19] sm:text-6xl lg:text-7xl">
              Stop Managing Tasks in
            </h1>
            <div className="text-4xl font-black leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">
              <span className="text-[#F43F5E]">WhatsApp &amp; Messy </span>
              <span className="bg-gradient-to-r from-[#EA580C] via-[#D97706] to-[#F59E0B] bg-clip-text text-transparent">
                Spreadsheets
              </span>
            </div>
          </div>

          {/* Sub-headline */}
          <p className="mx-auto max-w-2xl pt-1 text-sm font-normal leading-relaxed text-slate-600 sm:text-base lg:text-lg">
            Assign tasks with absolute clarity, track live sprint progress without
            noisy meetings, and draft deliverables without fear of losing work.
            Engineered for high-velocity founders and engineering squads.
          </p>

          {/* 3-Button Cluster */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 pt-3">
            {/* 1. Primary Royal Blue CTA */}
            <Link
              href="/signup"
              className="group flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#4F46E5] px-7 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-indigo-300/50 transition-all hover:bg-[#4338CA] active:scale-95 sm:text-base"
            >
              <span>Get Started Free (₹0)</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>

            {/* 2. Explore Live Workspace Demo */}
            <button
              type="button"
              onClick={() => {
                setActiveTab("kanban");
                scrollToSection("workspace-experience");
              }}
              className="flex cursor-pointer items-center justify-center gap-2.5 rounded-2xl border border-slate-200/90 bg-white px-6 py-3.5 text-sm font-bold text-slate-900 shadow-sm transition-all hover:bg-slate-50 active:scale-95 sm:text-base"
            >
              <Play className="h-4 w-4 stroke-[2.5] text-indigo-600" />
              <span>Explore Live Workspace Demo</span>
            </button>

            {/* 3. Employee Daily View (Mint Green Pill) */}
            <button
              type="button"
              onClick={() => {
                setActiveTab("employee");
                scrollToSection("workspace-experience");
              }}
              className="shadow-2xs flex cursor-pointer items-center justify-center gap-2.5 rounded-2xl border border-[#a7f3d0] bg-[#ecfdf5] px-6 py-3.5 text-sm font-bold text-[#065f46] transition-all hover:bg-[#d1fae5] active:scale-95 sm:text-base"
            >
              <CheckSquare className="h-4 w-4 stroke-[2.5] text-[#059669]" />
              <span>Employee Daily View</span>
            </button>
          </div>

          {/* 4 Feature Innovation Metric Tiles */}
          <div className="mx-auto grid max-w-4xl grid-cols-2 gap-3 pt-6 text-left sm:grid-cols-4 sm:gap-4">
            <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-3 shadow-2xs backdrop-blur-md transition hover:border-indigo-300">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <RefreshCw className="h-3.5 w-3.5 text-indigo-600" />
                <span>Form-Safe Sync</span>
              </div>
              <p className="mt-1 text-[11px] leading-tight text-slate-500">
                No auto-refresh wipes or draft losses while typing
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-3 shadow-2xs backdrop-blur-md transition hover:border-blue-300">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <UserCheck className="h-3.5 w-3.5 text-blue-600" />
                <span>Audit Reassignment</span>
              </div>
              <p className="mt-1 text-[11px] leading-tight text-slate-500">
                Team-scoped handoffs with logged reasons & history
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-3 shadow-2xs backdrop-blur-md transition hover:border-emerald-300">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>30-Day Safe Deletion</span>
              </div>
              <p className="mt-1 text-[11px] leading-tight text-slate-500">
                Accidental delete defense & automated R2 cleanup
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-3 shadow-2xs backdrop-blur-md transition hover:border-purple-300">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                <span>Sub-Second AI</span>
              </div>
              <p className="mt-1 text-[11px] leading-tight text-slate-500">
                Groq Llama 3.3 70B DoD &amp; Criteria in &lt;800ms
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================================== */}
      {/* 3. TASQ-ONE WORKSPACE EXPERIENCE — ENRICHED SIMULATOR SANDBOX             */}
      {/* ======================================================================== */}
      <section
        id="workspace-experience"
        className="relative border-y border-slate-200 bg-slate-50/70 py-14 sm:py-20"
      >
        <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
          {/* Section Heading */}
          <div className="mx-auto max-w-2xl space-y-2.5 text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3.5 py-1 font-mono text-xs font-bold uppercase tracking-wide text-indigo-700">
              Interactive Product Sandbox (Simulated Data)
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Sprint Delivery Board
            </h2>
            <p className="text-xs leading-relaxed text-slate-600 sm:text-sm">
              Experience the core workflow firsthand. Test on-demand manual refresh,
              observe strict DAG dependency blocking, test AI decomposition, and
              preview the high-z notification center.
            </p>
          </div>

          {/* Simulator Container */}
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
            {/* Top Workspace Header Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-5 py-3.5">
              <div className="flex items-center gap-3">
                <div className="shadow-xs flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white">
                  <CheckCheck className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                    <span>Interactive Sandbox</span>
                    <span className="flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 font-mono text-[10px] font-bold text-indigo-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                      Simulated Data
                    </span>
                  </div>
                </div>
              </div>

              {/* On-Demand Manual Refresh Simulation Button */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSimulateRefresh}
                  disabled={isSimulatingRefresh}
                  title="Test the v2.8 Manual Refresh feature"
                  className="shadow-2xs inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-indigo-400 hover:bg-indigo-50/50 hover:text-indigo-600 active:scale-95 disabled:opacity-60"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${
                      isSimulatingRefresh ? "animate-spin text-indigo-600" : "text-slate-400"
                    }`}
                  />
                  <span>{isSimulatingRefresh ? "Syncing…" : "Manual Refresh"}</span>
                </button>

                {/* Simulated Notification Indicator */}
                <button
                  type="button"
                  onClick={() => setActiveTab("notifications")}
                  className={`relative flex h-8 w-8 items-center justify-center rounded-xl border transition ${
                    activeTab === "notifications"
                      ? "border-indigo-600 bg-indigo-50 text-indigo-600"
                      : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300"
                  }`}
                  title="Open Notification Hub"
                >
                  <Bell className="h-3.5 w-3.5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white ring-2 ring-white">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </div>

              {/* View Switcher Tabs */}
              <div className="flex items-center gap-1 rounded-2xl border border-slate-300/80 bg-slate-200/80 p-1 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveTab("kanban")}
                  className={`flex cursor-pointer items-center gap-2 rounded-xl px-3 py-1.5 transition-all ${
                    activeTab === "kanban"
                      ? "shadow-xs border border-slate-200 bg-white font-extrabold text-indigo-700"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  <span>Sprint Board</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("ai")}
                  className={`flex cursor-pointer items-center gap-2 rounded-xl px-3 py-1.5 transition-all ${
                    activeTab === "ai"
                      ? "shadow-xs border border-slate-200 bg-white font-extrabold text-indigo-700"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Bot className="h-3.5 w-3.5" />
                  <span>AI Decomposer</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("employee")}
                  className={`flex cursor-pointer items-center gap-2 rounded-xl px-3 py-1.5 transition-all ${
                    activeTab === "employee"
                      ? "shadow-xs border border-slate-200 bg-white font-extrabold text-indigo-700"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <CheckSquare className="h-3.5 w-3.5" />
                  <span>Morning Focus</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("notifications")}
                  className={`flex cursor-pointer items-center gap-2 rounded-xl px-3 py-1.5 transition-all ${
                    activeTab === "notifications"
                      ? "shadow-xs border border-slate-200 bg-white font-extrabold text-indigo-700"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Bell className="h-3.5 w-3.5" />
                  <span>Notifications ({unreadCount})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("broadcast")}
                  className={`flex cursor-pointer items-center gap-2 rounded-xl px-3 py-1.5 transition-all ${
                    activeTab === "broadcast"
                      ? "shadow-xs border border-slate-200 bg-white font-extrabold text-indigo-700"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Radio className="h-3.5 w-3.5" />
                  <span>Automated Alerts</span>
                </button>
              </div>
            </div>

            {/* Dynamic Interactive Toasts for Refresh & DAG Blockers */}
            {refreshToast && (
              <div className="animate-fade-in flex items-center justify-between border-b border-emerald-200 bg-emerald-50 px-5 py-2.5 text-xs font-semibold text-emerald-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>{refreshToast}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setRefreshToast(null)}
                  className="font-bold text-emerald-700 hover:opacity-75"
                >
                  ✕
                </button>
              </div>
            )}

            {dependencyWarning && (
              <div className="animate-fade-in flex items-center justify-between border-b border-rose-200 bg-rose-50 px-5 py-2.5 text-xs font-semibold text-rose-800">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-600" />
                  <span>{dependencyWarning}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setDependencyWarning(null)}
                  className="font-bold text-rose-700 hover:opacity-75"
                >
                  ✕
                </button>
              </div>
            )}

            {/* TAB 1: SPRINT KANBAN MATRIX WITH DAG BLOCKER DEMO */}
            {activeTab === "kanban" && (
              <div className="space-y-5 p-5 sm:p-7">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                  {/* Column: To Do */}
                  <div className="space-y-3.5 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
                        <span className="text-xs font-extrabold text-slate-800">
                          To Do ({demoTasks.filter((t) => t.column === "todo").length})
                        </span>
                      </div>
                      <span className="rounded bg-slate-200/80 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-500">
                        Pending
                      </span>
                    </div>

                    <div className="space-y-3">
                      {demoTasks
                        .filter((t) => t.column === "todo")
                        .map((task) => (
                          <div
                            key={task.id}
                            className={`shadow-xs space-y-2.5 rounded-xl border bg-white p-3.5 transition-all ${
                              task.dependsOn
                                ? "border-amber-300/80 bg-amber-50/20 hover:border-amber-500"
                                : "border-slate-200 hover:border-indigo-400"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                                {task.tag}
                              </span>
                              <div className="flex items-center gap-1">
                                {task.dependsOn && (
                                  <span className="inline-flex items-center gap-0.5 rounded bg-amber-100 px-1.5 py-0.5 font-mono text-[9px] font-bold text-amber-800" title="Has prerequisite dependency">
                                    <Lock className="h-2.5 w-2.5" /> DAG Locked
                                  </span>
                                )}
                                <span className="font-mono text-[10px] font-bold uppercase text-slate-500">
                                  {task.priority}
                                </span>
                              </div>
                            </div>
                            <div className="text-xs font-bold leading-snug text-slate-900">
                              {task.title}
                            </div>
                            <p className="text-[11px] leading-relaxed text-slate-500">
                              {task.desc}
                            </p>
                            <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs">
                              <div className="flex items-center gap-2">
                                <div className="flex h-6 w-6 items-center justify-center rounded-full border border-indigo-200 bg-indigo-100 text-[10px] font-black text-indigo-700">
                                  {task.assignee.charAt(0)}
                                </div>
                                <span className="text-[11px] font-semibold text-slate-700">
                                  {task.assignee}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleSimulateReassign(task.id)}
                                  className="cursor-pointer rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-indigo-600 active:scale-95"
                                  title="Test Audit-Logged Task Reassignment"
                                >
                                  Reassign ⇄
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveTask(task.id, "in_progress")}
                                  className="cursor-pointer rounded-lg bg-indigo-50 px-2.5 py-1 text-[10px] font-bold text-indigo-700 transition-colors hover:bg-indigo-100 active:scale-95"
                                >
                                  Start →
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Column: In Progress */}
                  <div className="space-y-3.5 rounded-2xl border-2 border-indigo-200 bg-slate-50/80 p-4">
                    <div className="flex items-center justify-between border-b border-indigo-100 pb-1">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-amber-500" />
                        <span className="text-xs font-extrabold text-slate-800">
                          In Progress (
                          {demoTasks.filter((t) => t.column === "in_progress").length}
                          )
                        </span>
                      </div>
                      <span className="rounded bg-amber-100 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-800">
                        Active
                      </span>
                    </div>

                    <div className="space-y-3">
                      {demoTasks
                        .filter((t) => t.column === "in_progress")
                        .map((task) => (
                          <div
                            key={task.id}
                            className="space-y-2.5 rounded-xl border-2 border-indigo-400 bg-white p-3.5 shadow-md transition-all"
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                                {task.tag}
                              </span>
                              <span
                                className={`rounded px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${
                                  task.priority === "urgent"
                                    ? "border border-rose-200 bg-rose-50 text-rose-700"
                                    : "border border-amber-200 bg-amber-50 text-amber-700"
                                }`}
                              >
                                {task.priority}
                              </span>
                            </div>
                            <div className="text-xs font-bold leading-snug text-slate-900">
                              {task.title}
                            </div>
                            <p className="text-[11px] leading-relaxed text-slate-500">
                              {task.desc}
                            </p>
                            <div className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 font-mono text-[10px] font-semibold text-amber-800">
                              <Clock className="h-3.5 w-3.5 text-amber-600" />
                              <span>{task.due}</span>
                            </div>
                            <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs">
                              <div className="flex items-center gap-2">
                                <div className="flex h-6 w-6 items-center justify-center rounded-full border border-amber-200 bg-amber-100 text-[10px] font-black text-amber-800">
                                  {task.assignee.charAt(0)}
                                </div>
                                <span className="text-[11px] font-semibold text-slate-700">
                                  {task.assignee}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleSimulateReassign(task.id)}
                                  className="cursor-pointer rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-indigo-600 active:scale-95"
                                  title="Test Audit-Logged Task Reassignment"
                                >
                                  Reassign ⇄
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveTask(task.id, "completed")}
                                  className="shadow-xs cursor-pointer rounded-lg bg-emerald-600 px-3 py-1 text-[10px] font-bold text-white transition-colors hover:bg-emerald-700 active:scale-95"
                                >
                                  Mark Done ✓
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Column: Completed */}
                  <div className="space-y-3.5 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                        <span className="text-xs font-extrabold text-slate-800">
                          Completed (
                          {demoTasks.filter((t) => t.column === "completed").length}
                          )
                        </span>
                      </div>
                      <span className="rounded bg-emerald-100 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-800">
                        Done
                      </span>
                    </div>

                    <div className="space-y-3">
                      {demoTasks
                        .filter((t) => t.column === "completed")
                        .map((task) => (
                          <div
                            key={task.id}
                            className="shadow-xs space-y-2.5 rounded-xl border border-emerald-200 bg-white p-3.5 opacity-95 transition-all"
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                                {task.tag}
                              </span>
                              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                                Verified
                              </span>
                            </div>
                            <div className="text-xs font-bold leading-snug text-slate-500 line-through">
                              {task.title}
                            </div>
                            <p className="text-[11px] leading-relaxed text-slate-400">
                              {task.desc}
                            </p>
                            <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs">
                              <div className="flex items-center gap-2">
                                <div className="flex h-6 w-6 items-center justify-center rounded-full border border-emerald-200 bg-emerald-100 text-[10px] font-black text-emerald-800">
                                  {task.assignee.charAt(0)}
                                </div>
                                <span className="text-[11px] text-slate-400">
                                  {task.assignee}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => moveTask(task.id, "todo")}
                                className="cursor-pointer rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-700 transition-colors hover:bg-slate-200 active:scale-95"
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
              <div className="space-y-5 p-5 sm:p-7">
                <div className="space-y-2.5">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <Sparkles className="h-4 w-4 text-indigo-600" />
                    <span>
                      Enter any natural language task spec to structure via Groq Llama 3.3 70B:
                    </span>
                  </label>
                  <div className="flex flex-col gap-2.5 sm:flex-row">
                    <input
                      type="text"
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="e.g. Prepare Client Proposal or Database Index Optimization..."
                      className="shadow-xs w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none sm:text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => handleSimulateAi(aiPrompt)}
                      disabled={aiGenerating}
                      className="flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-xs font-extrabold text-white shadow-md shadow-indigo-200 transition-all hover:bg-indigo-700 disabled:opacity-50 sm:text-sm"
                    >
                      {aiGenerating ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                      <span>Structure Ticket</span>
                    </button>
                  </div>

                  {/* Presets */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="font-mono text-[11px] font-semibold text-slate-500">
                      Try sample specs:
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleSimulateAi(
                          "Prepare Enterprise Tier SLA & Security Addendum"
                        )
                      }
                      className="cursor-pointer rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-800 transition-colors hover:bg-slate-200"
                    >
                      Client Proposal
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleSimulateAi(
                          "PostgreSQL Query Optimization & B-Tree Indexing"
                        )
                      }
                      className="cursor-pointer rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-800 transition-colors hover:bg-slate-200"
                    >
                      Database Indexing
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleSimulateAi(
                          "Launch UPI Auto-Pay integration for recurring B2B subscriptions"
                        )
                      }
                      className="cursor-pointer rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-800 transition-colors hover:bg-slate-200"
                    >
                      UPI Auto-Pay Flow
                    </button>
                  </div>
                </div>

                {/* AI Result Card */}
                <div className="space-y-4 rounded-2xl border-2 border-indigo-200/80 bg-slate-50 p-5 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="rounded-md border border-indigo-200 bg-indigo-50 px-2 py-0.5 font-mono text-xs font-black text-indigo-700">
                        {aiResult.key}
                      </span>
                      <span className="text-sm font-extrabold text-slate-900">
                        {aiResult.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <span className="rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 font-extrabold uppercase text-rose-700">
                        {aiResult.priority}
                      </span>
                      <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 font-bold text-slate-700">
                        Estimate: {aiResult.estimate}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600">
                    Recommended Assignee:{" "}
                    <strong className="font-bold text-slate-900">
                      {aiResult.assignee}
                    </strong>{" "}
                    ({aiResult.department})
                  </div>

                  <div className="space-y-2">
                    <div className="font-mono text-xs font-bold uppercase tracking-wider text-slate-800">
                      Acceptance Criteria (Definition of Done):
                    </div>
                    <ul className="space-y-1.5 text-xs text-slate-700">
                      {aiResult.criteria.map((c, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
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
              <div className="mx-auto max-w-2xl space-y-5 p-5 sm:p-7">
                <div className="space-y-1.5 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 via-slate-50 to-white p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-extrabold uppercase tracking-wider text-indigo-700">
                      Morning Protocol
                    </span>
                    <span className="rounded border border-slate-200 bg-white px-2 py-0.5 font-mono text-xs font-bold text-slate-600">
                      {employeeChecklist.filter((i) => i.done).length} of{" "}
                      {employeeChecklist.length} Complete
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Good Morning, Sarah Jenkins
                  </h3>
                  <p className="text-xs text-slate-600">
                    Here are your active deliverables for today. Zero meeting
                    distractions.
                  </p>
                </div>

                <div className="space-y-3">
                  {employeeChecklist.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => toggleChecklist(item.id)}
                      className={`flex cursor-pointer items-center justify-between gap-3 rounded-2xl border p-4 transition-all ${
                        item.done
                          ? "border-slate-200 bg-slate-50 opacity-80"
                          : "border-slate-200 bg-white shadow-sm hover:border-indigo-400"
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`flex h-5 w-5 items-center justify-center rounded-lg border transition-colors ${
                            item.done
                              ? "border-emerald-600 bg-emerald-600 text-white"
                              : "border-slate-300 bg-white"
                          }`}
                        >
                          {item.done && <Check className="h-3.5 w-3.5" />}
                        </div>
                        <div>
                          <div
                            className={`text-xs font-bold sm:text-sm ${item.done ? "text-slate-400 line-through" : "text-slate-900"}`}
                          >
                            {item.title}
                          </div>
                          <div className="mt-0.5 font-mono text-[10px] text-slate-500">
                            {item.tag}
                          </div>
                        </div>
                      </div>

                      <span className="rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1 font-mono text-xs font-bold text-slate-700">
                        {item.duration}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: ELEVATED LIVE NOTIFICATION HUB (v2.8) */}
            {activeTab === "notifications" && (
              <div className="mx-auto max-w-2xl space-y-4 p-5 sm:p-7">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                      <Bell className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                        Live Notification Hub (v2.8)
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Non-overlapping z-[70] panel with All/Unread filtering & sound alerts
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Sound Alert Toggle */}
                    <button
                      type="button"
                      onClick={() => setNotifSoundEnabled(!notifSoundEnabled)}
                      className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-600 shadow-2xs transition hover:bg-slate-100"
                    >
                      {notifSoundEnabled ? (
                        <Volume2 className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <VolumeX className="h-3 w-3 text-slate-400" />
                      )}
                      <span>{notifSoundEnabled ? "Sound On" : "Muted"}</span>
                    </button>

                    {/* Filter Tabs */}
                    <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-0.5 text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => setNotifFilterTab("all")}
                        className={`rounded px-2 py-0.5 text-[11px] transition ${
                          notifFilterTab === "all"
                            ? "bg-white font-bold text-slate-900 shadow-2xs"
                            : "text-slate-500 hover:text-slate-900"
                        }`}
                      >
                        All ({simulatedNotifications.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setNotifFilterTab("unread")}
                        className={`rounded px-2 py-0.5 text-[11px] transition ${
                          notifFilterTab === "unread"
                            ? "bg-white font-bold text-slate-900 shadow-2xs"
                            : "text-slate-500 hover:text-slate-900"
                        }`}
                      >
                        Unread ({unreadCount})
                      </button>
                    </div>
                  </div>
                </div>

                {/* Notifications List */}
                <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
                  {filteredNotifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => markNotificationAsRead(notif.id)}
                      className={`flex cursor-pointer items-start gap-3 p-3.5 transition ${
                        notif.isUnread ? "bg-indigo-50/40 hover:bg-indigo-50/70" : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-600">
                        {notif.type === "task.assigned" && <UserPlus className="h-3.5 w-3.5" />}
                        {notif.type === "task.mentioned" && <AtSign className="h-3.5 w-3.5 text-amber-600" />}
                        {notif.type === "task.due_soon" && <Clock className="h-3.5 w-3.5 text-blue-600" />}
                        {notif.type === "task.reassigned" && <UserCheck className="h-3.5 w-3.5 text-purple-600" />}
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-900">{notif.message}</span>
                          <span className="font-mono text-[10px] text-slate-400">{notif.time}</span>
                        </div>
                        <div className="text-[11px] font-medium text-slate-600">
                          📌 {notif.taskTitle}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          by {notif.actor}
                        </div>
                      </div>

                      {notif.isUnread && (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-600" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 5: AUTOMATED ALERTS */}
            {activeTab === "broadcast" && (
              <div className="mx-auto max-w-3xl space-y-6 p-5 sm:p-7">
                <div className="space-y-1 text-center">
                  <h3 className="text-base font-extrabold text-slate-900">
                    Proactive Multi-Channel Notifications
                  </h3>
                  <p className="text-xs text-slate-600">
                    Dispatched automatically to Slack and email before deadlines
                    are ever missed.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {/* Slack Dispatch Preview */}
                  <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 font-extrabold text-slate-900">
                        <Hash className="h-4 w-4 text-indigo-600" />
                        <span>#engineering-sprint</span>
                      </span>
                      <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-700">
                        ● Live Channel
                      </span>
                    </div>
                    <div className="space-y-1.5 rounded-xl border-l-4 border-indigo-600 bg-slate-50 p-3 text-xs">
                      <div className="font-bold text-slate-900">
                        🚨 Urgent Deliverable Due in 2 Hours
                      </div>
                      <p className="text-[11px] leading-snug text-slate-600">
                        <strong>TSQ-103</strong>: Website Redesign Delivery
                      </p>
                      <div className="text-[10px] text-slate-500">
                        Owner: Sarah Jenkins • Status: In Progress
                      </div>
                    </div>
                    <div className="font-mono text-[10px] text-slate-400">
                      Dispatched to Slack Incoming Webhook
                    </div>
                  </div>

                  {/* Resend Email Digest Preview */}
                  <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 font-extrabold text-slate-900">
                        <Send className="h-4 w-4 text-purple-600" />
                        <span>Executive Email Digest</span>
                      </span>
                      <span className="font-mono text-[10px] text-slate-500">
                        Weekly Mon 9 AM
                      </span>
                    </div>
                    <div className="space-y-1.5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
                      <div className="font-bold text-slate-900">
                        Sprint Velocity: 95% On-Time Delivery
                      </div>
                      <p className="text-[11px] leading-snug text-slate-600">
                        28 Deliverables Done • 0 Blockers • Mean Turnaround 2.4 Days
                      </p>
                      <div className="text-[10px] font-bold text-indigo-700">
                        Auto-compiled via Groq AI + Resend
                      </div>
                    </div>
                    <div className="font-mono text-[10px] text-slate-400">
                      Sent to founders & team leaders
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ======================================================================== */}
      {/* 4. NEW IN v2.8: ARCHITECTURAL & OPERATIONAL INNOVATIONS                 */}
      {/* ======================================================================== */}
      <section className="py-14 sm:py-20 border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl space-y-10 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl space-y-2.5 text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3.5 py-1 font-mono text-xs font-bold uppercase tracking-wide text-indigo-700">
              v2.8 Architecture Breakthroughs
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Precision Engineered for Frictionless Execution
            </h2>
            <p className="text-xs leading-relaxed text-slate-600 sm:text-sm">
              We eliminated the subtle frustrations that plague generic task managers:
              timer reloads that wipe draft descriptions, overlapping dropdown menus,
              and premature task execution.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Card 1: On-Demand Manual Sync */}
            <div className="space-y-3.5 rounded-3xl border border-slate-200 bg-slate-50/50 p-6 shadow-sm transition hover:border-indigo-400 hover:bg-white hover:shadow-md">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-indigo-100 bg-indigo-50 text-indigo-600">
                <RefreshCw className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <div className="font-mono text-[11px] font-bold uppercase text-indigo-600">
                  Zero Form Resets
                </div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  On-Demand Manual Sync
                </h3>
              </div>
              <p className="text-xs leading-relaxed text-slate-600">
                Background intervals that used to randomly refresh pages and wipe half-filled
                ticket descriptions are gone. Data updates on your exact command with instant UI feedback.
              </p>
            </div>

            {/* Card 2: Audit-Ready Task Reallocation */}
            <div className="space-y-3.5 rounded-3xl border border-slate-200 bg-slate-50/50 p-6 shadow-sm transition hover:border-blue-400 hover:bg-white hover:shadow-md">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-600">
                <UserCheck className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <div className="font-mono text-[11px] font-bold uppercase text-blue-600">
                  Frictionless Handoffs
                </div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Audit Task Reallocation
                </h3>
              </div>
              <p className="text-xs leading-relaxed text-slate-600">
                Transfer deliverables between squad members with mandatory audit trail reasons.
                Managers operate strictly within departmental boundaries with complete handover logs.
              </p>
            </div>

            {/* Card 3: 30-Day Safe Deletion & R2 Lifecycle */}
            <div className="space-y-3.5 rounded-3xl border border-slate-200 bg-slate-50/50 p-6 shadow-sm transition hover:border-emerald-400 hover:bg-white hover:shadow-md">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-600">
                <RotateCcw className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <div className="font-mono text-[11px] font-bold uppercase text-emerald-600">
                  Accidental Loss Defense
                </div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  30-Day Safe Deletion
                </h3>
              </div>
              <p className="text-xs leading-relaxed text-slate-600">
                Deleted tasks enter an audit-safe soft state with 30-day recovery grace period.
                Cloudflare R2 attachments remain intact during this period with automated background pruning.
              </p>
            </div>

            {/* Card 4: Strict DAG Dependency Blocking */}
            <div className="space-y-3.5 rounded-3xl border border-slate-200 bg-slate-50/50 p-6 shadow-sm transition hover:border-amber-400 hover:bg-white hover:shadow-md">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-amber-100 bg-amber-50 text-amber-600">
                <Lock className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <div className="font-mono text-[11px] font-bold uppercase text-amber-600">
                  Workflow Guardrails
                </div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Strict DAG Dependency Engine
                </h3>
              </div>
              <p className="text-xs leading-relaxed text-slate-600">
                Prevent premature merges and downstream bottlenecks. Downstream deliverables
                remain locked until their prerequisite parent tasks are verified Completed.
              </p>
            </div>

            {/* Card 5: Sub-Second Groq AI */}
            <div className="space-y-3.5 rounded-3xl border border-slate-200 bg-slate-50/50 p-6 shadow-sm transition hover:border-purple-400 hover:bg-white hover:shadow-md">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-purple-100 bg-purple-50 text-purple-600">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <div className="font-mono text-[11px] font-bold uppercase text-purple-600">
                  Llama 3.3 70B &lt;800ms
                </div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  AI Task Ticket Decomposer
                </h3>
              </div>
              <p className="text-xs leading-relaxed text-slate-600">
                Turn vague, messy thoughts into 4-point Acceptance Criteria, DoD checklists,
                and workload-balanced assignee suggestions at lightning speeds under 800ms.
              </p>
            </div>

            {/* Card 6: Zero-IDOR RBAC & Idempotency */}
            <div className="space-y-3.5 rounded-3xl border border-slate-200 bg-slate-50/50 p-6 shadow-sm transition hover:border-rose-400 hover:bg-white hover:shadow-md">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-rose-100 bg-rose-50 text-rose-600">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <div className="font-mono text-[11px] font-bold uppercase text-rose-600">
                  Enterprise Hardened
                </div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Team RBAC &amp; Idempotency
                </h3>
              </div>
              <p className="text-xs leading-relaxed text-slate-600">
                Kernel-level PostgreSQL RLS with manager team-boundary IDOR enforcement.
                Distributed Redis idempotency token locks shield against duplicate submissions.
              </p>
            </div>

            {/* Card 7: High-Z Notification Center */}
            <div className="space-y-3.5 rounded-3xl border border-slate-200 bg-slate-50/50 p-6 shadow-sm transition hover:border-indigo-400 hover:bg-white hover:shadow-md">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-indigo-100 bg-indigo-50 text-indigo-600">
                <Bell className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <div className="font-mono text-[11px] font-bold uppercase text-indigo-600">
                  Non-Overlapping UI
                </div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Elevated Hub (z-[70])
                </h3>
              </div>
              <p className="text-xs leading-relaxed text-slate-600">
                Modal-safe floating center featuring All vs Unread tabs, 1-click audio alerts,
                and mathematically accurate relative time diffs without timestamp parsing glitches.
              </p>
            </div>

            {/* Card 8: Live Telemetry & 24/7 Watchdog */}
            <div className="space-y-3.5 rounded-3xl border border-slate-200 bg-slate-50/50 p-6 shadow-sm transition hover:border-emerald-400 hover:bg-white hover:shadow-md">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-600">
                <Activity className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <div className="font-mono text-[11px] font-bold uppercase text-emerald-600">
                  Continuous Liveness
                </div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Live Telemetry Watchdog
                </h3>
              </div>
              <p className="text-xs leading-relaxed text-slate-600">
                Transparent /health status probe monitoring, sub-second latency telemetry,
                Sentry APM integration, and automated daily cron triggers for continuous reliability.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================================== */}
      {/* 5. WHY TEAMS SWITCH TO TASQ-ONE (BEFORE VS AFTER)                        */}
      {/* ======================================================================== */}
      <section id="why-switch" className="py-14 sm:py-20">
        <div className="mx-auto max-w-7xl space-y-10 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl space-y-2.5 text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3.5 py-1 font-mono text-xs font-bold uppercase tracking-wide text-indigo-700">
              Why Teams Switch to TASQ-ONE
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Stop Losing Hours in Chaotic Group Chats
            </h2>
            <p className="text-xs leading-relaxed text-slate-600 sm:text-sm">
              When work is scattered across messages, emails, and notes,
              deadlines get missed. TASQ-ONE creates one clear source of truth.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* The Everyday Chaos Without TASQ-ONE */}
            <div className="shadow-xs space-y-5 rounded-3xl border border-rose-200 bg-rose-50/50 p-7 sm:p-9">
              <div>
                <div className="font-mono text-xs font-bold uppercase tracking-wider text-rose-700">
                  The Everyday Chaos
                </div>
                <div className="mt-1 text-lg font-extrabold text-slate-900">
                  Without TASQ-ONE
                </div>
              </div>
              <ul className="space-y-3.5 text-xs text-slate-700 sm:text-sm">
                <li className="flex items-start gap-3">
                  <span className="mt-[-2px] shrink-0 text-base font-black text-rose-600">
                    ✕
                  </span>
                  <span>
                    Tasks get buried in noisy WhatsApp groups and lost email threads.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-[-2px] shrink-0 text-base font-black text-rose-600">
                    ✕
                  </span>
                  <span>
                    Daily 45-minute status meetings where nobody has clear answers.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-[-2px] shrink-0 text-base font-black text-rose-600">
                    ✕
                  </span>
                  <span>
                    Random auto-reloads wipe uncommitted task drafts and form inputs.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-[-2px] shrink-0 text-base font-black text-rose-600">
                    ✕
                  </span>
                  <span>
                    Engineers start tasks out of sequence because prerequisites weren&apos;t enforced.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-[-2px] shrink-0 text-base font-black text-rose-600">
                    ✕
                  </span>
                  <span>
                    Untracked task handoffs cause confusion when team members switch projects with zero audit trails.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-[-2px] shrink-0 text-base font-black text-rose-600">
                    ✕
                  </span>
                  <span>
                    Accidental deletions instantly destroy tasks and attachments with zero recovery safety net.
                  </span>
                </li>
              </ul>
            </div>

            {/* The Clear Workflow With TASQ-ONE */}
            <div className="shadow-xs space-y-5 rounded-3xl border border-emerald-200 bg-emerald-50/50 p-7 sm:p-9">
              <div>
                <div className="font-mono text-xs font-bold uppercase tracking-wider text-emerald-700">
                  The Clear Workflow
                </div>
                <div className="mt-1 text-lg font-extrabold text-slate-900">
                  With TASQ-ONE v2.8
                </div>
              </div>
              <ul className="space-y-3.5 text-xs text-slate-700 sm:text-sm">
                <li className="flex items-start gap-3">
                  <span className="mt-[-2px] shrink-0 text-base font-black text-emerald-600">
                    ✓
                  </span>
                  <span>
                    One centralized board where every deliverable has clear owners, DoD, and SLA dates.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-[-2px] shrink-0 text-base font-black text-emerald-600">
                    ✓
                  </span>
                  <span>
                    Zero status meetings: check the live board anytime in 5 seconds.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-[-2px] shrink-0 text-base font-black text-emerald-600">
                    ✓
                  </span>
                  <span>
                    Safe on-demand sync: forms and drafts are never wiped by background polling timers.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-[-2px] shrink-0 text-base font-black text-emerald-600">
                    ✓
                  </span>
                  <span>
                    Automated Slack & Email reminders ensure nothing ever slips through the cracks.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-[-2px] shrink-0 text-base font-black text-emerald-600">
                    ✓
                  </span>
                  <span>
                    Audit-ready task reassignments: instant handoffs with immutable activity logs and team alert dispatch.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-[-2px] shrink-0 text-base font-black text-emerald-600">
                    ✓
                  </span>
                  <span>
                    30-day soft-delete grace period with 1-click restore and automated Cloudflare R2 orphan pruning.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================================== */}
      {/* 6. MEASURABLE BUSINESS IMPACT                                           */}
      {/* ======================================================================== */}
      <section
        id="business-impact"
        className="border-y border-slate-200 bg-slate-50/70 py-14 sm:py-20"
      >
        <div className="mx-auto max-w-7xl space-y-10 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl space-y-2.5 text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3.5 py-1 font-mono text-xs font-bold uppercase tracking-wide text-indigo-700">
              Measurable Business Impact
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              How TASQ-ONE Saves Time and Accelerates Growth
            </h2>
            <p className="text-xs leading-relaxed text-slate-600 sm:text-sm">
              Transform chaotic project coordination into a smooth, self-driving
              execution engine.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Impact 1 */}
            <div className="space-y-2.5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md">
              <div className="text-3xl font-black text-indigo-600 sm:text-4xl">
                10+ Hrs
              </div>
              <div className="text-xs font-extrabold text-slate-900 sm:text-sm">
                Saved per Manager / Week
              </div>
              <p className="text-xs leading-relaxed text-slate-600">
                Eliminate manual follow-up messages, status check calls, and
                repetitive task drafting.
              </p>
            </div>

            {/* Impact 2 */}
            <div className="space-y-2.5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-emerald-300 hover:shadow-md">
              <div className="text-3xl font-black text-emerald-600 sm:text-4xl">
                95%
              </div>
              <div className="text-xs font-extrabold text-slate-900 sm:text-sm">
                On-Time Task Delivery
              </div>
              <p className="text-xs leading-relaxed text-slate-600">
                Automated reminders ensure tasks are finished before due dates,
                not days after.
              </p>
            </div>

            {/* Impact 3 */}
            <div className="space-y-2.5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-purple-300 hover:shadow-md">
              <div className="text-3xl font-black text-purple-600 sm:text-4xl">
                3x Faster
              </div>
              <div className="text-xs font-extrabold text-slate-900 sm:text-sm">
                Task Delegation Speed
              </div>
              <p className="text-xs leading-relaxed text-slate-600">
                Let the AI Assistant turn vague ideas into detailed requirements
                in seconds.
              </p>
            </div>

            {/* Impact 4 */}
            <div className="space-y-2.5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-blue-300 hover:shadow-md">
              <div className="text-3xl font-black text-blue-600 sm:text-4xl">
                100% Free
              </div>
              <div className="text-xs font-extrabold text-slate-900 sm:text-sm">
                Zero Surprise Bills
              </div>
              <p className="text-xs leading-relaxed text-slate-600">
                Full-featured pilot mode gives your team enterprise capabilities
                without costly subscriptions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================================== */}
      {/* 7. TAILORED SOLUTIONS                                                    */}
      {/* ======================================================================== */}
      <section id="tailored-solutions" className="py-14 sm:py-20">
        <div className="mx-auto max-w-7xl space-y-10 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl space-y-2.5 text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3.5 py-1 font-mono text-xs font-bold uppercase tracking-wide text-indigo-700">
              Tailored Solutions
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Built for High-Velocity Teams & Growing Businesses
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Card 1: Marketing & Agencies */}
            <div className="space-y-3.5 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition-all hover:border-indigo-400 hover:shadow-md">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-indigo-100 bg-indigo-50 text-indigo-600">
                <Briefcase className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <div className="font-mono text-xs font-bold uppercase text-indigo-600">
                  Multi-Client Sprints
                </div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Client & Marketing Agencies
                </h3>
              </div>
              <p className="text-xs leading-relaxed text-slate-600 sm:text-sm">
                Juggle multiple client deliverables, share asset attachments,
                and ensure client deadlines are met without team burnout.
              </p>
            </div>

            {/* Card 2: Software & Product Teams */}
            <div className="space-y-3.5 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition-all hover:border-emerald-400 hover:shadow-md">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-600">
                <Terminal className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <div className="font-mono text-xs font-bold uppercase text-emerald-600">
                  Fast Sprint Cycles
                </div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Software & Product Teams
                </h3>
              </div>
              <p className="text-xs leading-relaxed text-slate-600 sm:text-sm">
                Plan weekly sprints, track feature bugs, and let the AI
                Assistant draft clear technical acceptance criteria for developers.
              </p>
            </div>

            {/* Card 3: Operations & SMBs */}
            <div className="space-y-3.5 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition-all hover:border-amber-400 hover:shadow-md">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-amber-100 bg-amber-50 text-amber-600">
                <Building className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <div className="font-mono text-xs font-bold uppercase text-amber-600">
                  Centralized Operations
                </div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Operations & Fast-Growing SMBs
                </h3>
              </div>
              <p className="text-xs leading-relaxed text-slate-600 sm:text-sm">
                Manage day-to-day business checklists, billing follow-ups,
                hiring tasks, and inter-departmental projects in one place.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================================== */}
      {/* 8. SIMPLE 3-STEP SETUP                                                  */}
      {/* ======================================================================== */}
      <section className="border-y border-slate-200 bg-slate-50/70 py-14 sm:py-20">
        <div className="mx-auto max-w-7xl space-y-10 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl space-y-2.5 text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3.5 py-1 font-mono text-xs font-bold uppercase tracking-wide text-indigo-700">
              Simple 3-Step Setup
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Get Your Entire Team Up & Running in Under 2 Minutes
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Step 01 */}
            <div className="relative space-y-3 overflow-hidden rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
              <span className="font-mono text-4xl font-black text-indigo-200">
                01
              </span>
              <h3 className="text-base font-extrabold text-slate-900">
                Create Your Workspace
              </h3>
              <p className="text-xs leading-relaxed text-slate-600 sm:text-sm">
                Sign up in 30 seconds, choose your organization name, and invite
                your team with simple passwordless links.
              </p>
            </div>

            {/* Step 02 */}
            <div className="relative space-y-3 overflow-hidden rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
              <span className="font-mono text-4xl font-black text-purple-200">
                02
              </span>
              <h3 className="text-base font-extrabold text-slate-900">
                Assign & Enhance with AI
              </h3>
              <p className="text-xs leading-relaxed text-slate-600 sm:text-sm">
                Add your tasks to the board. Click &apos;Enhance with AI&apos;
                to automatically clarify requirements, set priorities, and assign.
              </p>
            </div>

            {/* Step 03 */}
            <div className="relative space-y-3 overflow-hidden rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
              <span className="font-mono text-4xl font-black text-emerald-200">
                03
              </span>
              <h3 className="text-base font-extrabold text-slate-900">
                Track & Deliver Without Chasing
              </h3>
              <p className="text-xs leading-relaxed text-slate-600 sm:text-sm">
                Employees complete their daily checklist on mobile or desktop,
                while automated Slack & email alerts keep managers informed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================================== */}
      {/* 9. INTERACTIVE ROI / TIME SAVED CALCULATOR                               */}
      {/* ======================================================================== */}
      <section id="roi-calculator" className="py-14 sm:py-20">
        <div className="mx-auto max-w-5xl space-y-8 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl space-y-2.5 text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 font-mono text-xs font-bold uppercase tracking-wide text-indigo-700">
              ROI Calculator
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Calculate Your Team&apos;s Reclaimed Hours
            </h2>
            <p className="text-xs text-slate-600 sm:text-sm">
              See how much time and payroll value your team reclaims each month
              by switching to TASQ-ONE.
            </p>
          </div>

          <div className="grid grid-cols-1 items-center gap-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-lg sm:p-10 lg:grid-cols-2">
            {/* Sliders */}
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-900">
                  <span>Team Size (Colleagues & Managers)</span>
                  <span className="font-mono text-sm text-indigo-600">
                    {teamSize} Members
                  </span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="50"
                  value={teamSize}
                  onChange={(e) => setTeamSize(parseInt(e.target.value, 10))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-indigo-600"
                />
                <div className="flex justify-between font-mono text-[10px] text-slate-400">
                  <span>2 Members</span>
                  <span>50 Members</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-900">
                  <span>
                    Hours Wasted Weekly on Status Follow-Ups per Person
                  </span>
                  <span className="font-mono text-sm text-indigo-600">
                    {hoursWastedPerPerson} Hours / Wk
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={hoursWastedPerPerson}
                  onChange={(e) =>
                    setHoursWastedPerPerson(parseInt(e.target.value, 10))
                  }
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-indigo-600"
                />
                <div className="flex justify-between font-mono text-[10px] text-slate-400">
                  <span>1 Hour</span>
                  <span>10 Hours</span>
                </div>
              </div>
            </div>

            {/* Calculated Output Card */}
            <div className="space-y-4 rounded-2xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 via-slate-50 to-white p-6 text-center shadow-sm">
              <div>
                <span className="font-mono text-xs font-bold uppercase text-indigo-700">
                  Monthly Reclaimed Capacity
                </span>
                <div className="mt-1 text-4xl font-black text-slate-900 sm:text-5xl">
                  {Math.round(totalHoursSavedMonthly)}{" "}
                  <span className="text-base font-bold text-slate-500 sm:text-lg">
                    Hours / Mo
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-3">
                <span className="text-xs font-medium text-slate-600">
                  Estimated Monthly Value Reclaimed:
                </span>
                <div className="mt-0.5 text-2xl font-extrabold text-emerald-600 sm:text-3xl">
                  ₹{totalRupeesSavedMonthly.toLocaleString("en-IN")}{" "}
                  <span className="text-xs font-normal text-slate-500">
                    / month
                  </span>
                </div>
              </div>

              <Link
                href="/signup"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white shadow-md transition-colors hover:bg-indigo-700"
              >
                <span>Reclaim This Time for ₹0 Free</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================================== */}
      {/* 10. FREQUENTLY ASKED QUESTIONS                                          */}
      {/* ======================================================================== */}
      <section className="border-t border-slate-200 bg-slate-50/70 py-14 sm:py-20">
        <div className="mx-auto max-w-3xl space-y-8 px-4 sm:px-6 lg:px-8">
          <div className="space-y-2.5 text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3.5 py-1 font-mono text-xs font-bold uppercase tracking-wide text-indigo-700">
              Got Questions?
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="shadow-xs overflow-hidden rounded-2xl border border-slate-200 bg-white"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="flex w-full cursor-pointer items-center justify-between gap-3 p-4 text-left text-xs font-bold text-slate-900 transition-colors hover:text-indigo-600 sm:text-sm"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${
                      openFaq === idx ? "rotate-180 text-indigo-600" : ""
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="border-t border-slate-100 px-4 pb-4 pt-3 text-xs leading-relaxed text-slate-600">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================================================================== */}
      {/* 11. BOTTOM CALL TO ACTION                                               */}
      {/* ======================================================================== */}
      <section className="relative py-14 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-5 rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 p-8 text-center text-white shadow-2xl sm:p-14">
            <h2 className="text-2xl font-black tracking-tight sm:text-4xl">
              Bring Complete Clarity to Your Team Today
            </h2>
            <p className="mx-auto max-w-xl text-xs leading-relaxed text-indigo-200 sm:text-sm">
              Experience the smarter, simpler task platform that helps growing
              teams execute faster with zero friction.
            </p>
            <div className="flex flex-col items-center justify-center gap-3.5 pt-2 sm:flex-row">
              <Link
                href="/signup"
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-white px-7 py-3.5 text-xs font-extrabold text-indigo-950 shadow-lg transition-all hover:bg-slate-100 active:scale-95 sm:w-auto sm:text-sm"
              >
                <span>Create Workspace (₹0 Free)</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="w-full rounded-2xl border border-indigo-400/40 bg-indigo-900/60 px-6 py-3.5 text-xs font-bold text-white transition-all hover:bg-indigo-900/90 active:scale-95 sm:w-auto sm:text-sm"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================================== */}
      {/* 12. ENTERPRISE MEGA FOOTER — STANDARDIZED MARKETING FOOTER              */}
      {/* ======================================================================== */}
      <MarketingFooter />
    </div>
  );
}
