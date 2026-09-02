"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Clock, Calendar, CheckCircle2, AlertTriangle, CheckSquare,
  Search, Zap, ChevronRight, Sun, Moon, Sunset, Sparkles,
  Hash, Copy, Check, Briefcase, Circle, Play, Eye,
} from "lucide-react";
import { TaskDetail } from "@/components/tasks/TaskDetail";
import { type KanbanTaskItem } from "@/components/tasks/TaskCard";
import { captureEvent } from "@/lib/analytics/posthog";
import { createClient } from "@/lib/supabase/client";
import { useAutoRefresh, AutoRefreshBadge } from "@/components/ui/AutoRefreshControl";

const PRIORITY_CONFIG: Record<string, { label: string; dot: string; bg: string; text: string; border: string }> = {
  urgent: { label: "URGENT", dot: "bg-red-500",    bg: "bg-red-500/10",    text: "text-red-500",    border: "border-red-500/25" },
  high:   { label: "HIGH",   dot: "bg-orange-400", bg: "bg-orange-400/10", text: "text-orange-400", border: "border-orange-400/25" },
  medium: { label: "MED",    dot: "bg-amber-400",  bg: "bg-amber-400/10",  text: "text-amber-400",  border: "border-amber-400/25" },
  low:    { label: "LOW",    dot: "bg-slate-400",  bg: "bg-slate-400/10",  text: "text-slate-400",  border: "border-slate-400/25" },
};

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  pending:     { label: "Pending",     icon: Circle,       color: "text-slate-400",   bg: "bg-slate-800" },
  in_progress: { label: "In Progress", icon: Play,         color: "text-blue-400",    bg: "bg-blue-500/15" },
  in_review:   { label: "In Review",   icon: Eye,          color: "text-purple-400",  bg: "bg-purple-500/15" },
  completed:   { label: "Completed",   icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/15" },
};

function ProgressRing({ pct, size = 56 }: { pct: number; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="currentColor" strokeWidth={4} className="text-slate-700" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="currentColor" strokeWidth={4} strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        className={pct >= 100 ? "text-emerald-400" : pct >= 60 ? "text-blue-400" : "text-amber-400"}
        style={{ transition: "stroke-dasharray 0.6s ease" }} />
    </svg>
  );
}

