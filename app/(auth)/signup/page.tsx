"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signupOrganization } from "@/app/(auth)/actions";
import { signupSchema, type SignupInput } from "@/lib/validators/auth";
import {
  Building2,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";

const MAX_ATTEMPTS = 5;
const COOLDOWN_SECONDS = 60;

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<SignupInput>({
    orgName: "",
    fullName: "",
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof SignupInput, string>>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Anti-Brute-Force & Rate-Limiting State
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);

  // Legal Modals State
  const [legalModal, setLegalModal] = useState<"privacy" | "terms" | null>(null);

  // Load lockout state from sessionStorage on mount
  useEffect(() => {
    try {
      const storedLockout = sessionStorage.getItem("tasq_signup_lockout_until");
      const storedAttempts = sessionStorage.getItem("tasq_signup_attempts");
      if (storedAttempts) {
        setFailedAttempts(parseInt(storedAttempts, 10) || 0);
      }
      if (storedLockout) {
        const remaining = Math.ceil((parseInt(storedLockout, 10) - Date.now()) / 1000);
        if (remaining > 0) {
          setLockoutRemaining(remaining);
        } else {
          sessionStorage.removeItem("tasq_signup_lockout_until");
        }
      }
    } catch {
      // Ignore storage errors in restricted contexts
    }
  }, []);

  // Cooldown countdown timer
  useEffect(() => {
    if (lockoutRemaining <= 0) return;

    const timer = setInterval(() => {
      setLockoutRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          try {
            sessionStorage.removeItem("tasq_signup_lockout_until");
            sessionStorage.setItem("tasq_signup_attempts", "0");
          } catch {}
          setFailedAttempts(0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [lockoutRemaining]);

  // Password strength calculation
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: "", color: "" };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd) || /[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd) && pwd.length >= 8) score++;

    if (score === 1) return { score: 1, label: "Weak", color: "bg-rose-500", text: "text-rose-500" };
    if (score === 2) return { score: 2, label: "Good", color: "bg-amber-500", text: "text-amber-500" };
    return { score: 3, label: "Strong", color: "bg-emerald-500", text: "text-emerald-500" };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear inline error on change
    if (errors[name as keyof SignupInput]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (serverError) setServerError(null);
  };

  const recordFailedAttempt = () => {
    const nextAttempts = failedAttempts + 1;
    setFailedAttempts(nextAttempts);
    try {
      sessionStorage.setItem("tasq_signup_attempts", nextAttempts.toString());
    } catch {}

    if (nextAttempts >= MAX_ATTEMPTS) {
      const lockoutUntil = Date.now() + COOLDOWN_SECONDS * 1000;
      try {
        sessionStorage.setItem("tasq_signup_lockout_until", lockoutUntil.toString());
      } catch {}
      setLockoutRemaining(COOLDOWN_SECONDS);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutRemaining > 0 || isLoading) return;

    setServerError(null);

    // Sanitize and validate input
    const sanitizedData: SignupInput = {
      orgName: formData.orgName.trim(),
      fullName: formData.fullName.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
    };

    // Validate with Zod
    const result = signupSchema.safeParse(sanitizedData);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof SignupInput, string>> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof SignupInput;
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
      const response = await signupOrganization(sanitizedData);
      if (!response.success) {
        setServerError(response.error || "Failed to create account. Please try again.");
        recordFailedAttempt();
        setIsLoading(false);
        return;
      }

      // Success: Reset rate limits
      try {
        sessionStorage.removeItem("tasq_signup_attempts");
        sessionStorage.removeItem("tasq_signup_lockout_until");
      } catch {}

      const orgId = response.data?.orgId || "";
      const orgName = encodeURIComponent(response.data?.orgName || sanitizedData.orgName);
      router.push(`/onboarding?org_id=${orgId}&org_name=${orgName}`);
    } catch (err: any) {
      setServerError(err.message || "An unexpected network error occurred.");
      recordFailedAttempt();
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Founding Admin Workspace Setup</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">
          Register Your Company
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1.5">
          Already registered?{" "}
          <Link
            href="/login"
            className="text-primary hover:text-primary-700 font-bold hover:underline transition"
          >
            Employee &amp; Team Login
          </Link>
        </p>
      </div>

      {/* Security Lockout Banner */}
      {lockoutRemaining > 0 && (
        <div className="mb-5 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-start gap-3 text-xs animate-shake">
          <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-600" />
          <div>
            <span className="font-bold block">Security Lockout Active</span>
            <p className="mt-0.5 text-[11px] leading-relaxed">
              Too many signup attempts detected. Form is locked for{" "}
              <strong className="font-bold underline">{lockoutRemaining}s</strong> to prevent automated spam and brute force.
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

      {/* Signup Form */}
      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        {/* Organization Name */}
        <div>
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1.5">
            Organization Name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Building2 className="w-4 h-4" />
            </div>
            <input
              type="text"
              name="orgName"
              disabled={lockoutRemaining > 0 || isLoading}
              value={formData.orgName}
              onChange={handleChange}
              placeholder="e.g. Revonza Studio"
              className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border ${
                errors.orgName
                  ? "border-urgent focus:ring-urgent"
                  : "border-slate-300 dark:border-slate-700 focus:ring-primary focus:border-primary"
              } bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 text-sm transition placeholder:text-slate-400 disabled:opacity-50`}
            />
          </div>
          {errors.orgName && (
            <p className="mt-1 text-xs text-urgent font-medium">{errors.orgName}</p>
          )}
        </div>

        {/* Admin Full Name */}
        <div>
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1.5">
            Your Full Name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <User className="w-4 h-4" />
            </div>
            <input
              type="text"
              name="fullName"
              disabled={lockoutRemaining > 0 || isLoading}
              value={formData.fullName}
              onChange={handleChange}
              placeholder="e.g. Tushar Singh"
              className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border ${
                errors.fullName
                  ? "border-urgent focus:ring-urgent"
                  : "border-slate-300 dark:border-slate-700 focus:ring-primary focus:border-primary"
              } bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 text-sm transition placeholder:text-slate-400 disabled:opacity-50`}
            />
          </div>
          {errors.fullName && (
            <p className="mt-1 text-xs text-urgent font-medium">{errors.fullName}</p>
          )}
        </div>

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
              name="email"
              disabled={lockoutRemaining > 0 || isLoading}
              value={formData.email}
              onChange={handleChange}
              placeholder="e.g. tusharsinghkumar04@gmail.com"
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
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1.5">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              disabled={lockoutRemaining > 0 || isLoading}
              value={formData.password}
              onChange={handleChange}
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

          {/* Password Strength Indicator */}
          {formData.password.length > 0 && (
            <div className="mt-2 space-y-1.5 animate-fade-in">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Password strength:</span>
                <span className={`font-bold ${passwordStrength.text}`}>
                  {passwordStrength.label}
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex gap-1">
                <div
                  className={`h-full transition-all duration-300 ${
                    passwordStrength.score >= 1 ? passwordStrength.color : "bg-transparent"
                  }`}
                  style={{ width: "33.33%" }}
                />
                <div
                  className={`h-full transition-all duration-300 ${
                    passwordStrength.score >= 2 ? passwordStrength.color : "bg-transparent"
                  }`}
                  style={{ width: "33.33%" }}
                />
                <div
                  className={`h-full transition-all duration-300 ${
                    passwordStrength.score >= 3 ? passwordStrength.color : "bg-transparent"
                  }`}
                  style={{ width: "33.33%" }}
                />
              </div>
            </div>
          )}

          {errors.password && (
            <p className="mt-1 text-xs text-urgent font-medium">{errors.password}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || lockoutRemaining > 0}
          className="w-full py-3 px-4 rounded-xl bg-primary hover:bg-primary-700 text-white font-bold text-sm shadow-md shadow-primary/25 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 mt-3 cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Creating Organization & Workspace...</span>
            </>
          ) : lockoutRemaining > 0 ? (
            <span>Locked ({lockoutRemaining}s remaining)</span>
          ) : (
            <>
              <span>Create Organization & Admin Account</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        {/* Terms & Privacy Notice */}
        <p className="text-[12px] text-center text-slate-500 dark:text-slate-400 mt-4 leading-relaxed">
          By signing up, you agree to our{" "}
          <button
            type="button"
            onClick={() => setLegalModal("terms")}
            className="text-primary hover:text-primary-700 font-semibold hover:underline cursor-pointer"
          >
            Terms of Service
          </button>{" "}
          and{" "}
          <button
            type="button"
            onClick={() => setLegalModal("privacy")}
            className="text-primary hover:text-primary-700 font-semibold hover:underline cursor-pointer"
          >
            Privacy Policy
          </button>
          .
        </p>
      </form>

      {/* Interactive Terms & Privacy Modals */}
      <Modal
        isOpen={legalModal === "terms"}
        onClose={() => setLegalModal(null)}
        title="Terms of Service"
        description="Last updated: January 2026"
        maxWidth="2xl"
      >
        <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300 max-h-[60vh] overflow-y-auto pr-2">
          <h4 className="font-bold text-slate-900 dark:text-white">1. Acceptance of Terms</h4>
          <p>
            By accessing or using TASQ-ONE Work OS, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the service.
          </p>
          <h4 className="font-bold text-slate-900 dark:text-white">2. Multi-Tenant Workspace & Security</h4>
          <p>
            Your organization workspace is isolated using strict PostgreSQL Row-Level Security (RLS). You are responsible for safeguarding your administrative credentials and controlling member permissions.
          </p>
          <h4 className="font-bold text-slate-900 dark:text-white">3. Fair Usage & AI Rate Limits</h4>
          <p>
            TASQ-ONE includes AI features powered by Groq Llama 3.3. Automated abuse, denial of service attempts, and reverse engineering are strictly prohibited.
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
          <h4 className="font-bold text-slate-900 dark:text-white">1. Data Privacy & Zero-Selling Guarantee</h4>
          <p>
            We strictly do not sell, rent, or monetize your company data or employee task descriptions to third-party data brokers or advertisers.
          </p>
          <h4 className="font-bold text-slate-900 dark:text-white">2. Encryption in Transit & At Rest</h4>
          <p>
            All network communication is encrypted using 256-bit TLS 1.3. Task data, file attachments, and audit logs are securely isolated by organization ID.
          </p>
          <h4 className="font-bold text-slate-900 dark:text-white">3. Data Deletion</h4>
          <p>
            Administrators can export audit logs or request total deletion of workspace data at any time via the admin dashboard.
          </p>
        </div>
      </Modal>
    </div>
  );
}
