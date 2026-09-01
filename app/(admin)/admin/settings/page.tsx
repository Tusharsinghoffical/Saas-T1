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
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

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
        setToast({ type: "success", message: "Organization settings saved successfully." });
        setTimeout(() => setToast(null), 5000);
      } else {
        setToast({ type: "error", message: json.error || "Failed to save settings." });
      }
    } catch {
      setToast({ type: "error", message: "Network error saving settings." });
    } finally {
      setIsSaving(false);
    }
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span>Loading organization settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Organization Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage workspace identity, timezone, and external Slack webhook integrations.
        </p>
      </div>

      {/* Floating Toast Notification */}
      {toast && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-medium animate-fade-in ${
            toast.type === "success"
              ? "bg-success/10 border-success/20 text-success"
              : "bg-urgent/10 border-urgent/20 text-urgent"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {toast.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="font-bold hover:underline ml-2"
          >
            ✕
          </button>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Organization Identity Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Building2 className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Organization Profile
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
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
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Timezone
              </label>
              <Select value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                <option value="UTC">UTC (Coordinated Universal Time)</option>
                <option value="America/New_York">Eastern Time (US & Canada)</option>
                <option value="America/Chicago">Central Time (US & Canada)</option>
                <option value="America/Denver">Mountain Time (US & Canada)</option>
                <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
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
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden relative">
          {/* Frosted overlay */}
          <div className="absolute inset-0 backdrop-blur-[2px] bg-white/60 dark:bg-slate-900/70 z-10 flex flex-col items-center justify-center gap-3 rounded-2xl">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-violet-500/10 border border-primary/20 shadow-sm">
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              <span className="text-sm font-bold text-primary">Coming Soon</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center max-w-[260px]">
              Slack integration is under development. You&apos;ll get real-time task alerts in your channels soon!
            </p>
          </div>

          {/* Background (blurred) content */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 opacity-30 select-none pointer-events-none">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-[#4A154B]/10 text-[#4A154B] dark:text-purple-400">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Slack Webhook Integration
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Post real-time task assignments and overdue alerts to a Slack channel.
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4 space-y-3 opacity-20 select-none pointer-events-none">
            <div className="h-9 rounded-lg bg-slate-200 dark:bg-slate-700 w-full" />
            <div className="h-4 rounded-md bg-slate-100 dark:bg-slate-800 w-3/4" />
          </div>
        </div>

        {/* Save Settings Action Button */}
        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto px-6 py-2.5 flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Settings...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Organization Settings</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
