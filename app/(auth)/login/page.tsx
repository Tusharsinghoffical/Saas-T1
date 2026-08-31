"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loginWithPassword, loginWithMagicLink } from "@/app/(auth)/actions";
import { loginSchema, magicLinkSchema, type LoginInput } from "@/lib/validators/auth";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  Loader2,
  AlertCircle,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";

const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_COOLDOWN_SECONDS = 60;

export default function LoginPage() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<"password" | "magic-link">("password");

  const [formData, setFormData] = useState<LoginInput>({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [magicLinkEmail, setMagicLinkEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [magicLinkSuccess, setMagicLinkSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Anti-Brute-Force Rate Limiting State
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);

  // Legal Modal State
  const [legalModal, setLegalModal] = useState<"privacy" | "terms" | null>(null);

  // Load lockout state on mount
  useEffect(() => {
    try {
      const storedAttempts = sessionStorage.getItem("tasq_login_attempts");
      const storedLockout = sessionStorage.getItem("tasq_login_lockout_until");
      if (storedAttempts) {
        setFailedAttempts(parseInt(storedAttempts, 10) || 0);
      }
      if (storedLockout) {
        const remaining = Math.ceil((parseInt(storedLockout, 10) - Date.now()) / 1000);
        if (remaining > 0) {
          setLockoutRemaining(remaining);
        } else {
          sessionStorage.removeItem("tasq_login_lockout_until");
        }
      }
    } catch {}
  }, []);

  // Cooldown countdown timer
  useEffect(() => {
    if (lockoutRemaining <= 0) return;

    const timer = setInterval(() => {
      setLockoutRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          try {
            sessionStorage.removeItem("tasq_login_lockout_until");
            sessionStorage.setItem("tasq_login_attempts", "0");
          } catch {}
          setFailedAttempts(0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [lockoutRemaining]);

  const recordFailedAttempt = () => {
    const nextAttempts = failedAttempts + 1;
    setFailedAttempts(nextAttempts);
    try {
      sessionStorage.setItem("tasq_login_attempts", nextAttempts.toString());
    } catch {}

    if (nextAttempts >= MAX_LOGIN_ATTEMPTS) {
      const lockoutUntil = Date.now() + LOGIN_COOLDOWN_SECONDS * 1000;
      try {
        sessionStorage.setItem("tasq_login_lockout_until", lockoutUntil.toString());
      } catch {}
      setLockoutRemaining(LOGIN_COOLDOWN_SECONDS);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutRemaining > 0 || isLoading) return;

    setErrors({});
    setServerError(null);

    const sanitizedData: LoginInput = {
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
    };

    const validation = loginSchema.safeParse(sanitizedData);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        if (field && !fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      });
      setErrors(fieldErrors);
      recordFailedAttempt();
      return;
    }

    setIsLoading(true);
    try {
      const response = await loginWithPassword(sanitizedData);
      if (!response.success) {
        setServerError(response.error || "Invalid email or password.");
        recordFailedAttempt();
        setIsLoading(false);
        return;
      }

      // Success: Clear rate limits
      try {
        sessionStorage.removeItem("tasq_login_attempts");
        sessionStorage.removeItem("tasq_login_lockout_until");
      } catch {}

      router.push(response.data?.redirectUrl || "/admin/dashboard");
    } catch (err: any) {
      setServerError(err.message || "An unexpected network error occurred.");
      recordFailedAttempt();
      setIsLoading(false);
    }
  };

  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setErrors({});
    setServerError(null);
    setMagicLinkSuccess(null);

    const sanitizedEmail = magicLinkEmail.trim().toLowerCase();
    const validation = magicLinkSchema.safeParse({ email: sanitizedEmail });
    if (!validation.success) {
      setErrors({ magicEmail: validation.error.issues[0]?.message || "Invalid email address." });
      return;
    }

    setIsLoading(true);
    try {
      const response = await loginWithMagicLink({ email: sanitizedEmail });
      setIsLoading(false);
      if (!response.success) {
        setServerError(response.error || "Failed to send magic link.");
        return;
      }

      setMagicLinkSuccess(response.data?.message || "Magic sign-in link dispatched! Check your inbox.");
    } catch (err: any) {
      setServerError(err.message || "An unexpected error occurred.");
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-3">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Team Workspace Portal</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">
          Employee &amp; Team Login
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1.5">
          Sign in with your organization credentials or secure magic link.
        </p>
      </div>

      {/* Auth Mode Toggle Tabs */}
      <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800/80 p-1 mb-5 border border-slate-200 dark:border-slate-700 text-xs font-semibold">
        <button
          type="button"
          onClick={() => {
            setAuthMode("password");
            setServerError(null);
            setErrors({});
          }}
          className={`flex-1 py-2 rounded-lg transition-all ${
            authMode === "password"
              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-bold"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          Password Sign In
        </button>
        <button
          type="button"
          onClick={() => {
            setAuthMode("magic-link");
            setServerError(null);
            setErrors({});
          }}
          className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            authMode === "magic-link"
              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-bold"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span>Magic Link</span>
        </button>
      </div>

      {/* Security Lockout Banner */}
      {lockoutRemaining > 0 && (
        <div className="mb-5 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-start gap-3 text-xs animate-shake">
          <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-600" />
          <div>
            <span className="font-bold block">Security Lockout Active</span>
            <p className="mt-0.5 text-[11px] leading-relaxed">
              Too many failed login attempts. Form is locked for{" "}
              <strong className="font-bold underline">{lockoutRemaining}s</strong> to prevent brute-force attacks. You can switch to the Magic Link tab for instant verified access.
            </p>
          </div>
        </div>
      )}

      {/* Server Error Banner */}
      {serverError && lockoutRemaining === 0 && (
        <div className="mb-5 p-3.5 rounded-2xl bg-urgent/10 border border-urgent/20 flex items-start gap-2.5 text-xs text-urgent font-medium animate-fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{serverError}</span>
        </div>
      )}

      {/* Password Login Form */}
      {authMode === "password" && (
        <form className="space-y-4 animate-fade-in" onSubmit={handlePasswordSubmit} noValidate>
          {/* Work Email */}
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1.5">
              Work Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                disabled={lockoutRemaining > 0 || isLoading}
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
                }}
                placeholder="you@company.com"
                className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border ${
                  errors.email
                    ? "border-urgent focus:ring-urgent"
                    : "border-slate-300 dark:border-slate-700 focus:ring-primary focus:border-primary"
                } bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 text-sm transition placeholder:text-slate-400 disabled:opacity-50`}
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-xs text-urgent font-medium">{errors.email}</p>
            )}
          </div>

          {/* Password + Show/Hide Toggle */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Password
              </label>
              <button
                type="button"
                onClick={() => setAuthMode("magic-link")}
                className="text-xs text-primary hover:text-primary-700 font-semibold hover:underline cursor-pointer"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                disabled={lockoutRemaining > 0 || isLoading}
                value={formData.password}
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value });
                  if (errors.password) setErrors((prev) => ({ ...prev, password: "" }));
                }}
                placeholder="•••••••••••"
                className={`w-full pl-10 pr-11 py-2.5 rounded-xl border ${
                  errors.password
                    ? "border-urgent focus:ring-urgent"
                    : "border-slate-300 dark:border-slate-700 focus:ring-primary focus:border-primary"
                } bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 text-sm transition placeholder:text-slate-400 disabled:opacity-50`}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none transition cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-urgent font-medium">{errors.password}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || lockoutRemaining > 0}
            className="w-full py-3 px-4 rounded-xl bg-primary hover:bg-primary-700 text-white font-bold text-sm shadow-md shadow-primary/25 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 mt-2 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : lockoutRemaining > 0 ? (
              <span>Locked ({lockoutRemaining}s remaining)</span>
            ) : (
              <>
                <span>Sign In to Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Unified Role Guidance Box */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-center">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Smart Multi-Tenant Sign In</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Log in with your registered work email. Your role (<strong>Admin / Founder</strong> or <strong>Team Employee</strong>) is automatically verified against your company workspace.
              </p>
            </div>
          </div>
        </form>
      )}

      {/* Magic Link Form */}
      {authMode === "magic-link" && (
        <form className="space-y-4 animate-fade-in" onSubmit={handleMagicLinkSubmit} noValidate>
          {magicLinkSuccess ? (
            <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-2.5">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-950 dark:text-white">Check your email</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">{magicLinkSuccess}</p>
              <button
                type="button"
                onClick={() => setMagicLinkSuccess(null)}
                className="mt-2 text-xs font-bold text-primary hover:underline cursor-pointer"
              >
                Send another link
              </button>
            </div>
          ) : (
            <>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Enter your work email address and we&apos;ll send you a passwordless sign-in link with instant cryptographic verification.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1.5">
                  Work Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    disabled={isLoading}
                    value={magicLinkEmail}
                    onChange={(e) => {
                      setMagicLinkEmail(e.target.value);
                      if (errors.magicEmail) setErrors({});
                    }}
                    placeholder="you@company.com"
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border ${
                      errors.magicEmail
                        ? "border-urgent focus:ring-urgent"
                        : "border-slate-300 dark:border-slate-700 focus:ring-primary focus:border-primary"
                    } bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 text-sm transition placeholder:text-slate-400 disabled:opacity-50`}
                  />
                </div>
                {errors.magicEmail && (
                  <p className="mt-1 text-xs text-urgent font-medium">{errors.magicEmail}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-primary hover:bg-primary-700 text-white font-bold text-sm shadow-md shadow-primary/25 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 mt-2 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending Magic Link...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Send Magic Sign-In Link</span>
                  </>
                )}
              </button>
            </>
          )}
        </form>
      )}

      {/* Interactive Terms & Privacy Modals */}
      <Modal
        isOpen={legalModal === "terms"}
        onClose={() => setLegalModal(null)}
        title="Terms of Service"
        description="Last updated: January 2026"
        maxWidth="2xl"
      >
        <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300 max-h-[60vh] overflow-y-auto pr-2">
          <h4 className="font-bold text-slate-900 dark:text-white">1. Multi-Tenant Organization Account</h4>
          <p>
            By signing in, you access your organization&apos;s multi-tenant partition secured by PostgreSQL Row-Level Security.
          </p>
          <h4 className="font-bold text-slate-900 dark:text-white">2. Acceptable Use</h4>
          <p>
            You agree not to attempt unauthorized access to other tenant organizations or overload system endpoints.
          </p>
        </div>
      </Modal>

      <Modal
        isOpen={legalModal === "privacy"}
        onClose={() => setLegalModal(null)}
        title="Privacy Policy"
        description="Last updated: January 2026"
        maxWidth="2xl"
      >
        <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300 max-h-[60vh] overflow-y-auto pr-2">
          <h4 className="font-bold text-slate-900 dark:text-white">1. Data Isolation</h4>
          <p>
            All employee and admin records are isolated by organization ID and encrypted with 256-bit TLS in transit.
          </p>
        </div>
      </Modal>
    </div>
  );
}
