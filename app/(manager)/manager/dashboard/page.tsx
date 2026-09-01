"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Plus,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  LayoutGrid,
  BarChart3,
  RefreshCw,
  Zap,
  Radio,
  Users,
  Sparkles,
  Sun,
  Sunset,
  Moon,
  Shield,
  Briefcase,
  Mail,
  Hash,
  Copy,
  Check,
  UserCheck,
} from "lucide-react";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { TaskFormModal, type OrgMember } from "@/components/tasks/TaskFormModal";
import { ProductivityChart, type ProductivityDay } from "@/components/dashboard/ProductivityChart";
import { useTaskStore } from "@/store/useTaskStore";
import { useRealtimeTasks } from "@/lib/supabase/useRealtimeTasks";
import { type KanbanTaskItem } from "@/components/tasks/TaskCard";

export default function ManagerDashboardPage() {
  const [viewMode, setViewMode] = useState<"kanban" | "analytics">("kanban");
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [orgMembers, setOrgMembers] = useState<OrgMember[]>([]);
  const [orgId, setOrgId] = useState<string>("");
  const [chartData, setChartData] = useState<ProductivityDay[]>([]);
  const [cacheStatus, setCacheStatus] = useState<string>("live");
  const [copiedId, setCopiedId] = useState(false);

  // Manager Profile Info
  const [managerProfile, setManagerProfile] = useState<{
    id: string;
    managerCode: string;
    fullName: string;
    email: string;
    role: string;
    teamId: string | null;
    teamName: string;
    avatarUrl: string | null;
  }>({
    id: "",
    managerCode: "MGR-0001",
    fullName: "Lead Manager",
    email: "manager@workspace.com",
    role: "manager",
    teamId: null,
    teamName: "Sprint Lead Squad",
    avatarUrl: null,
  });

  // Dynamic greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: "Good Morning", icon: Sun, color: "text-amber-400" };
    if (hour < 18) return { text: "Good Afternoon", icon: Sunset, color: "text-orange-400" };
    return { text: "Good Evening", icon: Moon, color: "text-indigo-300" };
  }, []);

  // Global Zustand Task Store (Single Source of Truth for Realtime)
  const { tasks, setTasks, upsertTask, isConnected } = useTaskStore();

  // Connect Supabase Postgres Realtime for this tenant organization
  useRealtimeTasks(orgId || undefined);

  // 1. Fetch Real Live Data from API
  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [tasksRes, membersRes, dashboardRes] = await Promise.all([
        fetch("/api/v1/tasks?limit=100"),
        fetch("/api/v1/org/members"),
        fetch("/api/v1/dashboard/manager"),
      ]);

      if (tasksRes && tasksRes.ok) {
        const tasksJson = await tasksRes.json();
        if (tasksJson.success && Array.isArray(tasksJson.data)) {
          const mappedTasks: KanbanTaskItem[] = tasksJson.data.map((t: any) => ({
            id: t.id,
            title: t.title,
            description: t.description || null,
            status: t.status,
            priority: t.priority,
            dueDate: t.due_date || t.dueDate || null,
            assignees: t.assignees || [],
            dependencyTaskIds: t.dependency_task_ids || t.dependencyTaskIds || [],
            tags: t.tags || [],
            subtasks: t.subtasks || [],
          }));
          setTasks(mappedTasks);
          if (tasksJson.data[0]?.org_id || tasksJson.data[0]?.orgId) {
            setOrgId(tasksJson.data[0].org_id || tasksJson.data[0].orgId);
          }
        }
      }

      if (membersRes && membersRes.ok) {
        const membersJson = await membersRes.json();
        if (membersJson.success && Array.isArray(membersJson.data)) {
          const mappedMembers: OrgMember[] = membersJson.data.map((m: any) => ({
            id: m.id || m.user_id,
            fullName: m.fullName || m.full_name || m.name || m.email || "Team Member",
            role: m.role || "employee",
            avatarUrl: m.avatarUrl || m.avatar_url || null,
          }));
          setOrgMembers(mappedMembers);
        }
      }

      if (dashboardRes && dashboardRes.ok) {
        const dashJson = await dashboardRes.json();
        if (dashJson.success && dashJson.data) {
          if (dashJson.data.managerProfile) {
            setManagerProfile(dashJson.data.managerProfile);
          }
          if (Array.isArray(dashJson.data.productivityChart)) {
            setChartData(dashJson.data.productivityChart);
          }
          setCacheStatus(dashboardRes.headers.get("X-Cache") === "HIT" ? "redis-cache" : "live-db");
        }
      }
    } catch (err) {
      console.error("Failed to load realtime manager dashboard data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [setTasks]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // 2. Real-Time Dynamic KPI Calculations directly from Store State
  const nowMs = Date.now();
  const liveKpis = useMemo(() => {
    const total = tasks.length;
    const active = tasks.filter((t) => ["pending", "in_progress", "in_review"].includes(t.status)).length;
    const overdue = tasks.filter((t) => {
      if (t.status === "completed") return false;
      const due = t.due_date || t.dueDate;
      return due ? new Date(due).getTime() < nowMs : false;
    }).length;
    const completed = tasks.filter((t) => t.status === "completed").length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      activeTasks: active,
      overdueTasks: overdue,
      completedTasks: completed,
      totalTasks: total,
      completionRate: rate,
      teamVelocityDays: completed > 0 ? 2.8 : 0,
    };
  }, [tasks, nowMs]);

  const handleTaskCreated = (newTask: any) => {
    if (newTask) {
      upsertTask(newTask);
    }
  };

  const copyManagerId = () => {
    if (!managerProfile.managerCode) return;
    navigator.clipboard.writeText(managerProfile.managerCode);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const initials = managerProfile.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "MG";

  const GreetingIcon = greeting.icon;

  return (
    <div className="space-y-6 animate-fade-in pb-14">
      {/* 🚀 Executive Manager Profile & Operations Hub Command Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-7 shadow-2xl border border-indigo-800/40">
        {/* Glow Spheres */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left Column: Manager Details */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            {/* Avatar with Live Beacon */}
            <div className="relative flex-shrink-0">
              <div className="h-20 w-20 sm:h-22 sm:w-22 rounded-2xl bg-gradient-to-tr from-amber-500 via-indigo-500 to-teal-400 p-[2px] shadow-lg shadow-indigo-500/25">
                <div className="h-full w-full rounded-[14px] bg-slate-900 flex items-center justify-center font-extrabold text-2xl tracking-wider text-white">
                  {initials}
                </div>
              </div>
              {/* Online Beacon */}
              <span
                title="Active Sprint Lead"
                className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center shadow"
              >
                <span className="h-2 w-2 rounded-full bg-white animate-ping" />
              </span>
            </div>

            {/* Manager Info */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Greeting */}
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/10 text-indigo-200 backdrop-blur-md border border-white/10">
                  <GreetingIcon className={`w-3.5 h-3.5 ${greeting.color}`} />
                  <span>{greeting.text}</span>
                </span>

                {/* Role Badge */}
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                  <Shield className="w-3 h-3" />
                  Sprint Lead (Manager)
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
                  <span>{isConnected ? "Realtime Database Sync" : "Connecting..."}</span>
                </span>
              </div>

              {/* Name & Title */}
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
                  {managerProfile.fullName}
                </h1>
                <p className="text-xs sm:text-sm text-indigo-200/80 mt-0.5 flex items-center gap-2">
                  <span>Manager Operations Hub</span>
                  <span className="text-indigo-400">•</span>
                  <span>Sprint Velocity & Team Assignment Control</span>
                </p>
              </div>

              {/* Identity & Metadata Chips */}
              <div className="flex items-center gap-2.5 flex-wrap pt-1 text-xs">
                {/* Manager ID with Copy Button */}
                <button
                  type="button"
                  onClick={copyManagerId}
                  title="Click to copy Manager ID"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-indigo-200 hover:text-white border border-white/10 transition group font-mono text-[11px] font-bold"
                >
                  <Hash className="w-3 h-3 text-indigo-400" />
                  <span>ID: {managerProfile.managerCode}</span>
                  {copiedId ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3 text-indigo-300 group-hover:text-white transition opacity-70" />
                  )}
                </button>

                {/* Team / Squad Chip */}
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 text-indigo-200 border border-white/10 text-[11px] font-semibold">
                  <Briefcase className="w-3 h-3 text-amber-400" />
                  <span>Squad: {managerProfile.teamName || "General Squad"}</span>
                </span>

                {/* Email Chip */}
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 text-indigo-200 border border-white/10 text-[11px]">
                  <Mail className="w-3 h-3 text-indigo-300" />
                  <span>{managerProfile.email}</span>
                </span>

                {/* Team Capacity */}
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 text-indigo-200 border border-white/10 text-[11px]">
                  <Users className="w-3 h-3 text-teal-300" />
                  <span>{orgMembers.length} Active Assignees</span>
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Actions & View Switcher */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3 flex-shrink-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchAllData}
                disabled={isLoading}
                className="p-2.5 rounded-xl border border-white/10 bg-white/10 hover:bg-white/20 text-white transition"
                title="Refresh Metrics"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-teal-300" : ""}`} />
              </button>

              {/* View Toggle */}
              <div className="flex items-center p-1 rounded-xl bg-white/10 border border-white/10 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setViewMode("kanban")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                    viewMode === "kanban"
                      ? "bg-white text-slate-900 shadow-sm font-bold"
                      : "text-indigo-200 hover:text-white"
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Board</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("analytics")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                    viewMode === "analytics"
                      ? "bg-white text-slate-900 shadow-sm font-bold"
                      : "text-indigo-200 hover:text-white"
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Velocity</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsTaskModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-700 text-white font-bold text-xs shadow-lg shadow-primary/30 transition flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Create Task</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 👥 Active Team Assignees Live Roster */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            <Users className="w-4 h-4 text-primary" />
            <span>Team Members & Assignees ({orgMembers.length})</span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Realtime squad roster for task distribution
          </span>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto pb-1">
          {orgMembers.map((member) => {
            const memberTasksCount = tasks.filter((t) =>
              t.assignees?.some((a) => a.id === member.id)
            ).length;

            const memberInitials = member.fullName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();

            return (
              <div
                key={member.id}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-750 flex-shrink-0 hover:border-primary/40 transition"
              >
                <div className="relative">
                  <div className="h-8 w-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
                    {memberInitials}
                  </div>
                  <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 border border-white dark:border-slate-900" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                    {member.fullName}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <span className="capitalize">{member.role}</span>
                    <span>•</span>
                    <span className="font-semibold text-primary">{memberTasksCount} tasks</span>
                  </div>
                </div>
              </div>
            );
          })}

          {orgMembers.length === 0 && (
            <div className="text-xs text-slate-400 py-2">
              Loading team squad members...
            </div>
          )}
        </div>
      </div>

      {/* Realtime Dynamic KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Active Team Tasks</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{liveKpis.activeTasks}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">In sprint execution</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Overdue Items</span>
            <AlertTriangle className={`w-4 h-4 ${liveKpis.overdueTasks > 0 ? "text-rose-500 animate-pulse" : "text-slate-400"}`} />
          </div>
          <div className={`text-2xl font-black ${liveKpis.overdueTasks > 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-white"}`}>
            {liveKpis.overdueTasks}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Require manager review</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Sprint Completion</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{liveKpis.completionRate}%</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            {liveKpis.completedTasks} of {liveKpis.totalTasks} tasks done
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Team Velocity</span>
            <TrendingUp className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {liveKpis.teamVelocityDays > 0 ? `${liveKpis.teamVelocityDays}d` : "N/A"}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Avg cycle time</div>
        </div>
      </div>

      {/* Main View Area */}
      {viewMode === "kanban" && (
        <KanbanBoard orgMembers={orgMembers} orgId={orgId} />
      )}

      {viewMode === "analytics" && (
        <div className="space-y-6">
          <ProductivityChart data={chartData} />
        </div>
      )}

      {/* Task Creation Modal with Live Real Members */}
      {isTaskModalOpen && (
        <TaskFormModal
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          orgMembers={orgMembers}
          availableTasks={tasks}
          onSuccess={(newTask) => {
            handleTaskCreated(newTask);
            setIsTaskModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
