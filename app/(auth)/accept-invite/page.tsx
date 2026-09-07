"use client";

export const dynamic = "force-dynamic";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { acceptInviteAction } from "@/app/(auth)/actions";
import {
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
} from "lucide-react";

export default function AcceptInvitePage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Password strength calculation
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: "", color: "" };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd) || /[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd) && pwd.length >= 8) score++;

    if (score === 1)
      return {
        score: 1,
        label: "Weak",
        color: "bg-rose-500",
        text: "text-rose-500",
      };
    if (score === 2)
      return {
        score: 2,
        label: "Good",
        color: "bg-amber-500",
        text: "text-amber-500",
      };
    return {
      score: 3,
      label: "Strong",
      color: "bg-emerald-500",
      text: "text-emerald-500",
    };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await acceptInviteAction(password);
      if (!response.success) {
        setError(
          response.error ||
            "Failed to set account password. Link may have expired."
        );
        setIsLoading(false);
        return;
      }

      setIsSuccess(true);
      setTimeout(() => {
        router.push(response.data?.redirectUrl || "/employee/dashboard");
      }, 1200);
    } catch (err: any) {
      setError(err.message || "An unexpected network error occurred.");
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 text-center">
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Team Invitation Verified</span>
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
          Accept Invite &amp; Set Password
        </h2>
        <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 sm:text-sm">
          Choose a secure password to activate your workspace profile.
        </p>
      </div>

      {/* Success Notification */}
      {isSuccess && (
        <div className="animate-fade-in mb-5 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          <div>
            <span className="block font-bold">Account Activated!</span>
            <p className="text-[11px] text-emerald-700">
              Redirecting you to your team dashboard...
            </p>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && !isSuccess && (
        <div className="animate-fade-in mb-5 flex items-start gap-2.5 rounded-2xl border border-urgent/20 bg-urgent/10 p-3.5 text-xs font-medium text-urgent">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      {!isSuccess && (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Password */}
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              New Password
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                disabled={isLoading}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-300 bg-slate-50/50 py-2.5 pl-10 pr-10 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 transition hover:text-slate-600"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Strength Meter */}
            {password && (
              <div className="mt-2 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Password strength:</span>
                  <span className={`font-bold ${strength.text}`}>
                    {strength.label}
                  </span>
                </div>
                <div className="flex h-1.5 w-full gap-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <div
                    className={`h-full flex-1 rounded-full ${strength.score >= 1 ? strength.color : "bg-transparent"}`}
                  />
                  <div
                    className={`h-full flex-1 rounded-full ${strength.score >= 2 ? strength.color : "bg-transparent"}`}
                  />
                  <div
                    className={`h-full flex-1 rounded-full ${strength.score >= 3 ? strength.color : "bg-transparent"}`}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Confirm Password
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                disabled={isLoading}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-300 bg-slate-50/50 py-2.5 pl-10 pr-10 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-primary-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Activating Account...</span>
              </>
            ) : (
              <>
                <span>Activate Workspace Access</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      )}

      {/* Security Footer Note */}
      <div className="mt-6 flex items-center justify-center gap-2 border-t border-slate-100 pt-5 text-xs text-slate-400 dark:border-slate-800">
        <ShieldCheck className="h-4 w-4 text-emerald-500" />
        <span>Enterprise TLS Encrypted • 100% Isolated Data</span>
      </div>
    </div>
  );
}
