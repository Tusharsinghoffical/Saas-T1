"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  MessageSquare,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export default function AdminSettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Settings state
  const [orgName, setOrgName] = useState("");
  const [timezone, setTimezone] = useState("UTC");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/org/settings");
      const json = await res.json();
      if (json.success && json.data) {
        setOrgName(json.data.name || "");
        setTimezone(json.data.timezone || "UTC");
      }
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setToast(null);

    try {
      const res = await fetch("/api/v1/org/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: orgName,
          timezone,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setToast({
          type: "success",
          message: "Organization settings saved successfully.",
        });
        setTimeout(() => setToast(null), 5000);
      } else {
        setToast({
          type: "error",
          message: json.error || "Failed to save settings.",
        });
      }
    } catch {
      setToast({ type: "error", message: "Network error saving settings." });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span>Loading organization settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in mx-auto max-w-4xl space-y-6 pb-12">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Organization Settings
        </h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
          Manage workspace identity, timezone, and external Slack webhook
          integrations.
        </p>
      </div>

      {/* Floating Toast Notification */}
      {toast && (
        <div
          className={`animate-fade-in flex items-center justify-between rounded-2xl border p-4 text-xs font-medium ${
            toast.type === "success"
              ? "border-success/20 bg-success/10 text-success"
              : "border-urgent/20 bg-urgent/10 text-urgent"
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

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Organization Identity Card */}
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3 dark:border-slate-800">
            <Building2 className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Organization Profile
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Organization Name
              </label>
              <Input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="Acme Corp"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Timezone
              </label>
              <Select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
              >
                <option value="UTC">UTC (Coordinated Universal Time)</option>
                <option value="America/New_York">
                  Eastern Time (US & Canada)
                </option>
                <option value="America/Chicago">
                  Central Time (US & Canada)
                </option>
                <option value="America/Denver">
                  Mountain Time (US & Canada)
                </option>
                <option value="America/Los_Angeles">
                  Pacific Time (US & Canada)
                </option>
                <option value="Europe/London">London, Edinburgh</option>
                <option value="Europe/Paris">Paris, Berlin, Rome</option>
                <option value="Asia/Kolkata">India Standard Time (IST)</option>
                <option value="Asia/Tokyo">Tokyo, Osaka</option>
                <option value="Australia/Sydney">Sydney, Melbourne</option>
              </Select>
            </div>
          </div>
        </div>

        {/* Slack Integration — Coming Soon */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {/* Frosted overlay */}
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-2xl bg-white/60 backdrop-blur-[2px] dark:bg-slate-900/70">
            <div className="flex items-center gap-2 rounded-full border border-primary/20 bg-gradient-to-r from-primary/10 to-violet-500/10 px-4 py-2 shadow-sm">
              <Sparkles className="h-4 w-4 animate-pulse text-primary" />
              <span className="text-sm font-bold text-primary">
                Coming Soon
              </span>
            </div>
            <p className="max-w-[260px] text-center text-xs text-slate-500 dark:text-slate-400">
              Slack integration is under development. You&apos;ll get real-time
              task alerts in your channels soon!
            </p>
          </div>

          {/* Background (blurred) content */}
          <div className="pointer-events-none flex select-none items-center justify-between border-b border-slate-100 pb-3 opacity-30 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="rounded-lg bg-[#4A154B]/10 p-1.5 text-[#4A154B] dark:text-purple-400">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Slack Webhook Integration
                </h3>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Post real-time task assignments and overdue alerts to a Slack
                  channel.
                </p>
              </div>
            </div>
          </div>
          <div className="pointer-events-none mt-4 select-none space-y-3 opacity-20">
            <div className="h-9 w-full rounded-lg bg-slate-200 dark:bg-slate-700" />
            <div className="h-4 w-3/4 rounded-md bg-slate-100 dark:bg-slate-800" />
          </div>
        </div>

        {/* Save Settings Action Button */}
        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            disabled={isSaving}
            className="flex w-full items-center justify-center gap-2 px-6 py-2.5 sm:w-auto"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving Settings...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save Organization Settings</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
