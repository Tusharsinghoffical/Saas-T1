"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Users,
  UserPlus,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Search,
  Trash2,
  Check,
  Copy,
  Mail,
  Key,
  Eye,
  EyeOff,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Lock,
  ChevronDown,
  Sparkles,
  Radio,
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

interface TeamMember {
  id: string;
  fullName: string;
  email: string | null;
  role: "admin" | "manager" | "employee";
  teamId?: string | null;
  teamName?: string | null;
  avatarUrl?: string | null;
  createdAt?: string;
}

export default function AdminTeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [selectedTeam, setSelectedTeam] = useState<string>("General");

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<"admin" | "manager" | "employee">(
    "employee"
  );
  const [creationMode, setCreationMode] = useState<"direct" | "invite">(
    "direct"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Success Credential State
  const [createdCredentials, setCreatedCredentials] = useState<{
    id?: string;
    fullName: string;
    email: string;
    password?: string;
    role: string;
    teamName?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Member Deletion State
  const [deletingMember, setDeletingMember] = useState<TeamMember | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast feedback
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

  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/org/members");
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        console.warn(
          "[fetchMembers] Server returned non-JSON response:",
          res.status
        );
        return;
      }
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setMembers(
          json.data.map((m: any) => ({
            id: m.id || m.user_id,
            fullName: m.fullName || m.full_name || "Team Member",
            email: m.email || null,
            role: m.role || "employee",
            teamId: m.teamId || m.team_id || null,
            teamName:
              m.teamName ||
              m.team_name ||
              (m.role === "admin" ? "Leadership" : "General"),
            avatarUrl: m.avatarUrl || m.avatar_url || null,
            createdAt: m.createdAt || m.created_at,
          }))
        );
      } else if (json.error) {
        showToast(json.error, "error");
      }
    } catch (err: any) {
      console.warn("[fetchMembers error]", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial data load on mount
  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const { isRefreshing, triggerManual } = useAutoRefresh(fetchMembers);

  // Realtime Supabase Channel Subscription for Team Profiles
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
      const channelId = `realtime:team_profiles:${Math.random().toString(36).slice(2, 9)}`;
      channel = supabase
        .channel(channelId)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "profiles",
          },
          () => {
            fetchMembers();
          }
        )
        .subscribe((status) => {
          setIsConnected(status === "SUBSCRIBED");
        });
    } catch (e) {
      console.warn("Realtime profiles connection error:", e);
    }

    return () => {
      if (channel) {
        const supabase = createClient();
        supabase.removeChannel(channel);
      }
    };
  }, [fetchMembers]);

  // Filtered members list with ID, Member Code, Name, Email, and Team search support
  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      const matchesSearch = matchesMemberSearch(member, searchQuery);
      const matchesRole = roleFilter === "all" || member.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [members, searchQuery, roleFilter]);

  // Metric counts
  const adminCount = members.filter((m) => m.role === "admin").length;
  const managerCount = members.filter((m) => m.role === "manager").length;
  const employeeCount = members.filter((m) => m.role === "employee").length;
  const unassignedMembers = members.filter(
    (m) => m.role !== "admin" && (!m.teamId || m.teamName === "Unassigned")
  );

  // Handle Add Member Submit
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim()) {
      setErrorMessage("Full name is required.");
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
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
          role,
          teamName: selectedTeam,
        }),
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Server error (${res.status})`);
      }

      if (!res.ok || !data.success) {
        throw new Error(
          data.error ||
            data.message ||
            (typeof data.details === "string" ? data.details : null) ||
            "Failed to add member."
        );
      }

      if (creationMode === "direct") {
        setCreatedCredentials({
          id: data.profile?.id || data.user?.id,
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          password,
          role,
          teamName: selectedTeam,
        });
      } else {
        setIsAddModalOpen(false);
        showToast(`Invitation sent to ${email}`);
      }

      // Reset fields
      setFullName("");
      setEmail("");
      setPassword("");
      fetchMembers();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to create member account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Role Change
  const handleRoleChange = async (
    userId: string,
    newRole: "admin" | "manager" | "employee"
  ) => {
    try {
      const res = await fetch(`/api/v1/org/members/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(
          data.message || data.error?.message || "Failed to update role."
        );
      }

      setMembers((prev) =>
        prev.map((m) => (m.id === userId ? { ...m, role: newRole } : m))
      );
      showToast(`Member access updated to ${newRole.toUpperCase()}.`);
    } catch (err: any) {
      showToast(err.message || "Failed to update role.", "error");
    }
  };

  // Handle Team Assignment Change
  const handleTeamChange = async (userId: string, newTeamName: string) => {
    try {
      const res = await fetch(`/api/v1/org/members/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamName: newTeamName }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(
          data.message ||
            data.error?.message ||
            "Failed to update team assignment."
        );
      }

      setMembers((prev) =>
        prev.map((m) => (m.id === userId ? { ...m, teamName: newTeamName } : m))
      );
      showToast(`Member assigned to team "${newTeamName}".`);
    } catch (err: any) {
      showToast(err.message || "Failed to update team assignment.", "error");
    }
  };

  // Handle Member Deletion / Removal
  const handleDeleteMember = async () => {
    if (!deletingMember) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/v1/org/members/${deletingMember.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(
          data.message || data.error?.message || "Failed to remove member."
        );
      }

      setMembers((prev) => prev.filter((m) => m.id !== deletingMember.id));
      showToast(`${deletingMember.fullName} removed from workspace.`);
      setDeletingMember(null);
    } catch (err: any) {
      showToast(err.message || "Failed to remove member.", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const copyCredentialsText = () => {
    if (!createdCredentials) return;
    const memberCode = formatMemberCode(
      createdCredentials.id,
      createdCredentials.role
    );
    const text = `🎉 You've been added to TASQ-ONE Work OS!\n\nMember ID: ${memberCode} (${createdCredentials.id || "N/A"})\nLogin URL: ${window.location.origin}/login\nEmail: ${createdCredentials.email}\nPassword: ${createdCredentials.password}\nRole: ${createdCredentials.role.toUpperCase()}\nTeam: ${createdCredentials.teamName || "General"}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
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

      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Team & Role Access
            </h1>
            {/* Live Realtime Status Pill */}
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold transition-colors ${
                isConnected
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400"
              }`}
            >
              <Radio
                className={`h-3 w-3 ${isConnected ? "animate-pulse text-emerald-500" : "text-amber-500"}`}
              />
              <span>
                {isConnected ? "Realtime Database Sync" : "Syncing..."}
              </span>
            </span>

            <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary">
              {members.length} Total Members
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Add team members, guarantee manager/team assignments, and manage
            RBAC role permissions.
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
              setSelectedTeam("General");
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-primary/25 hover:bg-primary-700"
          >
            <UserPlus className="h-4 w-4" />
            Add Team Member
          </Button>
        </div>
      </div>

      {/* Gap 2: Unassigned Team Members Report / Warning Banner */}
      {unassignedMembers.length > 0 && (
        <div className="animate-fade-in flex flex-col justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-600">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-900 dark:text-amber-300">
                {unassignedMembers.length} Member
                {unassignedMembers.length > 1 ? "s" : ""} Without Team
                Assignment
              </div>
              <div className="text-[11px] text-amber-700 dark:text-amber-400">
                Employees without an assigned team are invisible to Manager
                dashboards. Assign them to a team below.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              unassignedMembers.forEach((m) =>
                handleTeamChange(m.id, "General")
              );
            }}
            className="flex-shrink-0 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-amber-600"
          >
            Auto-Assign All to &quot;General&quot;
          </button>
        </div>
      )}

      {/* Role Distribution Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div>
            <div className="text-xs font-semibold text-slate-500">
              Employees (Workspace Users)
            </div>
            <div className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">
              {employeeCount}
            </div>
            <div className="text-[11px] text-slate-400">
              Access to /employee/dashboard
            </div>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 font-bold text-emerald-600">
            <Users className="h-5 w-5" />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div>
            <div className="text-xs font-semibold text-slate-500">
              Managers (Sprint Leads)
            </div>
            <div className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">
              {managerCount}
            </div>
            <div className="text-[11px] text-slate-400">
              Access to /manager/dashboard
            </div>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 font-bold text-amber-600">
            <ShieldCheck className="h-5 w-5" />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div>
            <div className="text-xs font-semibold text-slate-500">
              Founding Admins
            </div>
            <div className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">
              {adminCount}
            </div>
            <div className="text-[11px] text-slate-400">
              Full workspace & team control
            </div>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 font-bold text-indigo-600">
            <Shield className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:flex-row sm:items-center">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by name, email, team, or Member ID (e.g. EMP-XXXXXX, MGR-XXXXXX, UUID)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 pl-9 pr-14 text-xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-400 hover:text-slate-600 dark:bg-slate-700 dark:hover:text-slate-200"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Role:</span>
          <div className="dark:border-slate-750 flex items-center rounded-lg border border-slate-200 bg-slate-100 p-1 dark:bg-slate-900">
            {["all", "admin", "manager", "employee"].map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`rounded-md px-3 py-1 text-xs font-semibold capitalize transition ${
                  roleFilter === r
                    ? "bg-white text-primary shadow-sm dark:bg-slate-800"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                {r === "all" ? "All Roles" : r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Members Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        {isLoading ? (
          <div className="flex flex-col items-center gap-2 p-12 text-center text-xs text-slate-400">
            <RefreshCw className="h-5 w-5 animate-spin text-primary" />
            <span>Loading workspace team members...</span>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No team members found matching your search.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:bg-slate-900/60">
                <tr>
                  <th className="px-5 py-3.5">Member / ID</th>
                  <th className="px-5 py-3.5">Email</th>
                  <th className="px-5 py-3.5">Assigned Team / Squad</th>
                  <th className="px-5 py-3.5">Access Role</th>
                  <th className="px-5 py-3.5">Dashboard Route</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="dark:divide-slate-750 divide-y divide-slate-100">
                {filteredMembers.map((member) => (
                  <tr
                    key={member.id}
                    className="dark:hover:bg-slate-750/30 transition hover:bg-slate-50/50"
                  >
                    {/* Name, Avatar & MemberIdBadge */}
                    <td className="whitespace-nowrap px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-xs font-bold text-primary">
                          {member.fullName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {member.fullName}
                          </div>
                          <div className="mt-1">
                            <MemberIdBadge id={member.id} role={member.role} />
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="whitespace-nowrap px-5 py-3.5 text-slate-500">
                      {member.email || "Workspace User"}
                    </td>

                    {/* Team Assignment — editable dropdown */}
                    <td className="whitespace-nowrap px-5 py-3.5">
                      <select
                        value={member.teamName || "General"}
                        onChange={(e) =>
                          handleTeamChange(member.id, e.target.value)
                        }
                        className="cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 transition focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
                      >
                        <option value="General">General</option>
                        <option value="Engineering">Engineering</option>
                        <option value="Product">Product &amp; Design</option>
                        <option value="Marketing">
                          Growth &amp; Marketing
                        </option>
                        <option value="Leadership">Leadership</option>
                        <option value="Sales">Sales</option>
                        <option value="Operations">Operations</option>
                        <option value="QA">QA</option>
                      </select>
                    </td>

                    {/* Role Dropdown */}
                    <td className="whitespace-nowrap px-5 py-3.5">
                      <select
                        value={member.role}
                        onChange={(e) =>
                          handleRoleChange(
                            member.id,
                            e.target.value as "admin" | "manager" | "employee"
                          )
                        }
                        className={`cursor-pointer rounded-lg border px-2.5 py-1 text-xs font-bold transition ${
                          member.role === "admin"
                            ? "border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                            : member.role === "manager"
                              ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        <option value="employee">Employee</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>

                    {/* Destination Route */}
                    <td className="whitespace-nowrap px-5 py-3.5">
                      <code className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                        {member.role === "admin"
                          ? "/admin/dashboard"
                          : member.role === "manager"
                            ? "/manager/dashboard"
                            : "/employee/dashboard"}
                      </code>
                    </td>

                    {/* Actions */}
                    <td className="whitespace-nowrap px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => setDeletingMember(member)}
                        title="Remove member from workspace"
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Add Team Member */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setCreatedCredentials(null);
        }}
        title={createdCredentials ? "Credentials Generated" : "Add Team Member"}
        description={
          createdCredentials
            ? "Share these credentials with the team member so they can log in immediately."
            : "Create login credentials or dispatch an invite to a new workspace member."
        }
      >
        {createdCredentials ? (
          <div className="space-y-4">
            <div className="space-y-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                Account Created Successfully!
              </div>

              <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                {createdCredentials.id && (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-500">
                      Member ID:
                    </span>
                    <MemberIdBadge
                      id={createdCredentials.id}
                      role={createdCredentials.role}
                      size="md"
                    />
                  </div>
                )}
                <div>
                  <span className="font-semibold text-slate-500">Name:</span>{" "}
                  {createdCredentials.fullName}
                </div>
                <div>
                  <span className="font-semibold text-slate-500">Email:</span>{" "}
                  <code className="rounded bg-white px-1.5 py-0.5 font-mono dark:bg-slate-800">
                    {createdCredentials.email}
                  </code>
                </div>
                {createdCredentials.password && (
                  <div>
                    <span className="font-semibold text-slate-500">
                      Password:
                    </span>{" "}
                    <code className="rounded bg-white px-1.5 py-0.5 font-mono font-bold text-primary dark:bg-slate-800">
                      {createdCredentials.password}
                    </code>
                  </div>
                )}
                <div>
                  <span className="font-semibold text-slate-500">
                    Assigned Role:
                  </span>{" "}
                  <Badge variant="default" className="text-[10px] uppercase">
                    {createdCredentials.role}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={copyCredentialsText}
                className="flex w-full items-center justify-center gap-2 text-xs font-semibold"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied ? "Copied to Clipboard!" : "Copy Login Info"}
              </Button>

              <Button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setCreatedCredentials(null);
                }}
                className="w-full bg-primary text-xs font-semibold text-white hover:bg-primary-700"
              >
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleAddMember} className="space-y-4">
            {errorMessage && (
              <div className="flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Mode Switcher */}
            <div className="flex items-center rounded-lg border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setCreationMode("direct")}
                className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition ${
                  creationMode === "direct"
                    ? "bg-white text-primary shadow-sm dark:bg-slate-900"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                Direct Credentials (Instant)
              </button>
              <button
                type="button"
                onClick={() => setCreationMode("invite")}
                className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition ${
                  creationMode === "invite"
                    ? "bg-white text-primary shadow-sm dark:bg-slate-900"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                Send Invite Link (Email)
              </button>
            </div>

            {/* Full Name */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
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

            {/* Email Address */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Work Email *
              </label>
              <Input
                type="email"
                placeholder="e.g. rahul@yourcompany.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="text-xs"
              />
            </div>

            {/* Direct Password Input if Mode is Direct */}
            {creationMode === "direct" && (
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Assign Temporary Password *
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Min 6 characters (e.g. Pass@123)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pr-10 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200"
                    title={showPassword ? "Hide password" : "Show password"}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-slate-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-primary" />
                    )}
                  </button>
                </div>
                <span className="mt-0.5 block text-[10px] text-slate-400">
                  Employee will use this email & password to sign in at /login.
                </span>
              </div>
            )}

            {/* Role Selection */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Assign Workspace Role *
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setRole("employee")}
                  className={`rounded-xl border p-2.5 text-left transition ${
                    role === "employee"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700"
                  }`}
                >
                  <div className="text-xs font-bold">Employee</div>
                  <div className="mt-0.5 text-[10px] text-slate-400">
                    Task execution
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setRole("manager")}
                  className={`rounded-xl border p-2.5 text-left transition ${
                    role === "manager"
                      ? "border-amber-500 bg-amber-500/5 text-amber-600"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700"
                  }`}
                >
                  <div className="text-xs font-bold">Manager</div>
                  <div className="mt-0.5 text-[10px] text-slate-400">
                    Sprint reviews
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setRole("admin")}
                  className={`rounded-xl border p-2.5 text-left transition ${
                    role === "admin"
                      ? "border-indigo-500 bg-indigo-500/5 text-indigo-600"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700"
                  }`}
                >
                  <div className="text-xs font-bold">Admin</div>
                  <div className="mt-0.5 text-[10px] text-slate-400">
                    Full workspace
                  </div>
                </button>
              </div>
            </div>

            {/* Team / Squad Assignment */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Assign Team / Squad *
              </label>
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="General">General (Default Org Team)</option>
                <option value="Engineering">Engineering Squad</option>
                <option value="Product">Product & Design</option>
                <option value="Marketing">Growth & Marketing</option>
                <option value="Leadership">Executive Leadership</option>
              </select>
              <span className="mt-1 block text-[10px] text-slate-400">
                Guarantees this member is visible in the corresponding Manager
                dashboard.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary text-xs font-semibold text-white hover:bg-primary-700"
              >
                {isSubmitting ? "Creating Account..." : "Create Member"}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal: Confirm Delete Member */}
      <Modal
        isOpen={Boolean(deletingMember)}
        onClose={() => setDeletingMember(null)}
        title="Remove Team Member"
        description="Are you sure you want to remove this member from your workspace?"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            This will immediately deactivate{" "}
            <strong>{deletingMember?.fullName}</strong> and block them from
            logging in. Historical tasks and logs will be preserved.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletingMember(null)}
              className="text-xs"
            >
              Cancel
            </Button>

            <Button
              type="button"
              onClick={handleDeleteMember}
              disabled={isDeleting}
              className="bg-rose-600 text-xs font-semibold text-white hover:bg-rose-700"
            >
              {isDeleting ? "Removing..." : "Remove Access"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
