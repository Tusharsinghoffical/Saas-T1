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
import { createClient } from "@/infrastructure/supabase/supabaseClient";
import {
  useAutoRefresh,
  AutoRefreshBadge,
} from "@/components/ui/AutoRefreshControl";
import { MemberIdBadge } from "@/components/ui/MemberIdBadge";
import { matchesMemberSearch, formatMemberCode } from "@/lib/memberId";

interface EmployeeMember {
  id: string;
  fullName: string;
  email: string | null;
  role: "admin" | "manager" | "employee";
  position?: string | null;
  phoneNumber?: string | null;
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
  const [creationMode, setCreationMode] = useState<"direct" | "invite">(
    "direct"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Credentials after creation
  const [createdCredentials, setCreatedCredentials] = useState<{
    id?: string;
    fullName: string;
    email: string;
    password?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Delete state
  const [deletingMember, setDeletingMember] = useState<EmployeeMember | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const showToast = (
    message: string,
    type: "success" | "error" = "success"
  ) => {
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
          position: m.position || null,
          phoneNumber: m.phoneNumber || m.phone_number || null,
          teamId: m.teamId || m.team_id || null,
          teamName: m.teamName || m.team_name || "General",
          avatarUrl: m.avatarUrl || m.avatar_url || null,
          createdAt: m.createdAt || m.created_at,
        }));
        // Manager can ONLY see employees
        setMembers(allMembers.filter((m) => m.role === "employee"));
      } else {
        showToast(
          json.error || "Failed to load members. Check server logs.",
          "error"
        );
      }
    } catch (err: any) {
      showToast(
        "Network error: " + (err?.message || "Could not reach server."),
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial data load on mount
  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const { isRefreshing, triggerManual } = useAutoRefresh(fetchMembers);

  // Realtime subscription
  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const hasSupabase =
      Boolean(supabaseUrl) && !supabaseUrl.includes("your-project-ref");
    if (!hasSupabase) {
      setIsConnected(true);
      return;
    }

    let channel: any = null;
    try {
      const supabase = createClient();
      channel = supabase
        .channel(
          `realtime:manager_team:${Math.random().toString(36).slice(2, 8)}`
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "profiles" },
          () => fetchMembers()
        )
        .subscribe((status) => setIsConnected(status === "SUBSCRIBED"));
    } catch (e) {
      console.warn("Realtime connection error:", e);
    }
    // Cross-tab broadcast listener for profile/position updates
    let profileBc: BroadcastChannel | null = null;
    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        profileBc = new BroadcastChannel("tasq-profile-channel");
        profileBc.onmessage = () => {
          fetchMembers();
        };
      }
    } catch {}

    return () => {
      if (profileBc) profileBc.close();
      if (channel) {
        const supabase = createClient();
        supabase.removeChannel(channel);
      }
    };
  }, [fetchMembers]);

  // Filtered list with ID, Member Code, Name, and Email search support
  const filteredMembers = useMemo(
    () => members.filter((m) => matchesMemberSearch(m, searchQuery)),
    [members, searchQuery]
  );

  const unassignedEmployees = members.filter(
    (m) => !m.teamId || m.teamName === "Unassigned" || !m.teamName
  );

  // Add Employee
  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!fullName.trim()) {
      setErrorMessage("Full name is required.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setErrorMessage("Enter a valid email address.");
      return;
    }
    if (creationMode === "direct" && (!password || password.length < 6)) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
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
      try {
        data = await res.json();
      } catch {
        throw new Error(`Server error (${res.status})`);
      }
      if (!res.ok || !data.success)
        throw new Error(
          data.error || data.message || "Failed to add employee."
        );

      if (creationMode === "direct") {
        setCreatedCredentials({
          id: data.profile?.id || data.user?.id,
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          password,
        });
      } else {
        setIsAddModalOpen(false);
        showToast(`Invite sent to ${email}`);
      }
      setFullName("");
      setEmail("");
      setPassword("");
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
      if (!res.ok || !data.success)
        throw new Error(data.message || "Failed to update team.");
      setMembers((prev) =>
        prev.map((m) => (m.id === userId ? { ...m, teamName: newTeamName } : m))
      );
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
      const res = await fetch(`/api/v1/org/members/${deletingMember.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.message || "Failed to remove employee.");
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
    const memberCode = formatMemberCode(createdCredentials.id, "employee");
    const text = `🎉 You've been added to TASQ-ONE Work OS!\n\nEmployee ID: ${memberCode} (${createdCredentials.id || "N/A"})\nLogin URL: ${window.location.origin}/login\nEmail: ${createdCredentials.email}\nPassword: ${createdCredentials.password}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const initials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`animate-in slide-in-from-bottom-2 fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border px-4 py-3 text-xs font-semibold shadow-lg ${
            toast.type === "success"
              ? "border-emerald-500/30 bg-emerald-950/90 text-emerald-300"
              : "border-rose-500/30 bg-rose-950/90 text-rose-300"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-400" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              My Team
            </h1>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold transition-all ${
                isConnected
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                  : "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400"
              }`}
            >
              <Radio
                className={`h-3 w-3 ${isConnected ? "animate-pulse text-emerald-500" : "text-amber-500"}`}
              />
              {isConnected ? "Live Sync" : "Connecting…"}
            </span>
            <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">
              {members.length} Employee{members.length !== 1 ? "s" : ""}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            View and manage employees on your team. Only employees are shown
            here — no managers or admins.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Manual Refresh */}
          <AutoRefreshBadge
            isRefreshing={isRefreshing || isLoading}
            triggerManual={triggerManual}
          />

          <Button
            onClick={() => {
              setCreatedCredentials(null);
              setErrorMessage(null);
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-primary to-violet-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-primary/25 transition-all hover:scale-[1.02]"
          >
            <UserPlus className="h-4 w-4" />
            Add Employee
          </Button>
        </div>
      </div>

      {/* Unassigned warning */}
      {unassignedEmployees.length > 0 && (
        <div className="flex flex-col justify-between gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-600">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-900 dark:text-amber-300">
                {unassignedEmployees.length} Employee
                {unassignedEmployees.length > 1 ? "s" : ""} Without Team
                Assignment
              </div>
              <div className="mt-0.5 text-[11px] text-amber-700 dark:text-amber-400">
                Unassigned employees won&apos;t appear in sprint boards. Click
                to auto-assign to General.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              unassignedEmployees.forEach((m) =>
                handleTeamChange(m.id, "General")
              )
            }
            className="flex-shrink-0 rounded-xl bg-amber-500 px-4 py-1.5 text-xs font-bold text-white transition hover:bg-amber-600"
          >
            Auto-Assign to &quot;General&quot;
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:col-span-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Total Employees
          </div>
          <div className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">
            {members.length}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Access to /employee/dashboard
          </div>
        </div>
        <div className="rounded-2xl border border-emerald-200/60 bg-emerald-50/60 p-5 shadow-sm dark:border-emerald-500/20 dark:bg-emerald-950/20">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            Assigned
          </div>
          <div className="mt-2 text-3xl font-extrabold text-emerald-700 dark:text-emerald-400">
            {
              members.filter(
                (m) => m.teamId && m.teamName && m.teamName !== "Unassigned"
              ).length
            }
          </div>
          <div className="mt-1 text-[11px] text-emerald-600/70 dark:text-emerald-500">
            To a team
          </div>
        </div>
        <div className="rounded-2xl border border-amber-200/60 bg-amber-50/60 p-5 shadow-sm dark:border-amber-500/20 dark:bg-amber-950/20">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
            Unassigned
          </div>
          <div className="mt-2 text-3xl font-extrabold text-amber-700 dark:text-amber-400">
            {unassignedEmployees.length}
          </div>
          <div className="mt-1 text-[11px] text-amber-600/70 dark:text-amber-500">
            Needs team
          </div>
        </div>
      </div>

      {/* Search by Name, Email, or Employee ID */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search employee by name, email, or ID (e.g. EMP-XXXXXX, UUID)…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-24 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-400 hover:text-slate-600 dark:bg-slate-800 dark:hover:text-slate-200"
          >
            Clear
          </button>
        )}
      </div>

      {/* Employee Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {/* Table Header */}
        <div className="grid grid-cols-[2fr_1.8fr_1.5fr_1.5fr_1fr_auto] gap-4 border-b border-slate-100 bg-slate-50/70 px-6 py-3.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-800/30">
          <span>Member / ID</span>
          <span>Email</span>
          <span>Position / Title</span>
          <span>Assigned Team</span>
          <span>Route</span>
          <span className="text-right">Actions</span>
        </div>

        {isLoading ? (
          <div className="py-20 text-center">
            <RefreshCw className="mx-auto mb-3 h-6 w-6 animate-spin text-primary" />
            <p className="text-xs text-slate-400">Loading employees…</p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="py-20 text-center">
            <UserCircle className="mx-auto mb-3 h-12 w-12 text-slate-200 dark:text-slate-700" />
            <p className="text-sm font-semibold text-slate-500">
              {members.length === 0
                ? "No employees in your workspace yet."
                : "No employees match your search."}
            </p>
            {members.length === 0 && (
              <p className="mt-1 text-xs text-slate-400">
                Click &quot;Add Employee&quot; to onboard your first team
                member.
              </p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredMembers.map((member, idx) => (
              <div
                key={member.id}
                className="group grid grid-cols-[2fr_1.8fr_1.5fr_1.5fr_1fr_auto] items-center gap-4 px-6 py-4 text-sm transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
              >
                {/* Name + Avatar + MemberIdBadge */}
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-gradient-to-br from-primary/20 to-violet-500/20 text-xs font-extrabold text-primary">
                    {initials(member.fullName)}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-bold text-slate-900 dark:text-white">
                      {member.fullName}
                    </div>
                    <div className="mt-1">
                      <MemberIdBadge id={member.id} role={member.role} />
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-center gap-1.5 truncate text-[12px] text-slate-500 dark:text-slate-400">
                  <Mail className="h-3 w-3 flex-shrink-0 text-slate-300" />
                  <span className="truncate">{member.email || "—"}</span>
                </div>

                {/* Position / Job Title */}
                <div>
                  {member.position ? (
                    <span className="inline-flex items-center rounded-md border border-primary/20 bg-primary/5 px-2 py-0.5 text-[11px] font-semibold text-primary dark:border-primary/30 dark:bg-primary/10 dark:text-primary-300">
                      {member.position}
                    </span>
                  ) : (
                    <span className="text-[11px] italic text-slate-400">—</span>
                  )}
                </div>

                {/* Team Assignment */}
                <div>
                  <select
                    value={member.teamName || "General"}
                    onChange={(e) =>
                      handleTeamChange(member.id, e.target.value)
                    }
                    className="w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 transition focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
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
                  <code className="rounded-lg border border-emerald-200/60 bg-emerald-50 px-2 py-1 font-mono text-[10px] text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-950/30 dark:text-emerald-400">
                    /employee
                  </code>
                </div>

                {/* Actions */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setDeletingMember(member)}
                    title="Remove employee"
                    className="rounded-xl p-2 text-slate-300 opacity-0 transition hover:bg-rose-500/10 hover:text-rose-600 group-hover:opacity-100 dark:hover:bg-rose-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        {filteredMembers.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/30 px-6 py-3 text-[11px] text-slate-400 dark:border-slate-800 dark:bg-slate-800/20">
            <span>
              Showing {filteredMembers.length} of {members.length} employees
            </span>
            <span className="flex items-center gap-1">
              <Lock className="h-3 w-3" />
              Managers & Admins are hidden
            </span>
          </div>
        )}
      </div>

      {/* ── Add Employee Modal ── */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setCreatedCredentials(null);
        }}
        title={createdCredentials ? "Employee Added ✓" : "Add New Employee"}
        description={
          createdCredentials
            ? "Share these login credentials with your new team member."
            : "Create a new employee account under your workspace."
        }
      >
        {createdCredentials ? (
          <div className="space-y-4">
            <div className="space-y-2.5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" /> Account Created
                Successfully!
              </div>
              <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                {createdCredentials.id && (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-500">
                      Employee ID:{" "}
                    </span>
                    <MemberIdBadge
                      id={createdCredentials.id}
                      role="employee"
                      size="md"
                    />
                  </div>
                )}
                <div>
                  <span className="font-semibold text-slate-500">Name: </span>
                  {createdCredentials.fullName}
                </div>
                <div>
                  <span className="font-semibold text-slate-500">Email: </span>
                  <code className="rounded bg-white px-1.5 py-0.5 font-mono dark:bg-slate-800">
                    {createdCredentials.email}
                  </code>
                </div>
                {createdCredentials.password && (
                  <div>
                    <span className="font-semibold text-slate-500">
                      Password:{" "}
                    </span>
                    <code className="rounded bg-white px-1.5 py-0.5 font-mono font-bold text-primary dark:bg-slate-800">
                      {createdCredentials.password}
                    </code>
                  </div>
                )}
                <div>
                  <span className="font-semibold text-slate-500">Role: </span>
                  <span className="font-bold text-emerald-600">Employee</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={copyCredentialsText}
                className="flex flex-1 items-center justify-center gap-2 text-xs font-semibold"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied ? "Copied!" : "Copy Credentials"}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setCreatedCredentials(null);
                }}
                className="flex-1 bg-primary text-xs font-semibold text-white hover:bg-primary/90"
              >
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleAddEmployee} className="space-y-4">
            {errorMessage && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Mode toggle */}
            <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800">
              {(["direct", "invite"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setCreationMode(mode)}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition ${
                    creationMode === mode
                      ? "bg-white text-primary shadow-sm dark:bg-slate-900"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  {mode === "direct"
                    ? "Direct Credentials"
                    : "Send Invite Link"}
                </button>
              ))}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Full Name *
              </label>
              <Input
                placeholder="e.g. Rahul Sharma"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="text-xs"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Work Email *
              </label>
              <Input
                type="email"
                placeholder="e.g. rahul@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="text-xs"
              />
            </div>

            {creationMode === "direct" && (
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Temporary Password *
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pr-10 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4 text-primary" />
                    )}
                  </button>
                </div>
                <p className="mt-1 text-[10px] text-slate-400">
                  Employee will use these credentials to sign in at /login.
                </p>
              </div>
            )}

            {/* Role is fixed — employee only */}
            <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200/60 bg-emerald-50 p-3 dark:border-emerald-500/20 dark:bg-emerald-950/30">
              <Users className="h-4 w-4 flex-shrink-0 text-emerald-600" />
              <div>
                <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  Role: Employee
                </div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-500">
                  Task execution · Access to /employee/dashboard
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 bg-gradient-to-r from-primary to-violet-600 py-2.5 text-xs font-bold text-white transition hover:opacity-90"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Creating
                  Account…
                </>
              ) : (
                <>
                  <UserPlus className="h-3.5 w-3.5" />{" "}
                  {creationMode === "direct"
                    ? "Create Employee Account"
                    : "Send Invite"}
                </>
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
          <Button
            variant="outline"
            onClick={() => setDeletingMember(null)}
            className="flex-1 text-xs font-semibold"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteMember}
            disabled={isDeleting}
            className="flex flex-1 items-center justify-center gap-2 bg-rose-600 text-xs font-bold text-white hover:bg-rose-700"
          >
            {isDeleting ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Removing…
              </>
            ) : (
              <>
                <Trash2 className="h-3.5 w-3.5" /> Remove Employee
              </>
            )}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
