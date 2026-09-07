"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loginWithPassword, loginWithMagicLink } from "@/app/(auth)/actions";
import {
  loginSchema,
  magicLinkSchema,
  type LoginInput,
} from "@/lib/validators/auth";
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
  const [authMode, setAuthMode] = useState<"password" | "magic-link">(
    "password"
  );

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
  const [legalModal, setLegalModal] = useState<"privacy" | "terms" | null>(
    null
  );

  // Load lockout state on mount
  useEffect(() => {
    try {
      const storedAttempts = sessionStorage.getItem("tasq_login_attempts");
      const storedLockout = sessionStorage.getItem("tasq_login_lockout_until");
      if (storedAttempts) {
        setFailedAttempts(parseInt(storedAttempts, 10) || 0);
      }
      if (storedLockout) {
        const remaining = Math.ceil(
          (parseInt(storedLockout, 10) - Date.now()) / 1000
        );
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
        sessionStorage.setItem(
          "tasq_login_lockout_until",
          lockoutUntil.toString()
        );
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
      if (
        err?.message?.includes("Server Action") ||
        err?.message?.includes("failed-to-find-server-action") ||
        err?.message?.includes("not found on the server")
      ) {
        // Automatically reload page to fetch the newly deployed server actions
        window.location.reload();
        return;
      }
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
      setErrors({
        magicEmail:
          validation.error.issues[0]?.message || "Invalid email address.",
      });
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

      setMagicLinkSuccess(
        `Magic link sent to ${sanitizedEmail}! Check your inbox to sign in.`
      );
    } catch (err: any) {
      if (
        err?.message?.includes("Server Action") ||
        err?.message?.includes("failed-to-find-server-action") ||
        err?.message?.includes("not found on the server")
      ) {
        window.location.reload();
        return;
      }
      setServerError(err.message || "Failed to send magic link.");
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 text-center">
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Team Workspace Portal</span>
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
          Employee &amp; Team Login
        </h2>
        <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 sm:text-sm">
          Sign in with your organization credentials or secure magic link.
        </p>
      </div>

      {/* Auth Mode Toggle Tabs */}
      <div className="mb-5 flex rounded-xl border border-slate-200 bg-slate-100 p-1 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800/80">
        <button
          type="button"
          onClick={() => {
            setAuthMode("password");
            setServerError(null);
            setErrors({});
          }}
          className={`flex-1 rounded-lg py-2 transition-all ${
            authMode === "password"
              ? "bg-white font-bold text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white"
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
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 transition-all ${
            authMode === "magic-link"
              ? "bg-white font-bold text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span>Magic Link</span>
        </button>
      </div>

      {/* Security Lockout Banner */}
      {lockoutRemaining > 0 && (
        <div className="animate-shake mb-5 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
          <ShieldAlert className="mt-0.5 h-5 w-5 flex-shrink-0 text-rose-600" />
          <div>
            <span className="block font-bold">Security Lockout Active</span>
            <p className="mt-0.5 text-[11px] leading-relaxed">
              Too many failed login attempts. Form is locked for{" "}
              <strong className="font-bold underline">
                {lockoutRemaining}s
              </strong>{" "}
              to prevent brute-force attacks. You can switch to the Magic Link
              tab for instant verified access.
            </p>
          </div>
        </div>
      )}

      {/* Server Error Banner */}
      {serverError && lockoutRemaining === 0 && (
        <div className="animate-fade-in mb-5 flex items-start gap-2.5 rounded-2xl border border-urgent/20 bg-urgent/10 p-3.5 text-xs font-medium text-urgent">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      {/* Password Login Form */}
      {authMode === "password" && (
        <form
          className="animate-fade-in space-y-4"
          onSubmit={handlePasswordSubmit}
          noValidate
        >
          {/* Work Email */}
          <div>
            <label
              htmlFor="login-email"
              className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200"
            >
              Work Email or Member ID
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <Mail className="h-4 w-4" />
              </div>
              <input
                id="login-email"
                name="email"
                type="text"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                disabled={lockoutRemaining > 0 || isLoading}
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  if (errors.email)
                    setErrors((prev) => ({ ...prev, email: "" }));
                }}
                placeholder="you@company.com or EMP-XXXXXX"
                className={`w-full rounded-xl border py-2.5 pl-10 pr-3.5 ${
                  errors.email
                    ? "border-urgent focus:ring-urgent"
                    : "border-slate-300 focus:border-primary focus:ring-primary dark:border-slate-700"
                } bg-slate-50/50 text-sm text-slate-900 transition placeholder:text-slate-400 focus:outline-none focus:ring-2 disabled:opacity-50 dark:bg-slate-900 dark:text-white`}
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-xs font-medium text-urgent">
                {errors.email}
              </p>
            )}
          </div>

          {/* Password + Show/Hide Toggle */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label
                htmlFor="login-password"
                className="block text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200"
              >
                Password
              </label>
              <button
                type="button"
                onClick={() => setAuthMode("magic-link")}
                className="cursor-pointer text-xs font-semibold text-primary hover:text-primary-700 hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                id="login-password"
                name="password"
                type={showPassword ? "text" : "password"}
                disabled={lockoutRemaining > 0 || isLoading}
                value={formData.password}
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value });
                  if (errors.password)
                    setErrors((prev) => ({ ...prev, password: "" }));
                }}
                placeholder="•••••••••••"
                className={`w-full rounded-xl border py-2.5 pl-10 pr-11 ${
                  errors.password
                    ? "border-urgent focus:ring-urgent"
                    : "border-slate-300 focus:border-primary focus:ring-primary dark:border-slate-700"
                } bg-slate-50/50 text-sm text-slate-900 transition placeholder:text-slate-400 focus:outline-none focus:ring-2 disabled:opacity-50 dark:bg-slate-900 dark:text-white`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-3.5 text-slate-400 transition hover:text-slate-600 focus:outline-none dark:hover:text-slate-200"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs font-medium text-urgent">
                {errors.password}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || lockoutRemaining > 0}
            className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white shadow-md shadow-primary/25 transition-all hover:scale-[1.01] hover:bg-primary-700 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : lockoutRemaining > 0 ? (
              <span>Locked ({lockoutRemaining}s remaining)</span>
            ) : (
              <>
                <span>Sign In to Workspace</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>

          {/* Unified Role Guidance Box */}
          <div className="border-t border-slate-200 pt-4 text-center dark:border-slate-800">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-left dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-1 flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span>Smart Multi-Tenant Sign In</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                Log in with your registered work email. Your role (
                <strong>Admin / Founder</strong> or{" "}
                <strong>Team Employee</strong>) is automatically verified
                against your company workspace.
              </p>
            </div>
          </div>
        </form>
      )}

      {/* Magic Link Form */}
      {authMode === "magic-link" && (
        <form
          className="animate-fade-in space-y-4"
          onSubmit={handleMagicLinkSubmit}
          noValidate
        >
          {magicLinkSuccess ? (
            <div className="space-y-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center dark:border-emerald-800 dark:bg-emerald-950/40">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-950 dark:text-white">
                Check your email
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {magicLinkSuccess}
              </p>
              <button
                type="button"
                onClick={() => setMagicLinkSuccess(null)}
                className="mt-2 cursor-pointer text-xs font-bold text-primary hover:underline"
              >
                Send another link
              </button>
            </div>
          ) : (
            <>
              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                Enter your work email address and we&apos;ll send you a
                passwordless sign-in link with instant cryptographic
                verification.
              </p>

              <div>
                <label
                  htmlFor="magic-email"
                  className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200"
                >
                  Work Email
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    id="magic-email"
                    name="magicEmail"
                    type="email"
                    disabled={isLoading}
                    value={magicLinkEmail}
                    onChange={(e) => {
                      setMagicLinkEmail(e.target.value);
                      if (errors.magicEmail) setErrors({});
                    }}
                    placeholder="you@company.com"
                    className={`w-full rounded-xl border py-2.5 pl-10 pr-3.5 ${
                      errors.magicEmail
                        ? "border-urgent focus:ring-urgent"
                        : "border-slate-300 focus:border-primary focus:ring-primary dark:border-slate-700"
                    } bg-slate-50/50 text-sm text-slate-900 transition placeholder:text-slate-400 focus:outline-none focus:ring-2 disabled:opacity-50 dark:bg-slate-900 dark:text-white`}
                  />
                </div>
                {errors.magicEmail && (
                  <p className="mt-1 text-xs font-medium text-urgent">
                    {errors.magicEmail}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white shadow-md shadow-primary/25 transition-all hover:scale-[1.01] hover:bg-primary-700 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Sending Magic Link...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
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
        <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-2 text-xs text-slate-600 dark:text-slate-300">
          <h4 className="font-bold text-slate-900 dark:text-white">
            1. Multi-Tenant Organization Account
          </h4>
          <p>
            By signing in, you access your organization&apos;s multi-tenant
            partition secured by PostgreSQL Row-Level Security.
          </p>
          <h4 className="font-bold text-slate-900 dark:text-white">
            2. Acceptable Use
          </h4>
          <p>
            You agree not to attempt unauthorized access to other tenant
            organizations or overload system endpoints.
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
        <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-2 text-xs text-slate-600 dark:text-slate-300">
          <h4 className="font-bold text-slate-900 dark:text-white">
            1. Data Isolation
          </h4>
          <p>
            All employee and admin records are isolated by organization ID and
            encrypted with 256-bit TLS in transit.
          </p>
        </div>
      </Modal>
    </div>
  );
}
