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
  Briefcase,
  Users,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Turnstile } from "@/components/auth/Turnstile";

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<SignupInput>({
    orgName: "",
    fullName: "",
    email: "",
    password: "",
    companySize: "1-10",
    services: "IT & Software Development",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string>("");
  const [errors, setErrors] = useState<
    Partial<Record<keyof SignupInput, string>>
  >({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Legal Modals State
  const [legalModal, setLegalModal] = useState<"privacy" | "terms" | null>(
    null
  );

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

  const passwordStrength = getPasswordStrength(formData.password);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear inline error on change
    if (errors[name as keyof SignupInput]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (serverError) setServerError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    // Ensure turnstile token is provided or fallback
    let activeToken = turnstileToken;
    if (!activeToken) {
      const siteKey =
        process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "1x00000000000000000000AA";
      if (siteKey.startsWith("1x") || process.env.NODE_ENV !== "production") {
        activeToken = "1x00000000000000000000AA";
        setTurnstileToken(activeToken);
      } else {
        setServerError(
          "Please wait for or click the security verification check below before submitting."
        );
        return;
      }
    }

    // Sanitize and validate input
    const sanitizedData: SignupInput = {
      orgName: formData.orgName.trim(),
      fullName: formData.fullName.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      companySize: formData.companySize?.trim() || "1-10",
      services: formData.services?.trim() || "IT & Software Development",
      turnstileToken: activeToken,
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
      return;
    }

    setIsLoading(true);
    try {
      const response = await signupOrganization(sanitizedData);
      if (!response.success) {
        if (response.error?.toLowerCase().includes("turnstile")) {
          const siteKey =
            process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "1x00000000000000000000AA";
          if (siteKey.startsWith("1x") || process.env.NODE_ENV !== "production") {
            setTurnstileToken("1x0000000000000000000000000000000AA");
          }
        }
        setServerError(
          response.error || "Failed to create account. Please try again."
        );
        setIsLoading(false);
        return;
      }

      // Seamless direct entry into admin workspace
      router.push("/admin/dashboard?welcome=true");
    } catch (err: any) {
      if (
        err?.message?.includes("Server Action") ||
        err?.message?.includes("failed-to-find-server-action") ||
        err?.message?.includes("not found on the server")
      ) {
        window.location.reload();
        return;
      }
      setServerError(err.message || "An unexpected network error occurred.");
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 text-center">
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Founding Admin Workspace Setup</span>
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
          Register Your Company
        </h2>
        <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 sm:text-sm">
          Already registered?{" "}
          <Link
            href="/login"
            className="font-bold text-primary transition hover:text-primary-700 hover:underline"
          >
            Employee &amp; Team Login
          </Link>
        </p>
      </div>

      {/* Server Error Banner */}
      {serverError && (
        <div className="animate-fade-in mb-5 flex items-start gap-2.5 rounded-2xl border border-urgent/20 bg-urgent/10 p-3.5 text-xs font-medium text-urgent">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      {/* Signup Form */}
      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        {/* Organization Name */}
        <div>
          <label
            htmlFor="signup-orgName"
            className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200"
          >
            Organization Name
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <Building2 className="h-4 w-4" />
            </div>
            <input
              id="signup-orgName"
              type="text"
              name="orgName"
              disabled={isLoading}
              value={formData.orgName}
              onChange={handleChange}
              placeholder="e.g. Acme Corporation"
              className={`w-full rounded-xl border py-2.5 pl-10 pr-3.5 ${
                errors.orgName
                  ? "border-urgent focus:ring-urgent"
                  : "border-slate-300 focus:border-primary focus:ring-primary dark:border-slate-700"
              } bg-slate-50/50 text-sm text-slate-900 transition placeholder:text-slate-400 focus:outline-none focus:ring-2 disabled:opacity-50 dark:bg-slate-900 dark:text-white`}
            />
          </div>
          {errors.orgName && (
            <p className="mt-1 text-xs font-medium text-urgent">
              {errors.orgName}
            </p>
          )}
        </div>

        {/* Company Size & Services/Industry */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label
              htmlFor="signup-companySize"
              className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200"
            >
              Company Size
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Users className="h-4 w-4" />
              </div>
              <select
                id="signup-companySize"
                name="companySize"
                disabled={isLoading}
                value={formData.companySize || "1-10"}
                onChange={handleChange}
                className="w-full appearance-none rounded-xl border border-slate-300 bg-slate-50/50 py-2.5 pl-9 pr-8 text-xs font-medium text-slate-900 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white sm:text-sm"
              >
                <option value="1-10">1 – 10 Employees</option>
                <option value="11-50">11 – 50 Employees</option>
                <option value="51-200">51 – 200 Employees</option>
                <option value="201-500">201 – 500 Employees</option>
                <option value="500+">500+ Enterprise</option>
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="signup-services"
              className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200"
            >
              Industry / Services
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Briefcase className="h-4 w-4" />
              </div>
              <select
                id="signup-services"
                name="services"
                disabled={isLoading}
                value={formData.services || "IT & Software Development"}
                onChange={handleChange}
                className="w-full appearance-none rounded-xl border border-slate-300 bg-slate-50/50 py-2.5 pl-9 pr-8 text-xs font-medium text-slate-900 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white sm:text-sm"
              >
                <option value="IT & Software Development">IT &amp; Software Dev</option>
                <option value="Digital Marketing & Agency">Marketing &amp; Agency</option>
                <option value="Financial Services & Fintech">Fintech &amp; Finance</option>
                <option value="E-commerce & Retail">E-commerce &amp; Retail</option>
                <option value="Consulting & Operations">Consulting &amp; Ops</option>
                <option value="Education & Training">Education &amp; EdTech</option>
                <option value="Healthcare & Wellness">Healthcare</option>
                <option value="Other">Other Services</option>
              </select>
            </div>
          </div>
        </div>

        {/* Admin Full Name */}
        <div>
          <label
            htmlFor="signup-fullName"
            className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200"
          >
            Your Full Name
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <User className="h-4 w-4" />
            </div>
            <input
              id="signup-fullName"
              type="text"
              name="fullName"
              disabled={isLoading}
              value={formData.fullName}
              onChange={handleChange}
              placeholder="e.g. Alex Rivera"
              className={`w-full rounded-xl border py-2.5 pl-10 pr-3.5 ${
                errors.fullName
                  ? "border-urgent focus:ring-urgent"
                  : "border-slate-300 focus:border-primary focus:ring-primary dark:border-slate-700"
              } bg-slate-50/50 text-sm text-slate-900 transition placeholder:text-slate-400 focus:outline-none focus:ring-2 disabled:opacity-50 dark:bg-slate-900 dark:text-white`}
            />
          </div>
          {errors.fullName && (
            <p className="mt-1 text-xs font-medium text-urgent">
              {errors.fullName}
            </p>
          )}
        </div>

        {/* Work Email */}
        <div>
          <label
            htmlFor="signup-email"
            className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200"
          >
            Work Email
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <Mail className="h-4 w-4" />
            </div>
            <input
              id="signup-email"
              type="email"
              name="email"
              disabled={isLoading}
              value={formData.email}
              onChange={handleChange}
              placeholder="e.g. founder@acme.corp"
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
          <label
            htmlFor="signup-password"
            className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200"
          >
            Password
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <Lock className="h-4 w-4" />
            </div>
            <input
              id="signup-password"
              type={showPassword ? "text" : "password"}
              name="password"
              disabled={isLoading}
              value={formData.password}
              onChange={handleChange}
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

          {/* Password Strength Indicator */}
          {formData.password.length > 0 && (
            <div className="animate-fade-in mt-2 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Password strength:</span>
                <span className={`font-bold ${passwordStrength.text}`}>
                  {passwordStrength.label}
                </span>
              </div>
              <div className="flex h-1.5 w-full gap-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                <div
                  className={`h-full transition-all duration-300 ${
                    passwordStrength.score >= 1
                      ? passwordStrength.color
                      : "bg-transparent"
                  }`}
                  style={{ width: "33.33%" }}
                />
                <div
                  className={`h-full transition-all duration-300 ${
                    passwordStrength.score >= 2
                      ? passwordStrength.color
                      : "bg-transparent"
                  }`}
                  style={{ width: "33.33%" }}
                />
                <div
                  className={`h-full transition-all duration-300 ${
                    passwordStrength.score >= 3
                      ? passwordStrength.color
                      : "bg-transparent"
                  }`}
                  style={{ width: "33.33%" }}
                />
              </div>
            </div>
          )}

          {errors.password && (
            <p className="mt-1 text-xs font-medium text-urgent">
              {errors.password}
            </p>
          )}
        </div>

        {/* Cloudflare Turnstile Anti-Bot Verification */}
        <Turnstile
          onVerify={(token) => {
            setTurnstileToken(token);
            if (serverError) setServerError(null);
          }}
          onError={() => {
            setServerError(
              "Security check verification issue. Please reload the page."
            );
          }}
        />

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white shadow-md shadow-primary/25 transition-all hover:scale-[1.01] hover:bg-primary-700 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Creating Organization & Workspace...</span>
            </>
          ) : (
            <>
              <span>Create Organization & Admin Account</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>

        {/* Terms & Privacy Notice */}
        <p className="mt-4 text-center text-[12px] leading-relaxed text-slate-500 dark:text-slate-400">
          By signing up, you agree to our{" "}
          <button
            type="button"
            onClick={() => setLegalModal("terms")}
            className="cursor-pointer font-semibold text-primary hover:text-primary-700 hover:underline"
          >
            Terms of Service
          </button>{" "}
          and{" "}
          <button
            type="button"
            onClick={() => setLegalModal("privacy")}
            className="cursor-pointer font-semibold text-primary hover:text-primary-700 hover:underline"
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
        <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-2 text-xs text-slate-600 dark:text-slate-300">
          <h4 className="font-bold text-slate-900 dark:text-white">
            1. Acceptance of Terms
          </h4>
          <p>
            By accessing or using TASQ-ONE Work OS, you agree to be bound by
            these Terms of Service. If you do not agree to these terms, please
            do not use the service.
          </p>
          <h4 className="font-bold text-slate-900 dark:text-white">
            2. Multi-Tenant Workspace & Security
          </h4>
          <p>
            Your organization workspace is isolated using strict PostgreSQL
            Row-Level Security (RLS). You are responsible for safeguarding your
            administrative credentials and controlling member permissions.
          </p>
          <h4 className="font-bold text-slate-900 dark:text-white">
            3. Fair Usage & AI Rate Limits
          </h4>
          <p>
            TASQ-ONE includes AI features powered by Groq Llama 3.3. Automated
            abuse, denial of service attempts, and reverse engineering are
            strictly prohibited.
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
            1. Data Privacy & Zero-Selling Guarantee
          </h4>
          <p>
            We strictly do not sell, rent, or monetize your company data or
            employee task descriptions to third-party data brokers or
            advertisers.
          </p>
          <h4 className="font-bold text-slate-900 dark:text-white">
            2. Encryption in Transit & At Rest
          </h4>
          <p>
            All network communication is encrypted using 256-bit TLS 1.3. Task
            data, file attachments, and audit logs are securely isolated by
            organization ID.
          </p>
          <h4 className="font-bold text-slate-900 dark:text-white">
            3. Data Deletion
          </h4>
          <p>
            Administrators can export audit logs or request total deletion of
            workspace data at any time via the admin dashboard.
          </p>
        </div>
      </Modal>
    </div>
  );
}
