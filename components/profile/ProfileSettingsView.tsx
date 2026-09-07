"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Building,
  FileText,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Shield,
  Crown,
  Check,
  Radio,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MemberIdBadge } from "@/components/ui/MemberIdBadge";

interface ProfileData {
  id: string;
  fullName: string;
  email?: string;
  role: "admin" | "manager" | "employee";
  position?: string | null;
  phoneNumber?: string | null;
  bio?: string | null;
  department?: string | null;
  avatarUrl?: string | null;
  orgId?: string;
  teamName?: string | null;
}

const COMMON_POSITIONS = [
  "Senior Software Engineer",
  "Engineering Lead",
  "Product Manager",
  "UI/UX Designer",
  "Frontend Developer",
  "Backend Architect",
  "DevOps Engineer",
  "QA Specialist",
  "Operations Lead",
];

const COMMON_DEPARTMENTS = [
  "Engineering",
  "Product & Design",
  "Growth & Marketing",
  "Operations",
  "Sales",
  "QA & Security",
  "Leadership",
];

export function ProfileSettingsView({ role }: { role: "admin" | "manager" | "employee" }) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState("");
  const [position, setPosition] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [department, setDepartment] = useState("");
  const [bio, setBio] = useState("");

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/user/profile");
      const json = await res.json();
      if (json.success && json.data) {
        const d: ProfileData = json.data;
        setProfile(d);
        setFullName(d.fullName || "");
        setPosition(d.position || "");
        setPhoneNumber(d.phoneNumber || "");
        setDepartment(d.department || "");
        setBio(d.bio || "");
      }
    } catch {
      showToast("Could not load user profile.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      showToast("Full name is required.", "error");
      return;
    }

    setIsSaving(true);
    setToast(null);

    const payload = {
      fullName: fullName.trim(),
      position: position.trim() || null,
      phoneNumber: phoneNumber.trim() || null,
      department: department.trim() || null,
      bio: bio.trim() || null,
    };

    try {
      const res = await fetch("/api/v1/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setProfile(json.data);
        showToast("Profile details updated successfully!");

        // Broadcast real-time profile update to all open tabs and components
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("tasq:profile_updated", { detail: json.data })
          );
          if ("BroadcastChannel" in window) {
            const bc = new BroadcastChannel("tasq-profile-channel");
            bc.postMessage({ type: "PROFILE_UPDATED", profile: json.data });
            bc.close();

            const actBc = new BroadcastChannel("tasq-activity-channel");
            actBc.postMessage({ type: "ACTIVITY_UPDATED" });
            actBc.close();
          }
        }
      } else {
        showToast(json.error || "Failed to update profile.", "error");
      }
    } catch {
      showToast("Network error while saving profile.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const initials = fullName
    ? fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "US";

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-2.5 text-sm font-medium text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span>Loading personal profile details...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6 pb-12">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`animate-fade-in flex items-center justify-between rounded-2xl border p-4 text-xs font-semibold shadow-sm transition-all ${
            toast.type === "success"
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
              : "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-400"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {toast.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-2 font-bold hover:underline"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Banner / Live Identity Card */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-slate-50 to-primary/5 p-6 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:via-slate-900/90 dark:to-primary/10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {/* Avatar Badge */}
            <div className="relative flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-indigo-600 to-violet-600 text-xl font-black text-white shadow-md ring-4 ring-white dark:ring-slate-800">
              {initials}
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-emerald-500 shadow-xs dark:border-slate-900">
                <span className="h-2 w-2 rounded-full bg-white" />
              </span>
            </div>

            {/* Identity Info */}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {fullName || "Your Name"}
                </h2>
                {profile?.id && (
                  <MemberIdBadge id={profile.id} role={profile.role} />
                )}
              </div>

              {/* Live Position Highlight */}
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1 rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 font-bold text-primary dark:text-primary-300">
                  <Briefcase className="h-3 w-3" />
                  {position || "Designation not set"}
                </span>

                {department && (
                  <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white/80 px-2 py-0.5 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    <Building className="h-3 w-3" />
                    {department}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Info Pills */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            {profile?.email && (
              <div className="flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-white/80 px-2.5 py-1.5 dark:border-slate-800 dark:bg-slate-800">
                <Mail className="h-3.5 w-3.5 text-slate-400" />
                <span>{profile.email}</span>
              </div>
            )}
            {phoneNumber && (
              <div className="flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-white/80 px-2.5 py-1.5 dark:border-slate-800 dark:bg-slate-800">
                <Phone className="h-3.5 w-3.5 text-slate-400" />
                <span>{phoneNumber}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Details Form */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Personal Information
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">
              Changes sync in real time across the workspace
            </span>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {/* Full Name */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span>Full Name</span>
                <span className="text-rose-500">*</span>
              </label>
              <Input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Alex Morgan"
                required
                className="h-10"
              />
            </div>

            {/* Position / Job Title */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <Briefcase className="h-3.5 w-3.5 text-primary" />
                <span>Job Title / Current Position</span>
              </label>
              <Input
                type="text"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="e.g. Senior Fullstack Engineer"
                className="h-10"
              />
              {/* Position Quick Suggestions */}
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="text-[10px] text-slate-400 self-center mr-1">Quick:</span>
                {COMMON_POSITIONS.slice(0, 4).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPosition(p)}
                    className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600 transition hover:border-primary hover:bg-primary/5 hover:text-primary dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-primary"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Email Address (Read-only verified) */}
            <div>
              <label className="mb-1.5 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  <span>Email Address</span>
                </span>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  Verified Account
                </span>
              </label>
              <Input
                type="email"
                value={profile?.email || ""}
                disabled
                className="h-10 cursor-not-allowed bg-slate-50 text-slate-500 dark:bg-slate-800/60 dark:text-slate-400"
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Primary authentication email address linked to your workspace.
              </p>
            </div>

            {/* Phone Number */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <Phone className="h-3.5 w-3.5 text-emerald-500" />
                <span>Phone Number</span>
              </label>
              <Input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+91 98765 43210 or +1 (555) 019-2834"
                className="h-10"
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Used for urgent task escalation and team contact.
              </p>
            </div>

            {/* Department */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <Building className="h-3.5 w-3.5 text-indigo-500" />
                <span>Department / Squad</span>
              </label>
              <Input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Engineering, Product, Design"
                className="h-10"
              />
              {/* Department Quick Suggestions */}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {COMMON_DEPARTMENTS.slice(0, 4).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDepartment(d)}
                    className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600 transition hover:border-indigo-500 hover:bg-indigo-50/50 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Role / Access Level (Read-Only) */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <Crown className="h-3.5 w-3.5 text-amber-500" />
                <span>Workspace Role &amp; Permissions</span>
              </label>
              <div className="flex h-10 items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-xs font-bold capitalize text-slate-800 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  {profile?.role || role}
                </span>
                <span className="rounded-md bg-white px-2 py-0.5 text-[10px] text-slate-500 shadow-2xs dark:bg-slate-700">
                  Managed by Workspace Admin
                </span>
              </div>
            </div>
          </div>

          {/* Bio / About */}
          <div className="mt-5">
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <FileText className="h-3.5 w-3.5 text-slate-400" />
              <span>Bio / Short Note</span>
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell your team about your expertise, focus areas, or working hours..."
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>

        {/* Submit Action Bar */}
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Clicking save updates database records and syncs position across all team views.
          </div>

          <Button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 shadow-md"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving Details...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save Profile Changes</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
