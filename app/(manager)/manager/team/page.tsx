"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Users,
  UserPlus,
  Search,
  Trash2,
  Check,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Radio,
  ShieldAlert,
  UserCircle,
  Hash,
  Mail,
  Calendar,
  Lock,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { createClient } from "@/lib/supabase/client";
import { useAutoRefresh, AutoRefreshBadge } from "@/components/ui/AutoRefreshControl";

interface EmployeeMember {
  id: string;
  fullName: string;
  email: string | null;
  role: "admin" | "manager" | "employee";
  teamId?: string | null;
  teamName?: string | null;
  avatarUrl?: string | null;
  createdAt?: string;
}

export default function ManagerTeamPage() {
  const [members, setMembers] = useState<EmployeeMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Add modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [creationMode, setCreationMode] = useState<"direct" | "invite">("direct");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Credentials after creation
  const [createdCredentials, setCreatedCredentials] = useState<{
    fullName: string;
    email: string;
    password?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Delete state
  const [deletingMember, setDeletingMember] = useState<EmployeeMember | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch only employees
  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/org/members");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const allMembers: EmployeeMember[] = json.data.map((m: any) => ({
          id: m.id || m.user_id,
          fullName: m.fullName || m.full_name || "Team Member",
          email: m.email || null,
          role: m.role || "employee",
          teamId: m.teamId || m.team_id || null,
          teamName: m.teamName || m.team_name || "General",
          avatarUrl: m.avatarUrl || m.avatar_url || null,
          createdAt: m.createdAt || m.created_at,
        }));
        // Manager can ONLY see employees
        setMembers(allMembers.filter((m) => m.role === "employee"));
      }
    } catch {
      showToast("Failed to fetch team members.", "error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const { isRefreshing, triggerManual } = useAutoRefresh(fetchMembers);

  // Realtime subscription
  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const hasSupabase = Boolean(supabaseUrl) && !supabaseUrl.includes("your-project-ref");
    if (!hasSupabase) { setIsConnected(true); return; }

    let channel: any = null;
    try {
      const supabase = createClient();
      channel = supabase
        .channel(`realtime:manager_team:${Math.random().toString(36).slice(2, 8)}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => fetchMembers())
        .subscribe((status) => setIsConnected(status === "SUBSCRIBED"));
    } catch (e) {
      console.warn("Realtime connection error:", e);
    }
    return () => { if (channel) createClient().removeChannel(channel); };
  }, [fetchMembers]);

  // Filtered list
  const filteredMembers = useMemo(() =>
    members.filter((m) => {
      const q = searchQuery.toLowerCase();
      return m.fullName.toLowerCase().includes(q) || (m.email && m.email.toLowerCase().includes(q));
    }),
    [members, searchQuery]
  );

  const unassignedEmployees = members.filter((m) => !m.teamId || m.teamName === "Unassigned" || !m.teamName);

  // Add Employee
  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!fullName.trim()) { setErrorMessage("Full name is required."); return; }
    if (!email.trim() || !email.includes("@")) { setErrorMessage("Enter a valid email address."); return; }
    if (creationMode === "direct" && (!password || password.length < 6)) {
      setErrorMessage("Password must be at least 6 characters."); return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/v1/org/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          password: creationMode === "direct" ? password : undefined,
          role: "employee", // Managers can only add employees
          teamName: "General",
        }),
      });

      let data: any = {};
      try { data = await res.json(); } catch { throw new Error(`Server error (${res.status})`); }
      if (!res.ok || !data.success) throw new Error(data.error || data.message || "Failed to add employee.");

      if (creationMode === "direct") {
        setCreatedCredentials({ fullName: fullName.trim(), email: email.trim().toLowerCase(), password });
      } else {
        setIsAddModalOpen(false);
        showToast(`Invite sent to ${email}`);
      }
      setFullName(""); setEmail(""); setPassword("");
      fetchMembers();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to create employee account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Team reassignment (can change team, not role)
  const handleTeamChange = async (userId: string, newTeamName: string) => {
    try {
      const res = await fetch(`/api/v1/org/members/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamName: newTeamName }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to update team.");
      setMembers((prev) => prev.map((m) => m.id === userId ? { ...m, teamName: newTeamName } : m));
      showToast(`Assigned to team "${newTeamName}".`);
    } catch (err: any) {
      showToast(err.message || "Failed to update team.", "error");
    }
  };

  // Remove employee
  const handleDeleteMember = async () => {
    if (!deletingMember) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/v1/org/members/${deletingMember.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to remove employee.");
      setMembers((prev) => prev.filter((m) => m.id !== deletingMember.id));
      showToast(`${deletingMember.fullName} removed from workspace.`);
      setDeletingMember(null);
    } catch (err: any) {
      showToast(err.message || "Failed to remove employee.", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const copyCredentialsText = () => {
    if (!createdCredentials) return;
    const text = `🎉 You've been added to TASQ-ONE Work OS!\n\nLogin URL: ${window.location.origin}/login\nEmail: ${createdCredentials.email}\nPassword: ${createdCredentials.password}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const initials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-bottom-2 ${
          toast.type === "success"
            ? "bg-emerald-950/90 text-emerald-300 border-emerald-500/30"
            : "bg-rose-950/90 text-rose-300 border-rose-500/30"
        }`}>
          {toast.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              My Team
            </h1>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border transition-all ${
              isConnected
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
            }`}>
              <Radio className={`w-3 h-3 ${isConnected ? "animate-pulse text-emerald-500" : "text-amber-500"}`} />
              {isConnected ? "Live Sync" : "Connecting…"}
            </span>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/20">
              {members.length} Employee{members.length !== 1 ? "s" : ""}
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            View and manage employees on your team. Only employees are shown here — no managers or admins.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Manual Refresh */}
          <AutoRefreshBadge
            isRefreshing={isRefreshing || isLoading}
            triggerManual={triggerManual}
          />

          <Button
            onClick={() => { setCreatedCredentials(null); setErrorMessage(null); setIsAddModalOpen(true); }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-br from-primary to-violet-600 text-white text-xs font-bold shadow-md shadow-primary/25 hover:scale-[1.02] transition-all"
          >
            <UserPlus className="w-4 h-4" />
            Add Employee
          </Button>
        </div>
      </div>

      {/* Unassigned warning */}
      {unassignedEmployees.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center flex-shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-900 dark:text-amber-300">
                {unassignedEmployees.length} Employee{unassignedEmployees.length > 1 ? "s" : ""} Without Team Assignment
              </div>
              <div className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                Unassigned employees won&apos;t appear in sprint boards. Click to auto-assign to General.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => unassignedEmployees.forEach((m) => handleTeamChange(m.id, "General"))}
            className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition flex-shrink-0"
          >
            Auto-Assign to &quot;General&quot;
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="col-span-2 sm:col-span-1 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Employees</div>
          <div className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">{members.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">Access to /employee/dashboard</div>
        </div>
        <div className="p-5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-500/20 shadow-sm">
          <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Assigned</div>
          <div className="mt-2 text-3xl font-extrabold text-emerald-700 dark:text-emerald-400">
            {members.filter((m) => m.teamId && m.teamName && m.teamName !== "Unassigned").length}
          </div>
          <div className="text-[11px] text-emerald-600/70 dark:text-emerald-500 mt-1">To a team</div>
        </div>
        <div className="p-5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-500/20 shadow-sm">
          <div className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Unassigned</div>
          <div className="mt-2 text-3xl font-extrabold text-amber-700 dark:text-amber-400">{unassignedEmployees.length}</div>
          <div className="text-[11px] text-amber-600/70 dark:text-amber-500 mt-1">Needs team</div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search employee by name or email…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 transition shadow-sm"
        />
      </div>

      {/* Employee Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="px-6 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30 grid grid-cols-[2fr_2fr_1.5fr_1fr_auto] gap-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          <span>Member</span>
          <span>Email</span>
          <span>Assigned Team</span>
          <span>Route</span>
          <span className="text-right">Actions</span>
        </div>

        {isLoading ? (
          <div className="py-20 text-center">
            <RefreshCw className="w-6 h-6 animate-spin text-primary mx-auto mb-3" />
            <p className="text-xs text-slate-400">Loading employees…</p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="py-20 text-center">
            <UserCircle className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-500">
              {members.length === 0 ? "No employees in your workspace yet." : "No employees match your search."}
            </p>
            {members.length === 0 && (
              <p className="text-xs text-slate-400 mt-1">Click &quot;Add Employee&quot; to onboard your first team member.</p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredMembers.map((member, idx) => (
              <div
                key={member.id}
                className="group px-6 py-4 grid grid-cols-[2fr_2fr_1.5fr_1fr_auto] gap-4 items-center hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition text-sm"
              >
                {/* Name + Avatar */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary/20 to-violet-500/20 text-primary font-extrabold flex items-center justify-center text-xs flex-shrink-0 border border-primary/15">
                    {initials(member.fullName)}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 dark:text-white truncate text-[13px]">
                      {member.fullName}
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Hash className="w-2.5 h-2.5" />
                      {member.id?.slice(0, 8)}
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-center gap-1.5 text-[12px] text-slate-500 dark:text-slate-400 truncate">
                  <Mail className="w-3 h-3 flex-shrink-0 text-slate-300" />
                  <span className="truncate">{member.email || "—"}</span>
                </div>

                {/* Team Assignment */}
                <div>
                  <select
                    value={member.teamName || "General"}
                    onChange={(e) => handleTeamChange(member.id, e.target.value)}
                    className="text-[11px] font-semibold rounded-lg px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer transition w-full"
                  >
                    <option value="General">General</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Design">Design</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Sales">Sales</option>
                    <option value="Operations">Operations</option>
                    <option value="Product">Product</option>
                    <option value="QA">QA</option>
                  </select>
                </div>

                {/* Route */}
                <div>
                  <code className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-mono border border-emerald-200/60 dark:border-emerald-500/20">
                    /employee
                  </code>
                </div>

                {/* Actions */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setDeletingMember(member)}
                    title="Remove employee"
                    className="p-2 rounded-xl text-slate-300 hover:text-rose-600 hover:bg-rose-500/10 dark:hover:bg-rose-500/10 transition opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        {filteredMembers.length > 0 && (
          <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Showing {filteredMembers.length} of {members.length} employees</span>
            <span className="flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Managers & Admins are hidden
            </span>
          </div>
        )}
      </div>

      {/* ── Add Employee Modal ── */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => { setIsAddModalOpen(false); setCreatedCredentials(null); }}
        title={createdCredentials ? "Employee Added ✓" : "Add New Employee"}
        description={
          createdCredentials
            ? "Share these login credentials with your new team member."
            : "Create a new employee account under your workspace."
        }
      >
        {createdCredentials ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2.5">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4" /> Account Created Successfully!
              </div>
              <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                <div><span className="font-semibold text-slate-500">Name: </span>{createdCredentials.fullName}</div>
                <div>
                  <span className="font-semibold text-slate-500">Email: </span>
                  <code className="font-mono bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded">{createdCredentials.email}</code>
                </div>
                {createdCredentials.password && (
                  <div>
                    <span className="font-semibold text-slate-500">Password: </span>
                    <code className="font-mono bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded font-bold text-primary">{createdCredentials.password}</code>
                  </div>
                )}
                <div><span className="font-semibold text-slate-500">Role: </span><span className="font-bold text-emerald-600">Employee</span></div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={copyCredentialsText} className="flex-1 flex items-center justify-center gap-2 text-xs font-semibold">
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied!" : "Copy Credentials"}
              </Button>
              <Button type="button" onClick={() => { setIsAddModalOpen(false); setCreatedCredentials(null); }} className="flex-1 bg-primary hover:bg-primary/90 text-white text-xs font-semibold">
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleAddEmployee} className="space-y-4">
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Mode toggle */}
            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 gap-1">
              {(["direct", "invite"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setCreationMode(mode)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
                    creationMode === mode
                      ? "bg-white dark:bg-slate-900 text-primary shadow-sm"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  {mode === "direct" ? "Direct Credentials" : "Send Invite Link"}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Full Name *</label>
              <Input placeholder="e.g. Rahul Sharma" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="text-xs" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Work Email *</label>
              <Input type="email" placeholder="e.g. rahul@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="text-xs" />
            </div>

            {creationMode === "direct" && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Temporary Password *</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="text-xs pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-primary" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Employee will use these credentials to sign in at /login.</p>
              </div>
            )}

            {/* Role is fixed — employee only */}
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-500/20 flex items-center gap-2.5">
              <Users className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <div>
                <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Role: Employee</div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-500">Task execution · Access to /employee/dashboard</div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-primary to-violet-600 text-white text-xs font-bold py-2.5 hover:opacity-90 transition flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Creating Account…</>
              ) : (
                <><UserPlus className="w-3.5 h-3.5" /> {creationMode === "direct" ? "Create Employee Account" : "Send Invite"}</>
              )}
            </Button>
          </form>
        )}
      </Modal>

      {/* ── Delete Confirmation Modal ── */}
      <Modal
        isOpen={Boolean(deletingMember)}
        onClose={() => setDeletingMember(null)}
        title="Remove Employee"
        description={`This will permanently remove ${deletingMember?.fullName} from the workspace. Their tasks will remain but become unassigned.`}
      >
        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={() => setDeletingMember(null)} className="flex-1 text-xs font-semibold">
            Cancel
          </Button>
          <Button
            onClick={handleDeleteMember}
            disabled={isDeleting}
            className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center justify-center gap-2"
          >
            {isDeleting ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Removing…</> : <><Trash2 className="w-3.5 h-3.5" /> Remove Employee</>}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