interface TaskRowProps {
  task: KanbanTaskItem;
  onOpen: () => void;
  onStatusChange: (s: "pending" | "in_progress" | "in_review" | "completed") => void;
}
function TaskRow({ task, onOpen, onStatusChange }: TaskRowProps) {
  const p = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.medium;
  const s = STATUS_CONFIG[task.status] ?? STATUS_CONFIG.pending;
  const StatusIcon = s.icon;
  const raw = task.dueDate || task.due_date;
  const isOverdue = raw && task.status !== "completed" && new Date(raw).getTime() < Date.now();
  const isCompleted = task.status === "completed";
  const subtasks = task.subtasks || [];
  const doneSubs = subtasks.filter((x: any) => x.completed).length;

  return (
    <div
      className={`group relative flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all duration-150 cursor-pointer ${
        isCompleted ? "bg-slate-900/40 border-slate-800/60 opacity-60 hover:opacity-80"
                    : "bg-slate-900 border-slate-800 hover:border-slate-600 hover:bg-slate-800/70"}`}
      onClick={onOpen}
    >
      <div className={`absolute left-0 top-3 bottom-3 w-0.5 rounded-full ${p.dot}`} />
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onStatusChange(isCompleted ? "in_progress" : "completed"); }}
        className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
          isCompleted ? "border-emerald-500 bg-emerald-500" : "border-slate-600 hover:border-emerald-500"}`}
      >
        {isCompleted && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md border ${p.bg} ${p.text} ${p.border}`}>{p.label}</span>
          {isOverdue && <span className="text-[10px] font-black text-red-400 flex items-center gap-0.5"><AlertTriangle className="w-3 h-3" />OVERDUE</span>}
          {subtasks.length > 0 && <span className="text-[10px] text-slate-500 flex items-center gap-0.5"><CheckSquare className="w-3 h-3" />{doneSubs}/{subtasks.length}</span>}
          {task.tags?.slice(0, 2).map((t: string) => (
            <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700">#{t}</span>
          ))}
        </div>
        <p className={`text-sm font-semibold truncate ${isCompleted ? "line-through text-slate-500" : "text-slate-100"}`}>{task.title}</p>
        {raw && (
          <div className="flex items-center gap-1 mt-0.5 text-[11px] text-slate-500">
            <Clock className="w-3 h-3" />
            <span className={isOverdue ? "text-red-400 font-semibold" : ""}>
              {new Date(raw).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
            </span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold ${s.bg} ${s.color}`}>
          <StatusIcon className="w-3.5 h-3.5" />{s.label}
        </div>
        <select
          value={task.status}
          onChange={(e) => onStatusChange(e.target.value as any)}
          className="text-[11px] font-bold rounded-lg border border-slate-700 bg-slate-800 text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer px-2 py-1"
        >
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="in_review">In Review</option>
          <option value="completed">Done</option>
        </select>
        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition" />
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, label, count, color }: { icon: any; label: string; count: number; color: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className={`w-4 h-4 ${color}`} />
      <span className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</span>
      <span className="text-xs font-black px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">{count}</span>
      <div className="flex-1 h-px bg-slate-800" />
    </div>
  );
}

function EmptyState({ emoji, title, sub }: { emoji: string; title: string; sub: string }) {
  return (
    <div className="py-8 flex flex-col items-center gap-2 text-center border border-dashed border-slate-800 rounded-xl">
      <span className="text-3xl">{emoji}</span>
      <p className="text-sm font-bold text-slate-300">{title}</p>
      <p className="text-xs text-slate-500 max-w-xs">{sub}</p>
    </div>
  );
}

export default function EmployeeDashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedTask, setSelectedTask] = useState<KanbanTaskItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [copiedId, setCopiedId] = useState(false);

  const [employeeProfile, setEmployeeProfile] = useState({
    id: "", employeeCode: "EMP-0001", fullName: "Employee",
    email: "employee@workspace.com", role: "employee",
    teamId: null as string | null, teamName: "General Squad",
    avatarUrl: null as string | null, joinedAt: "",
  });

  const [buckets, setBuckets] = useState<{
    dueToday: KanbanTaskItem[]; upcoming: KanbanTaskItem[]; recentlyCompleted: KanbanTaskItem[];
  }>({ dueToday: [], upcoming: [], recentlyCompleted: [] });

  const [greeting, setGreeting] = useState<{ text: string; icon: any; color: string }>({ text: "Welcome", icon: Sparkles, color: "text-amber-400" });

  useEffect(() => {
    const h = new Date().getHours();
    if (h < 12) setGreeting({ text: "Good Morning", icon: Sun, color: "text-amber-400" });
    else if (h < 18) setGreeting({ text: "Good Afternoon", icon: Sunset, color: "text-orange-400" });
    else setGreeting({ text: "Good Evening", icon: Moon, color: "text-indigo-400" });
  }, []);

  const showToast = (msg: string) => { setToastMessage(msg); setTimeout(() => setToastMessage(null), 5000); };

  const fetchMyTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/dashboard/me");
      const json = await res.json();
      if (json.success && json.data) {
        if (json.data.profile) setEmployeeProfile(json.data.profile);
        setBuckets({ dueToday: json.data.dueToday || [], upcoming: json.data.upcoming || [], recentlyCompleted: json.data.recentlyCompleted || [] });
      }
    } catch { } finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchMyTasks(); }, [fetchMyTasks]);
  const { isRefreshing, triggerManual } = useAutoRefresh(fetchMyTasks);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    if (!url || url.includes("your-project-ref")) { setIsConnected(true); return; }
    let channel: any = null;
    try {
      const sb = createClient();
      channel = sb.channel(`rt:emp:${Math.random().toString(36).slice(2, 8)}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, () => fetchMyTasks())
        .subscribe((s: any) => setIsConnected(s === "SUBSCRIBED"));
    } catch { }
    return () => { if (channel) createClient().removeChannel(channel); };
  }, [fetchMyTasks]);

  const handleStatusChange = async (task: KanbanTaskItem, newStatus: "pending" | "in_progress" | "in_review" | "completed") => {
    if (task.status === newStatus) return;
    if (newStatus === "in_progress" || newStatus === "completed") {
      const all = [...buckets.dueToday, ...buckets.upcoming, ...buckets.recentlyCompleted];
      const blockers = all.filter((t) => (task.dependencyTaskIds || []).includes(t.id) && t.status !== "completed");
      if (blockers.length > 0) { showToast(`Blocked by: "${blockers[0]?.title}"`); return; }
    }
    const updated = { ...task, status: newStatus };
    setBuckets((prev) => {
      const out = (list: KanbanTaskItem[]) => list.filter((t) => t.id !== task.id);
      const dt = out(prev.dueToday), up = out(prev.upcoming), rc = out(prev.recentlyCompleted);
      if (newStatus === "completed") return { dueToday: dt, upcoming: up, recentlyCompleted: [updated, ...rc] };
      const due = task.dueDate || task.due_date;
      const today = due && new Date(due).toDateString() === new Date().toDateString();
      return today ? { dueToday: [updated, ...dt], upcoming: up, recentlyCompleted: rc }
                   : { dueToday: dt, upcoming: [updated, ...up], recentlyCompleted: rc };
    });
    captureEvent("task_status_changed", { taskId: task.id, oldStatus: task.status, newStatus });
    try {
      const r = await fetch(`/api/v1/tasks/${task.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus }) });
      const j = await r.json();
      if (!j.success) { showToast(j.error || "Update failed."); fetchMyTasks(); }
    } catch { showToast("Network error."); fetchMyTasks(); }
  };

  const openTask = (task: KanbanTaskItem) => { setSelectedTask(task); setIsDetailOpen(true); };

  const allTasks = useMemo(() => [...buckets.dueToday, ...buckets.upcoming, ...buckets.recentlyCompleted], [buckets]);
  const total = allTasks.length;
  const completed = buckets.recentlyCompleted.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const inProg = allTasks.filter((t) => t.status === "in_progress").length;
  const inReview = allTasks.filter((t) => t.status === "in_review").length;
  const overdue = allTasks.filter((t) => { const d = t.dueDate || t.due_date; return d && t.status !== "completed" && new Date(d).getTime() < Date.now(); }).length;

  const applyFilters = (list: KanbanTaskItem[]) => list.filter((t) => {
    const q = searchQuery.toLowerCase();
    return (!q || t.title.toLowerCase().includes(q) || (t.description || "").toLowerCase().includes(q))
      && (priorityFilter === "all" || t.priority === priorityFilter)
      && (statusFilter === "all" || t.status === statusFilter);
  });

  const filteredDueToday = applyFilters(buckets.dueToday);
  const filteredUpcoming = applyFilters(buckets.upcoming);
  const filteredCompleted = applyFilters(buckets.recentlyCompleted);

  const GreetingIcon = greeting.icon;
  const initials = (employeeProfile.fullName.split(" ").map((n: string) => n[0]).join("").slice(0, 2) || "EM").toUpperCase();

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-5 pb-16">
      {toastMessage && (
        <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-4 font-bold">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center text-white font-black text-base shadow-lg shadow-blue-600/20">
              {initials}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <GreetingIcon className={`w-3.5 h-3.5 ${greeting.color}`} />
              <span className="text-xs text-slate-400 dark:text-slate-500">{greeting.text}</span>
            </div>
            <div className="text-base font-black text-slate-900 dark:text-white">{employeeProfile.fullName}</div>
            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
              <Briefcase className="w-3 h-3 text-amber-500" />
              <span>{employeeProfile.teamName}</span>
              <span className="text-slate-300 dark:text-slate-700">·</span>
              <span>{employeeProfile.email}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-lg border ${
            isConnected ? "text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8"
                        : "text-slate-400 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-emerald-400 animate-pulse" : "bg-slate-400"}`} />
            {isConnected ? "Live" : "Offline"}
          </span>
          <button
            onClick={() => { navigator.clipboard.writeText(employeeProfile.employeeCode); setCopiedId(true); setTimeout(() => setCopiedId(false), 2000); }}
            className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition"
          >
            <Hash className="w-3 h-3 text-blue-500" />
            {employeeProfile.employeeCode}
            {copiedId ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
          </button>
          <AutoRefreshBadge isRefreshing={isRefreshing || isLoading} triggerManual={triggerManual} />
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="col-span-2 sm:col-span-1 flex items-center gap-4 px-4 py-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="relative flex-shrink-0">
            <ProgressRing pct={pct} size={56} />
            <span className="absolute inset-0 flex items-center justify-center text-[11px] font-black text-slate-900 dark:text-white">{pct}%</span>
          </div>
          <div>
            <div className="text-xs text-slate-400 font-semibold">Progress</div>
            <div className="text-lg font-black text-slate-900 dark:text-white">{completed}<span className="text-slate-400 text-sm font-bold">/{total}</span></div>
            <div className="text-[10px] text-slate-400">Tasks done</div>
          </div>
        </div>
        {[
          { label: "In Progress", value: inProg,   icon: Zap,           color: "text-blue-500   dark:text-blue-400",   bg: "bg-blue-50   dark:bg-blue-500/10",   border: "border-blue-100   dark:border-blue-500/15"   },
          { label: "In Review",   value: inReview, icon: Eye,           color: "text-purple-500 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-500/10", border: "border-purple-100 dark:border-purple-500/15" },
          { label: "Overdue",     value: overdue,  icon: AlertTriangle, color: overdue > 0 ? "text-red-500 dark:text-red-400" : "text-slate-400", bg: overdue > 0 ? "bg-red-50 dark:bg-red-500/10" : "bg-slate-50 dark:bg-slate-800/60", border: overdue > 0 ? "border-red-100 dark:border-red-500/20" : "border-slate-200 dark:border-slate-800" },
        ].map((s) => (
          <div key={s.label} className={`flex items-center gap-3 px-4 py-4 rounded-2xl border ${s.bg} ${s.border}`}>
            <s.icon className={`w-5 h-5 ${s.color} flex-shrink-0`} />
            <div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">{s.value}</div>
              <div className={`text-[10px] font-semibold ${s.color}`}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input type="text" placeholder="Search tasks…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition" />
        </div>
        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}
          className="text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 focus:outline-none cursor-pointer font-medium">
          <option value="all">All Priority</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 focus:outline-none cursor-pointer font-medium">
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="in_review">In Review</option>
          <option value="completed">Completed</option>
        </select>
        <div className="ml-auto text-[11px] text-slate-400 font-medium">{total} tasks</div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-2.5 animate-pulse">
          {[...Array(5)].map((_, i) => <div key={i} className="h-[68px] rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800" />)}
        </div>
      )}

      {!isLoading && (
        <>
          <div>
            <SectionHeader icon={Clock} label="Due Today" count={filteredDueToday.length} color="text-red-500 dark:text-red-400" />
            <div className="space-y-2">
              {filteredDueToday.map((task) => <TaskRow key={task.id} task={task} onOpen={() => openTask(task)} onStatusChange={(s) => handleStatusChange(task, s)} />)}
              {filteredDueToday.length === 0 && <EmptyState emoji="🎉" title="All clear for today!" sub="No tasks due today. Keep up the great work!" />}
            </div>
          </div>

          <div>
            <SectionHeader icon={Calendar} label="Upcoming — Next 7 Days" count={filteredUpcoming.length} color="text-blue-500 dark:text-blue-400" />
            <div className="space-y-2">
              {filteredUpcoming.map((task) => <TaskRow key={task.id} task={task} onOpen={() => openTask(task)} onStatusChange={(s) => handleStatusChange(task, s)} />)}
              {filteredUpcoming.length === 0 && <EmptyState emoji="📅" title="No upcoming tasks" sub="Your next 7 days are clear." />}
            </div>
          </div>

          <div>
            <SectionHeader icon={CheckCircle2} label="Completed" count={filteredCompleted.length} color="text-emerald-500 dark:text-emerald-400" />
            <div className="space-y-2">
              {filteredCompleted.map((task) => <TaskRow key={task.id} task={task} onOpen={() => openTask(task)} onStatusChange={(s) => handleStatusChange(task, s)} />)}
              {filteredCompleted.length === 0 && <EmptyState emoji="⚡" title="No completed tasks yet" sub="Mark tasks as done to see them here." />}
            </div>
          </div>
        </>
      )}

      <TaskDetail
        isOpen={isDetailOpen}
        onClose={() => { setIsDetailOpen(false); setSelectedTask(null); }}
        task={selectedTask}
        allTasks={allTasks}
      />
    </div>
  );
}
