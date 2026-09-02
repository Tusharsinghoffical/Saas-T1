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
import { useAutoRefresh, AutoRefreshBadge } from "@/components/ui/AutoRefreshControl";

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
    joinedAt: "",
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

  // Client-hydrated greeting based on user's local timezone
  const [greeting, setGreeting] = useState<{ text: string; icon: any; color: string }>({
    text: "Welcome",
    icon: Sparkles,
    color: "text-amber-500",
  });

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting({ text: "Good Morning", icon: Sun, color: "text-amber-500" });
    } else if (hour < 18) {
      setGreeting({ text: "Good Afternoon", icon: Sunset, color: "text-orange-500" });
    } else {
      setGreeting({ text: "Good Evening", icon: Moon, color: "text-indigo-400" });
    }
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

  // Manual Refresh Hook
  const { isRefreshing, triggerManual } = useAutoRefresh(fetchMyTasks);

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
    in_review: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
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

      {/* ── Modern Sleek Profile Header Bar ── */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Identity Info */}
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-white text-lg font-black shadow-md shadow-primary/20">
                {initials}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  <GreetingIcon className={`w-3.5 h-3.5 ${greeting.color}`} />
                  <span>{greeting.text},</span>
                </span>
                <span className="text-base font-extrabold text-slate-900 dark:text-white">
                  {employeeProfile.fullName}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider">
                  {employeeProfile.role}
                </span>
              </div>

              {/* Identity details row */}
              <div className="flex items-center gap-2.5 flex-wrap mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                <button
                  type="button"
                  onClick={copyEmployeeId}
                  title="Click to copy ID"
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-mono text-[10px] font-bold text-slate-700 dark:text-slate-300 transition"
                >
                  <Hash className="w-3 h-3 text-primary" />
                  <span>{employeeProfile.employeeCode || "ID: EMP-0001"}</span>
                  {copiedId ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-slate-400" />}
                </button>

                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                  <Briefcase className="w-3 h-3 text-amber-500" />
                  <span>{employeeProfile.teamName || "General Squad"}</span>
                </span>

                <span className="text-slate-300 dark:text-slate-600">•</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">{employeeProfile.email}</span>
              </div>
            </div>
          </div>

          {/* Right Action Area: Refresh & Sprint Progress */}
          <div className="flex items-center gap-3 self-start md:self-center flex-wrap">
            {/* Manual Refresh */}
            <AutoRefreshBadge
              isRefreshing={isRefreshing || isLoading}
              triggerManual={triggerManual}
            />

            {/* Productivity Pill */}
            <div className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-2.5">
              <div className="text-right">
                <div className="text-[10px] uppercase font-bold text-slate-400">Sprint Progress</div>
                <div className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                  {completedCount}/{totalTasks} Done ({completionPercentage}%)
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center font-bold text-[11px] text-emerald-600 dark:text-emerald-400">
                {completionPercentage}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Metric Snapshot Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Due Today */}
        <div
          onClick={() => setActiveTab(activeTab === "dueToday" ? "all" : "dueToday")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs hover:shadow-md ${
            activeTab === "dueToday"
              ? "bg-rose-50/80 dark:bg-rose-950/30 border-rose-300 dark:border-rose-500/40 ring-2 ring-rose-500/20"
              : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
              Due Today
            </span>
            <Clock className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">{dueTodayCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Immediate priority tasks</div>
        </div>

        {/* Card 2: In Progress */}
        <div
          onClick={() => setActiveTab("all")}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
              In Progress
            </span>
            <Zap className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">{inProgressCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Currently in flight</div>
        </div>

        {/* Card 3: Upcoming (7D) */}
        <div
          onClick={() => setActiveTab(activeTab === "upcoming" ? "all" : "upcoming")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs hover:shadow-md ${
            activeTab === "upcoming"
              ? "bg-indigo-50/80 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-500/40 ring-2 ring-indigo-500/20"
              : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
              Upcoming (7D)
            </span>
            <Calendar className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">{upcomingCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Scheduled for next 7 days</div>
        </div>

        {/* Card 4: Completed */}
        <div
          onClick={() => setActiveTab(activeTab === "completed" ? "all" : "completed")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs hover:shadow-md ${
            activeTab === "completed"
              ? "bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-500/40 ring-2 ring-emerald-500/20"
              : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Completed
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{completedCount}</div>
          <div className="text-[11px] text-emerald-600/70 dark:text-emerald-500 mt-1">Cleared this sprint</div>
        </div>
      </div>

      {/* ── Filter Bar & Tabs ── */}
      <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Tab pills */}
        <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === "all"
                ? "bg-primary text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            All Tasks ({totalTasks})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("dueToday")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === "dueToday"
                ? "bg-rose-500 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            Due Today ({dueTodayCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("upcoming")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === "upcoming"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            Upcoming ({upcomingCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("completed")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === "completed"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            Completed ({completedCount})
          </button>
        </div>

        {/* Search & Priority Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search tasks…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium cursor-pointer"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* ── Section 1: Due Today / Priority Action ── */}
      {(activeTab === "all" || activeTab === "dueToday") && (
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              <Clock className="w-4 h-4 text-rose-500" />
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
              <div className="p-8 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 text-center space-y-1.5">
                <div className="text-2xl">🎉</div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">All clear for today!</div>
                <div className="text-[11px] text-slate-400">You have no pending tasks due today. Great job keeping your workspace clean!</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Section 2: Upcoming Queue (Next 7 Days) ── */}
      {(activeTab === "all" || activeTab === "upcoming") && (
        <div className="space-y-3 pt-3">
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

      {/* ── Section 3: Recently Completed ── */}
      {(activeTab === "all" || activeTab === "completed") && (
        <div className="space-y-3 pt-3">
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
    <div className="p-4 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 shadow-xs hover:shadow-md hover:border-primary/40 transition-all duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group">
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
                <CheckSquare className="w-3 h-3 text-primary" />
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
                : "text-slate-900 dark:text-white group-hover:text-primary"
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
          className={`text-xs font-bold px-3 py-1.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary transition-all cursor-pointer ${
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
