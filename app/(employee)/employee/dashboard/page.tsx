"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Clock,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  CheckSquare,
  Lock,
  Search,
  Filter,
  Zap,
  Radio,
  Flame,
  ArrowRight,
  TrendingUp,
  ListTodo,
  Layers,
  ChevronRight,
  Smile,
  Sun,
  Moon,
  Sunset,
  User,
  Mail,
  Shield,
  Building,
  Copy,
  Check,
  Briefcase,
  CalendarDays,
  Award,
  Hash,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { TaskDetail } from "@/components/tasks/TaskDetail";
import { type KanbanTaskItem } from "@/components/tasks/TaskCard";
import { captureEvent } from "@/lib/analytics/posthog";
import { createClient } from "@/lib/supabase/client";

export default function EmployeeDashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedTask, setSelectedTask] = useState<KanbanTaskItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"all" | "dueToday" | "upcoming" | "completed">("all");
  const [copiedId, setCopiedId] = useState(false);

  // Employee Profile Details
  const [employeeProfile, setEmployeeProfile] = useState<{
    id: string;
    employeeCode: string;
    fullName: string;
    email: string;
    role: string;
    teamId: string | null;
    teamName: string;
    avatarUrl: string | null;
    joinedAt: string;
  }>({
    id: "",
    employeeCode: "EMP-0001",
    fullName: "Employee",
    email: "employee@workspace.com",
    role: "employee",
    teamId: null,
    teamName: "General Squad",
    avatarUrl: null,
    joinedAt: new Date().toISOString(),
  });

  const [buckets, setBuckets] = useState<{
    dueToday: KanbanTaskItem[];
    upcoming: KanbanTaskItem[];
    recentlyCompleted: KanbanTaskItem[];
  }>({
    dueToday: [],
    upcoming: [],
    recentlyCompleted: [],
  });

  // Dynamic greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: "Good Morning", icon: Sun, color: "text-amber-400" };
    if (hour < 18) return { text: "Good Afternoon", icon: Sunset, color: "text-orange-400" };
    return { text: "Good Evening", icon: Moon, color: "text-indigo-300" };
  }, []);

  const fetchMyTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/dashboard/me");
      const json = await res.json();
      if (json.success && json.data) {
        if (json.data.profile) {
          setEmployeeProfile(json.data.profile);
        }
        setBuckets({
          dueToday: json.data.dueToday || [],
          upcoming: json.data.upcoming || [],
          recentlyCompleted: json.data.recentlyCompleted || [],
        });
      }
    } catch {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyTasks();
  }, [fetchMyTasks]);

  // Realtime Supabase Channel Subscription for Live Task Updates
  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const hasSupabase = Boolean(supabaseUrl) && !supabaseUrl.includes("your-project-ref");

    if (!hasSupabase) {
      setIsConnected(true);
      return;
    }

    let channel: any = null;
    try {
      const supabase = createClient();
      const channelId = `realtime:employee_tasks:${Math.random().toString(36).slice(2, 9)}`;
      channel = supabase
        .channel(channelId)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "tasks",
          },
          () => {
            fetchMyTasks();
          }
        )
        .subscribe((status) => {
          setIsConnected(status === "SUBSCRIBED");
        });
    } catch (e) {
      console.warn("Realtime task subscription notice:", e);
    }

    return () => {
      if (channel) {
        const supabase = createClient();
        supabase.removeChannel(channel);
      }
    };
  }, [fetchMyTasks]);

  const copyEmployeeId = () => {
    if (!employeeProfile.employeeCode) return;
    navigator.clipboard.writeText(employeeProfile.employeeCode);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Quick Status Update on Card
  const handleQuickStatusUpdate = async (
    task: KanbanTaskItem,
    newStatus: "pending" | "in_progress" | "in_review" | "completed"
  ) => {
    if (task.status === newStatus) return;

    // Check dependency blocker
    if (newStatus === "in_progress" || newStatus === "completed") {
      const depIds = task.dependencyTaskIds || [];
      const allList = [
        ...buckets.dueToday,
        ...buckets.upcoming,
        ...buckets.recentlyCompleted,
      ];
      const blockers = allList.filter(
        (t) => depIds.includes(t.id) && t.status !== "completed"
      );

      if (blockers.length > 0) {
        setToastMessage(
          `⚠️ Cannot set to ${newStatus.replace("_", " ")}: Prerequisite "${blockers[0]?.title}" is not completed.`
        );
        setTimeout(() => setToastMessage(null), 6000);
        return;
      }
    }

    const previousStatus = task.status;
    const updatedTask: KanbanTaskItem = { ...task, status: newStatus };

    // Optimistic re-bucketing
    setBuckets((prev) => {
      const filterOut = (list: KanbanTaskItem[]) => list.filter((t) => t.id !== task.id);
      const dueToday = filterOut(prev.dueToday);
      const upcoming = filterOut(prev.upcoming);
      const recentlyCompleted = filterOut(prev.recentlyCompleted);

      if (newStatus === "completed") {
        return {
          dueToday,
          upcoming,
          recentlyCompleted: [updatedTask, ...recentlyCompleted],
        };
      } else {
        const dueTime = task.dueDate || task.due_date;
        const isToday =
          dueTime && new Date(dueTime).toDateString() === new Date().toDateString();

        if (isToday) {
          return {
            dueToday: [updatedTask, ...dueToday],
            upcoming,
            recentlyCompleted,
          };
        } else {
          return {
            dueToday,
            upcoming: [updatedTask, ...upcoming],
            recentlyCompleted,
          };
        }
      }
    });

    captureEvent("task_status_changed", {
      taskId: task.id,
      oldStatus: previousStatus,
      newStatus,
    });

    if (newStatus === "completed") {
      captureEvent("task_completed", {
        taskId: task.id,
        priority: task.priority,
      });
    }

    try {
      const res = await fetch(`/api/v1/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (!json.success) {
        setToastMessage(json.error || "Failed to update status.");
        fetchMyTasks();
      }
    } catch {
      setToastMessage("Network error: Status update failed.");
      fetchMyTasks();
    }
  };

  const priorityVariants: Record<string, "default" | "urgent" | "warning"> = {
    low: "default",
    medium: "default",
    high: "warning",
    urgent: "urgent",
  };

  const statusColors: Record<string, string> = {
    pending: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700",
    in_progress: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
    in_review: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    completed: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  };

  const allEmployeeTasks = useMemo(() => {
    return [
      ...buckets.dueToday,
      ...buckets.upcoming,
      ...buckets.recentlyCompleted,
    ];
  }, [buckets]);

  // Overall Task Completion Stats
  const totalTasks = allEmployeeTasks.length;
  const completedCount = buckets.recentlyCompleted.length;
  const dueTodayCount = buckets.dueToday.length;
  const upcomingCount = buckets.upcoming.length;
  const inProgressCount = allEmployeeTasks.filter((t) => t.status === "in_progress").length;
  const completionPercentage = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  // Filter Helper
  const filterList = (tasks: KanbanTaskItem[]) => {
    return tasks.filter((t) => {
      const matchesSearch =
        searchQuery === "" ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (t.tags && t.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())));

      const matchesPriority = priorityFilter === "all" || t.priority === priorityFilter;

      return matchesSearch && matchesPriority;
    });
  };

  const filteredDueToday = filterList(buckets.dueToday);
  const filteredUpcoming = filterList(buckets.upcoming);
  const filteredCompleted = filterList(buckets.recentlyCompleted);

  const GreetingIcon = greeting.icon;

  const initials = employeeProfile.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "EM";

  const formattedJoinDate = employeeProfile.joinedAt
    ? new Date(employeeProfile.joinedAt).toLocaleDateString(undefined, {
        month: "short",
        year: "numeric",
      })
    : "Active Member";

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-14">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-urgent/10 border border-urgent/20 text-xs text-urgent font-medium flex items-center justify-between animate-fade-in shadow-sm">
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-urgent font-bold hover:underline ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 👤 Premium Employee Profile & ID Command Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-7 shadow-2xl border border-indigo-800/40">
        {/* Glow Spheres */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left Column: Avatar & Comprehensive Details */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            {/* Avatar with Live Beacon */}
            <div className="relative flex-shrink-0">
              <div className="h-20 w-20 sm:h-22 sm:w-22 rounded-2xl bg-gradient-to-tr from-indigo-500 to-teal-400 p-[2px] shadow-lg shadow-indigo-500/25">
                <div className="h-full w-full rounded-[14px] bg-slate-900 flex items-center justify-center font-extrabold text-2xl tracking-wider text-white">
                  {initials}
                </div>
              </div>
              {/* Online Beacon */}
              <span
                title="Online & Synced"
                className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center shadow"
              >
                <span className="h-2 w-2 rounded-full bg-white animate-ping" />
              </span>
            </div>

            {/* Employee Information */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Greeting */}
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/10 text-indigo-200 backdrop-blur-md border border-white/10">
                  <GreetingIcon className={`w-3.5 h-3.5 ${greeting.color}`} />
                  <span>{greeting.text}</span>
                </span>

                {/* Role Badge */}
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                  <Shield className="w-3 h-3" />
                  {employeeProfile.role}
                </span>

                {/* Realtime Live Sync Pill */}
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border backdrop-blur-md transition-colors ${
                    isConnected
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                      : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                  }`}
                >
                  <Radio className={`w-3 h-3 ${isConnected ? "animate-pulse text-emerald-400" : "text-amber-400"}`} />
                  <span>{isConnected ? "Realtime Sync Active" : "Connecting..."}</span>
                </span>
              </div>

              {/* Name & Title */}
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
                  {employeeProfile.fullName}
                </h1>
                <p className="text-xs sm:text-sm text-indigo-200/80 mt-0.5 flex items-center gap-2">
                  <span>Workspace Member</span>
                  <span className="text-indigo-400">•</span>
                  <span>Personal Focus & Execution Workspace</span>
                </p>
              </div>

              {/* Identity & Metadata Chips */}
              <div className="flex items-center gap-2.5 flex-wrap pt-1 text-xs">
                {/* Employee ID with Copy Button */}
                <button
                  type="button"
                  onClick={copyEmployeeId}
                  title="Click to copy Employee ID"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-indigo-200 hover:text-white border border-white/10 transition group font-mono text-[11px] font-bold"
                >
                  <Hash className="w-3 h-3 text-indigo-400" />
                  <span>ID: {employeeProfile.employeeCode}</span>
                  {copiedId ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3 text-indigo-300 group-hover:text-white transition opacity-70" />
                  )}
                </button>

                {/* Team / Squad Chip */}
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 text-indigo-200 border border-white/10 text-[11px] font-semibold">
                  <Briefcase className="w-3 h-3 text-amber-400" />
                  <span>Team: {employeeProfile.teamName || "General Squad"}</span>
                </span>

                {/* Email Chip */}
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 text-indigo-200 border border-white/10 text-[11px]">
                  <Mail className="w-3 h-3 text-indigo-300" />
                  <span>{employeeProfile.email}</span>
                </span>

                {/* Join Date */}
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 text-indigo-200 border border-white/10 text-[11px]">
                  <CalendarDays className="w-3 h-3 text-teal-300" />
                  <span>Since {formattedJoinDate}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Sprint Completion Card */}
          <div className="bg-white/5 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/10 min-w-[260px] flex flex-col justify-between space-y-3.5 flex-shrink-0">
            <div className="flex items-center justify-between text-xs">
              <span className="text-indigo-200 font-semibold flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
                Sprint Productivity
              </span>
              <span className="font-extrabold text-emerald-400 text-base">{completionPercentage}%</span>
            </div>

            {/* Progress Track */}
            <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden p-[1px]">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-300 transition-all duration-500 rounded-full shadow-sm"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-indigo-300/80 pt-0.5">
              <span>{completedCount} of {totalTasks} tasks cleared</span>
              <button
                type="button"
                onClick={fetchMyTasks}
                disabled={isLoading}
                className="hover:text-white flex items-center gap-1 font-semibold transition px-2 py-1 rounded-md bg-white/10 hover:bg-white/20"
                title="Refresh Workspace"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin text-teal-300" : ""}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 📊 KPI Summary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* Card 1: Due Today */}
        <div
          onClick={() => setActiveTab(activeTab === "dueToday" ? "all" : "dueToday")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-sm ${
            dueTodayCount > 0
              ? "bg-rose-500/5 dark:bg-rose-950/20 border-rose-500/30 hover:border-rose-500/50"
              : "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/60 hover:border-slate-300"
          } ${activeTab === "dueToday" ? "ring-2 ring-rose-500" : ""}`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Due Today</span>
            <Clock className={`w-4 h-4 ${dueTodayCount > 0 ? "text-rose-500 animate-pulse" : "text-slate-400"}`} />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl sm:text-3xl font-extrabold ${dueTodayCount > 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-white"}`}>
              {dueTodayCount}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">urgent tasks</span>
          </div>
        </div>

        {/* Card 2: In Progress */}
        <div
          className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 shadow-sm"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>In Progress</span>
            <Zap className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
              {inProgressCount}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">in flight</span>
          </div>
        </div>

        {/* Card 3: Upcoming (7 Days) */}
        <div
          onClick={() => setActiveTab(activeTab === "upcoming" ? "all" : "upcoming")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-sm ${
            activeTab === "upcoming" ? "ring-2 ring-primary" : ""
          } bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/60 hover:border-slate-300`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Upcoming (7D)</span>
            <Calendar className="w-4 h-4 text-primary" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {upcomingCount}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">scheduled</span>
          </div>
        </div>

        {/* Card 4: Completed */}
        <div
          onClick={() => setActiveTab(activeTab === "completed" ? "all" : "completed")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-sm ${
            activeTab === "completed" ? "ring-2 ring-emerald-500" : ""
          } bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/60 hover:border-slate-300`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {completedCount}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">cleared</span>
          </div>
        </div>
      </div>

      {/* 🔍 Search, Filter & Tabs Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === "all"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60"
            }`}
          >
            All Tasks ({totalTasks})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("dueToday")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeTab === "dueToday"
                ? "bg-rose-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Due Today ({dueTodayCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("upcoming")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeTab === "upcoming"
                ? "bg-primary text-white shadow-sm"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Upcoming ({upcomingCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("completed")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeTab === "completed"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Done ({completedCount})
          </button>
        </div>

        {/* Search & Priority Controls */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">🔴 Urgent</option>
            <option value="high">🟠 High</option>
            <option value="medium">🔵 Medium</option>
            <option value="low">⚪ Low</option>
          </select>
        </div>
      </div>

      {/* 📋 Section 1: Due Today */}
      {(activeTab === "all" || activeTab === "dueToday") && (
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping inline-block" />
              <span>Due Today / Priority Action</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                {filteredDueToday.length}
              </span>
            </div>
          </div>

          <div className="space-y-2.5">
            {filteredDueToday.map((task) => (
              <TaskListItem
                key={task.id}
                task={task}
                onCardClick={() => {
                  setSelectedTask(task);
                  setIsDetailOpen(true);
                }}
                onStatusChange={(status) => handleQuickStatusUpdate(task, status)}
                priorityVariants={priorityVariants}
                statusColors={statusColors}
              />
            ))}

            {filteredDueToday.length === 0 && (
              <div className="p-8 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/30 text-center space-y-2">
                <div className="text-3xl">🎉</div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  All clear for today!
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  You have no pending tasks due today. Great job keeping your workspace clean!
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 📅 Section 2: Upcoming (Next 7 Days) */}
      {(activeTab === "all" || activeTab === "upcoming") && (
        <div className="space-y-3 pt-4">
          <div className="flex items-center justify-between pb-1 border-b border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              <Calendar className="w-4 h-4 text-indigo-500" />
              <span>Upcoming Queue (Next 7 Days)</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                {filteredUpcoming.length}
              </span>
            </div>
          </div>

          <div className="space-y-2.5">
            {filteredUpcoming.map((task) => (
              <TaskListItem
                key={task.id}
                task={task}
                onCardClick={() => {
                  setSelectedTask(task);
                  setIsDetailOpen(true);
                }}
                onStatusChange={(status) => handleQuickStatusUpdate(task, status)}
                priorityVariants={priorityVariants}
                statusColors={statusColors}
              />
            ))}

            {filteredUpcoming.length === 0 && (
              <div className="p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/30 text-center text-xs text-slate-400">
                No upcoming scheduled tasks found.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ✅ Section 3: Recently Completed */}
      {(activeTab === "all" || activeTab === "completed") && (
        <div className="space-y-3 pt-4">
          <div className="flex items-center justify-between pb-1 border-b border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Recently Completed</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                {filteredCompleted.length}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            {filteredCompleted.map((task) => (
              <div
                key={task.id}
                onClick={() => {
                  setSelectedTask(task);
                  setIsDetailOpen(true);
                }}
                className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between gap-3 text-xs opacity-80 hover:opacity-100 transition cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5 fill-current" />
                  </div>
                  <span className="line-through text-slate-400 dark:text-slate-500 font-medium group-hover:text-slate-600 dark:group-hover:text-slate-300 transition">
                    {task.title}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    Completed ✓
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition" />
                </div>
              </div>
            ))}

            {filteredCompleted.length === 0 && (
              <div className="p-4 rounded-xl text-center text-xs text-slate-400">
                No tasks completed yet this sprint.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      <TaskDetail
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
        allTasks={allEmployeeTasks}
      />
    </div>
  );
}

interface TaskListItemProps {
  task: KanbanTaskItem;
  onCardClick: () => void;
  onStatusChange: (status: "pending" | "in_progress" | "in_review" | "completed") => void;
  priorityVariants: Record<string, "default" | "urgent" | "warning">;
  statusColors: Record<string, string>;
}

function TaskListItem({
  task,
  onCardClick,
  onStatusChange,
  priorityVariants,
  statusColors,
}: TaskListItemProps) {
  const rawDueDate = task.dueDate || task.due_date;
  const isOverdue =
    rawDueDate &&
    task.status !== "completed" &&
    new Date(rawDueDate).getTime() < Date.now();

  const isCompleted = task.status === "completed";

  // Subtask progress
  const subtasks = task.subtasks || [];
  const completedSubtasks = subtasks.filter((s: any) => s.completed).length;

  return (
    <div className="p-4 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-500/40 transition-all duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group">
      {/* 1-Click Quick Complete Circle Button */}
      <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onStatusChange(isCompleted ? "in_progress" : "completed");
          }}
          title={isCompleted ? "Mark as in progress" : "Mark as completed"}
          className={`mt-0.5 sm:mt-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-150 flex-shrink-0 active:scale-90 ${
            isCompleted
              ? "bg-emerald-500 border-emerald-500 text-white"
              : "border-slate-300 dark:border-slate-600 hover:border-emerald-500 text-transparent hover:text-emerald-500/40"
          }`}
        >
          <CheckCircle2 className="w-4 h-4 fill-current" />
        </button>

        {/* Task Info (Clickable for detail modal) */}
        <div
          onClick={onCardClick}
          className="flex-1 cursor-pointer space-y-1.5 select-none min-w-0"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={priorityVariants[task.priority] || "default"}>
              {task.priority.toUpperCase()}
            </Badge>

            {isOverdue && (
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                <AlertTriangle className="w-3 h-3" />
                OVERDUE
              </span>
            )}

            {/* Subtask count */}
            {subtasks.length > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/60 px-2 py-0.5 rounded-full">
                <CheckSquare className="w-3 h-3 text-indigo-500" />
                {completedSubtasks}/{subtasks.length} subtasks
              </span>
            )}

            {task.tags?.map((t) => (
              <span
                key={t}
                className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 font-medium"
              >
                #{t}
              </span>
            ))}
          </div>

          <h4
            className={`text-sm font-bold truncate transition-colors duration-150 ${
              isCompleted
                ? "line-through text-slate-400 dark:text-slate-500"
                : "text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
            }`}
          >
            {task.title}
          </h4>

          {rawDueDate && (
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>
                Due:{" "}
                {new Date(rawDueDate).toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Status Dropdown Action */}
      <div
        className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-700/60 pl-9 sm:pl-0"
        onClick={(e) => e.stopPropagation()}
      >
        <select
          value={task.status}
          onChange={(e) =>
            onStatusChange(
              e.target.value as "pending" | "in_progress" | "in_review" | "completed"
            )
          }
          className={`text-xs font-bold px-3 py-1.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer ${
            statusColors[task.status] || "bg-slate-100 text-slate-700"
          }`}
        >
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="in_review">In Review</option>
          <option value="completed">Completed ✓</option>
        </select>
      </div>
    </div>
  );
}
