"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  Globe,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Send,
  Sparkles,
  ExternalLink,
  MessageSquare,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export default function AdminSettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingSlack, setIsTestingSlack] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Settings state
  const [orgName, setOrgName] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [slackWebhookUrl, setSlackWebhookUrl] = useState("");
  const [slackEnabled, setSlackEnabled] = useState(true);

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
        setSlackWebhookUrl(json.data.slack_webhook_url || "");
        setSlackEnabled(json.data.slack_notifications_enabled ?? true);
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
          slack_webhook_url: slackWebhookUrl.trim(),
          slack_notifications_enabled: slackEnabled,
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

  const handleTestSlack = async () => {
    if (!slackWebhookUrl.trim()) {
      setToast({ type: "error", message: "Please paste a Slack Webhook URL first." });
      return;
    }

    setIsTestingSlack(true);
    setToast(null);

    try {
      const res = await fetch("/api/v1/org/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: orgName,
          slack_webhook_url: slackWebhookUrl.trim(),
          test: true,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setToast({
          type: "success",
          message: "Test message sent to Slack successfully! Check your channel.",
        });
        setTimeout(() => setToast(null), 6000);
      } else {
        setToast({ type: "error", message: json.error || "Slack webhook test failed." });
      }
    } catch {
      setToast({ type: "error", message: "Network timeout testing Slack webhook." });
    } finally {
      setIsTestingSlack(false);
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

        {/* Slack Webhook Integration Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-[#4A154B]/10 text-[#4A154B] dark:text-purple-400">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Slack Webhook Integration</span>
                  {slackWebhookUrl ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/10 text-success font-semibold">
                      Connected
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold">
                      Optional
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Post real-time task assignments and overdue alerts to a Slack channel.
                </p>
              </div>
            </div>

            <a
              href="https://api.slack.com/messaging/webhooks"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
            >
              <span>Slack Guide</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Incoming Webhook URL
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  type="url"
                  value={slackWebhookUrl}
                  onChange={(e) => setSlackWebhookUrl(e.target.value)}
                  placeholder="https://hooks.slack.com/services/T000/B000/XXXXXX"
                  className="font-mono text-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTestSlack}
                  disabled={isTestingSlack || !slackWebhookUrl.trim()}
                  className="sm:w-auto w-full flex-shrink-0 flex items-center gap-1.5"
                >
                  {isTestingSlack ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Testing...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Test Slack</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={slackEnabled}
                onChange={(e) => setSlackEnabled(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
              />
              <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                Post notifications to Slack when tasks are assigned or overdue
              </span>
            </label>
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
