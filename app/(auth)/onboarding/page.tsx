"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { completeOnboarding } from "@/app/(auth)/actions";
import { captureEvent } from "@/lib/analytics/posthog";
import {
  onboardingStep1Schema,
  onboardingStep3Schema,
  type InviteMemberInput,
} from "@/lib/validators/auth";
import {
  Building2,
  Users,
  CheckSquare,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  Check,
  Loader2,
  AlertCircle,
  Clock,
  Sparkles,
  Upload,
  FileText,
  Copy,
  ShieldCheck,
  X,
} from "lucide-react";

// Email regex matching standard RFC 5322 compliant addresses
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const MAX_INVITES = 50;

function OnboardingWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orgIdParam = searchParams.get("org_id") || "";
  const orgNameParam = searchParams.get("org_name") || "My Organization";

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Wizard state
  const [orgDetails, setOrgDetails] = useState({
    orgName: orgNameParam,
    timezone: "Asia/Kolkata",
  });

  // Step 2 Invites State
  const [invites, setInvites] = useState<InviteMemberInput[]>([
    { email: "", role: "employee" },
  ]);
  const [inviteMode, setInviteMode] = useState<"rows" | "bulk" | "file">("rows");
  const [bulkText, setBulkText] = useState("");
  const [bulkRole, setBulkRole] = useState<InviteMemberInput["role"]>("employee");
  const [bulkNotice, setBulkNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [firstTask, setFirstTask] = useState({
    taskTitle: "Setup company workspace & review OKRs",
    priority: "medium" as "low" | "medium" | "high" | "urgent",
    dueDate: "",
  });

  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (orgNameParam) {
      setOrgDetails((prev) => ({ ...prev, orgName: orgNameParam }));
    }
  }, [orgNameParam]);

  // Handle Step 1 Next
  const handleStep1Next = () => {
    setStepErrors({});
    const res = onboardingStep1Schema.safeParse(orgDetails);
    if (!res.success) {
      const errs: Record<string, string> = {};
      res.error.issues.forEach((issue) => {
        errs[issue.path[0] as string] = issue.message;
      });
      setStepErrors(errs);
      return;
    }
    setStep(2);
  };

  // Step 2: Individual Row Handlers
  const handleAddInvite = () => {
    if (invites.length >= MAX_INVITES) {
      setBulkNotice({
        type: "error",
        text: `Maximum limit of ${MAX_INVITES} teammates reached for initial onboarding.`,
      });
      return;
    }
    setInvites((prev) => [...prev, { email: "", role: "employee" }]);
  };

  const handleRemoveInvite = (index: number) => {
    setInvites((prev) => {
      const filtered = prev.filter((_, i) => i !== index);
      return filtered.length > 0 ? filtered : [{ email: "", role: "employee" }];
    });
  };

  const handleInviteChange = (
    index: number,
    field: keyof InviteMemberInput,
    value: string
  ) => {
    setInvites((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Step 2: Bulk Multi-Email Parser (Safe Extraction & Sanitization)
  const handleProcessBulkEmails = () => {
    setBulkNotice(null);
    if (!bulkText.trim()) {
      setBulkNotice({ type: "error", text: "Please enter or paste at least one email address." });
      return;
    }

    // Split by commas, semicolons, whitespace, tabs, and newlines
    const rawTokens = bulkText.split(/[\s,;]+/);
    const existingEmails = new Set(
      invites.map((inv) => inv.email.trim().toLowerCase()).filter(Boolean)
    );

    const validNewEmails: string[] = [];
    let invalidCount = 0;
    let duplicateCount = 0;

    rawTokens.forEach((token) => {
      // Sanitize: strip quotes, brackets, and extra symbols
      const cleanToken = token.replace(/^[<"']+|[>"',;]+$/g, "").trim().toLowerCase();
      if (!cleanToken) return;

      if (EMAIL_REGEX.test(cleanToken)) {
        if (existingEmails.has(cleanToken) || validNewEmails.includes(cleanToken)) {
          duplicateCount++;
        } else {
          validNewEmails.push(cleanToken);
        }
      } else {
        invalidCount++;
      }
    });

    if (validNewEmails.length === 0) {
      if (duplicateCount > 0) {
        setBulkNotice({
          type: "error",
          text: `All ${duplicateCount} email(s) are already in your invite queue.`,
        });
      } else {
        setBulkNotice({
          type: "error",
          text: `No valid email addresses detected. Please check formatting.`,
        });
      }
      return;
    }

    const availableSlots = MAX_INVITES - existingEmails.size;
    const emailsToAdd = validNewEmails.slice(0, availableSlots);

    const newInvites: InviteMemberInput[] = emailsToAdd.map((email) => ({
      email,
      role: bulkRole,
    }));

    // Filter out initial empty placeholder if present
    setInvites((prev) => {
      const filteredPrev = prev.filter((inv) => inv.email.trim().length > 0);
      return [...filteredPrev, ...newInvites];
    });

    setBulkText("");
    setBulkNotice({
      type: "success",
      text: `Successfully added ${emailsToAdd.length} teammate email(s)!${
        invalidCount > 0 ? ` (${invalidCount} invalid entries skipped)` : ""
      }${duplicateCount > 0 ? ` (${duplicateCount} duplicates merged)` : ""}`,
    });
  };

  // Step 2: File Upload (.csv or .txt) Parser
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBulkNotice(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Security check: File size limit (max 1MB to prevent memory exhaustion)
    if (file.size > 1024 * 1024) {
      setBulkNotice({
        type: "error",
        text: "File size exceeds 1MB limit. Please upload a smaller file.",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) {
        setBulkNotice({ type: "error", text: "Uploaded file is empty." });
        return;
      }

      setBulkText(content);
      setInviteMode("bulk");
      setBulkNotice({
        type: "success",
        text: `File "${file.name}" loaded! Review emails below and click "Add to Invite Queue".`,
      });
    };

    reader.onerror = () => {
      setBulkNotice({ type: "error", text: "Failed to read file content safely." });
    };

    reader.readAsText(file);
    // Reset file input value so user can re-upload if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClearAllInvites = () => {
    setInvites([{ email: "", role: "employee" }]);
    setBulkNotice(null);
  };

  const handleStep2Next = () => {
    // Filter out empty rows and validate remaining
    const validInvites = invites.filter((inv) => {
      const cleanEmail = inv.email.trim().toLowerCase();
      return cleanEmail.length > 0 && EMAIL_REGEX.test(cleanEmail);
    });

    setInvites(validInvites.length > 0 ? validInvites : [{ email: "", role: "employee" }]);
    setStep(3);
  };

  // Step 3 Finish
  const handleFinish = async (e: React.FormEvent) => {
    e.preventDefault();
    setStepErrors({});
    setServerError(null);

    const taskRes = onboardingStep3Schema.safeParse(firstTask);
    if (!taskRes.success) {
      const errs: Record<string, string> = {};
      taskRes.error.issues.forEach((issue) => {
        errs[issue.path[0] as string] = issue.message;
      });
      setStepErrors(errs);
      return;
    }

    setIsLoading(true);
    try {
      const validInvites = invites.filter((inv) => {
        const clean = inv.email.trim().toLowerCase();
        return clean.length > 0 && EMAIL_REGEX.test(clean);
      });

      const res = await completeOnboarding({
        orgId: orgIdParam,
        orgName: orgDetails.orgName,
        timezone: orgDetails.timezone,
        invites: validInvites,
        taskTitle: firstTask.taskTitle,
        priority: firstTask.priority,
        dueDate: firstTask.dueDate || undefined,
      });

      if (!res.success) {
        setServerError(res.error || "Failed to finalize workspace onboarding.");
        setIsLoading(false);
        return;
      }

      captureEvent("org_signup_completed", {
        orgId: orgIdParam,
        orgName: orgDetails.orgName,
        timezone: orgDetails.timezone,
        invitesCount: validInvites.length,
      });

      router.push(res.data?.redirectUrl || "/admin/dashboard");
    } catch (err: any) {
      setServerError(err.message || "An unexpected error occurred.");
      setIsLoading(false);
    }
  };

  const validInvitesCount = invites.filter((inv) => inv.email.trim().length > 0).length;

  return (
    <div>
      {/* Wizard Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
          <span>Step {step} of 3</span>
          <span className="text-primary font-extrabold">
            {step === 1 && "1. Organization Details"}
            {step === 2 && "2. Invite Teammates"}
            {step === 3 && "3. First Task Setup"}
          </span>
        </div>

        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
          <div
            className={`h-full bg-primary transition-all duration-300 rounded-full ${
              step === 1 ? "w-1/3" : step === 2 ? "w-2/3" : "w-full"
            }`}
          />
        </div>
      </div>

      {serverError && (
        <div className="mb-5 p-3.5 rounded-2xl bg-urgent/10 border border-urgent/20 flex items-start gap-2.5 text-xs text-urgent font-medium animate-fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{serverError}</span>
        </div>
      )}

      {/* STEP 1: Confirm Org Name & Timezone */}
      {step === 1 && (
        <div className="space-y-4 animate-fade-in">
          <div className="text-center mb-5">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center mb-2.5 shadow-sm">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-950 dark:text-white">
              Confirm Organization
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Customize your workspace name and default operational timezone.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1.5">
              Workspace Name
            </label>
            <input
              type="text"
              value={orgDetails.orgName}
              onChange={(e) => setOrgDetails({ ...orgDetails, orgName: e.target.value })}
              className={`w-full px-3.5 py-2.5 rounded-xl border ${
                stepErrors.orgName
                  ? "border-urgent focus:ring-urgent"
                  : "border-slate-300 dark:border-slate-700 focus:ring-primary focus:border-primary"
              } bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 text-sm font-medium transition`}
            />
            {stepErrors.orgName && (
              <p className="mt-1 text-xs text-urgent font-medium">{stepErrors.orgName}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1.5">
              Default Timezone
            </label>
            <select
              value={orgDetails.timezone}
              onChange={(e) => setOrgDetails({ ...orgDetails, timezone: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary text-sm font-medium transition"
            >
              <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
              <option value="America/New_York">America/New_York (EST / EDT)</option>
              <option value="America/Los_Angeles">America/Los_Angeles (PST / PDT)</option>
              <option value="Europe/London">Europe/London (GMT / BST)</option>
              <option value="Europe/Berlin">Europe/Berlin (CET)</option>
              <option value="Asia/Dubai">Asia/Dubai (GST +4:00)</option>
              <option value="Asia/Singapore">Asia/Singapore (SGT +8:00)</option>
              <option value="UTC">UTC (Universal Coordinated Time)</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleStep1Next}
            className="w-full mt-4 py-3 px-4 rounded-xl bg-primary hover:bg-primary-700 text-white font-bold text-sm shadow-md shadow-primary/25 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Continue to Teammates</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* STEP 2: Invite Teammates (Multiple Upload & Manual Entry) */}
      {step === 2 && (
        <div className="space-y-4 animate-fade-in">
          <div className="text-center mb-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center mb-2.5 shadow-sm">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-950 dark:text-white">
              Invite Your Team
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Add your colleagues now or skip and invite them later from admin settings.
            </p>
          </div>

          {/* Input Method Selector Tabs */}
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800/80 p-1 border border-slate-200 dark:border-slate-700 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setInviteMode("rows");
                setBulkNotice(null);
              }}
              className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                inviteMode === "rows"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <span>✍️ Row-by-Row</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setInviteMode("bulk");
                setBulkNotice(null);
              }}
              className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                inviteMode === "bulk"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <Copy className="w-3.5 h-3.5 text-primary" />
              <span>📋 Bulk Paste Emails</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setInviteMode("file");
                setBulkNotice(null);
              }}
              className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                inviteMode === "file"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <Upload className="w-3.5 h-3.5 text-indigo-500" />
              <span>📁 Upload CSV/TXT</span>
            </button>
          </div>

          {/* Feedback & Notice Banner */}
          {bulkNotice && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-start gap-2 animate-fade-in ${
                bulkNotice.type === "success"
                  ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                  : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300"
              }`}
            >
              {bulkNotice.type === "success" ? (
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">{bulkNotice.text}</div>
              <button
                type="button"
                onClick={() => setBulkNotice(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* TAB 1: Row-by-Row Manual Entry */}
          {inviteMode === "rows" && (
            <div className="space-y-2.5 animate-fade-in">
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {invites.map((invite, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="email"
                      placeholder="teammate@company.com"
                      value={invite.email}
                      onChange={(e) => handleInviteChange(index, "email", e.target.value)}
                      className="flex-1 px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none transition"
                    />

                    <select
                      value={invite.role}
                      onChange={(e) =>
                        handleInviteChange(index, "role", e.target.value as InviteMemberInput["role"])
                      }
                      className="px-2.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-primary focus:outline-none transition"
                    >
                      <option value="employee">Employee</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>

                    {invites.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveInvite(index)}
                        className="p-2 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                        title="Remove invite"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleAddInvite}
                className="w-full py-2.5 border border-dashed border-slate-300 dark:border-slate-700 hover:border-primary text-slate-600 dark:text-slate-400 hover:text-primary rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Another Teammate Row</span>
              </button>
            </div>
          )}

          {/* TAB 2: Bulk Multi-Email Paste Input */}
          {inviteMode === "bulk" && (
            <div className="space-y-3 animate-fade-in">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Paste Multiple Emails (Separated by commas, spaces, or new lines):
                </label>
                <textarea
                  rows={4}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder={`sarah@company.com, alex@agency.io\nmark@revonza.com; tech@acme.com`}
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none transition resize-none placeholder:text-slate-400"
                />
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Assign Default Role:
                  </label>
                  <select
                    value={bulkRole}
                    onChange={(e) => setBulkRole(e.target.value as InviteMemberInput["role"])}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-primary focus:outline-none"
                  >
                    <option value="employee">Employee (Task Assignee)</option>
                    <option value="manager">Manager (Task Creator)</option>
                    <option value="admin">Admin (Full Control)</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleProcessBulkEmails}
                  className="mt-4 px-4 py-2 rounded-xl bg-primary hover:bg-primary-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add to Queue</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: File Upload (.csv or .txt) */}
          {inviteMode === "file" && (
            <div className="space-y-3 animate-fade-in">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-primary p-6 rounded-2xl text-center cursor-pointer transition bg-slate-50/50 dark:bg-slate-900/50 hover:bg-primary/5 group"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".csv,.txt"
                  className="hidden"
                />
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-primary mx-auto flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Upload className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Click to select or drop a .CSV or .TXT file
                </h4>
                <p className="text-[11px] text-slate-500 mt-1">
                  Supports comma, semicolon, or line-delimited email spreadsheets (Max 1MB).
                </p>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 p-2.5 rounded-xl">
                <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                <span>Example CSV format: <code>name, email, role</code> or just a plain list of emails.</span>
              </div>
            </div>
          )}

          {/* Summary / Queue Card */}
          {validInvitesCount > 0 && (
            <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs animate-fade-in">
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold">
                <Users className="w-4 h-4 text-primary" />
                <span>
                  <strong className="font-bold text-primary">{validInvitesCount}</strong> teammate(s) queued for invites
                </span>
              </div>
              <button
                type="button"
                onClick={handleClearAllInvites}
                className="text-[11px] text-slate-500 hover:text-rose-500 font-semibold transition cursor-pointer"
              >
                Clear Queue
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={handleStep2Next}
              className="flex-1 py-3 px-4 rounded-xl bg-primary hover:bg-primary-700 text-white font-bold text-sm shadow-md shadow-primary/25 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{validInvitesCount > 0 ? `Continue with ${validInvitesCount} Invites` : "Skip / Continue to Task"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Create First Task */}
      {step === 3 && (
        <form onSubmit={handleFinish} className="space-y-4 animate-fade-in" noValidate>
          <div className="text-center mb-5">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center mb-2.5 shadow-sm">
              <CheckSquare className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-950 dark:text-white">
              Create Your First Task
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Kick off your workspace sprint board with an active starter deliverable.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1.5">
              Task Title
            </label>
            <input
              type="text"
              value={firstTask.taskTitle}
              onChange={(e) => setFirstTask({ ...firstTask, taskTitle: e.target.value })}
              placeholder="e.g., Launch Q3 product sprint & client deliverables"
              className={`w-full px-3.5 py-2.5 rounded-xl border ${
                stepErrors.taskTitle
                  ? "border-urgent focus:ring-urgent"
                  : "border-slate-300 dark:border-slate-700 focus:ring-primary focus:border-primary"
              } bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 text-sm font-medium transition`}
            />
            {stepErrors.taskTitle && (
              <p className="mt-1 text-xs text-urgent font-medium">{stepErrors.taskTitle}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1.5">
                Priority
              </label>
              <select
                value={firstTask.priority}
                onChange={(e) =>
                  setFirstTask({
                    ...firstTask,
                    priority: e.target.value as "low" | "medium" | "high" | "urgent",
                  })
                }
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-primary focus:outline-none transition"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent Priority</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1.5">
                Due Date (Optional)
              </label>
              <input
                type="date"
                value={firstTask.dueDate}
                onChange={(e) => setFirstTask({ ...firstTask, dueDate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-primary focus:outline-none transition"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-primary/5 dark:bg-primary/10 border border-primary/15 flex items-center gap-3 text-xs text-primary font-medium">
            <Sparkles className="w-4 h-4 flex-shrink-0" />
            <span>AI task delegation, workload balancing, and Slack alerts will activate automatically.</span>
          </div>

          <div className="flex items-center gap-3 pt-3">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-3 px-4 rounded-xl bg-primary hover:bg-primary-700 text-white font-bold text-sm shadow-md shadow-primary/25 transition flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Finalizing Workspace...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Launch Workspace</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
          Loading onboarding setup...
        </div>
      }
    >
      <OnboardingWizard />
    </Suspense>
  );
}
