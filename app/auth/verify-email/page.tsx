"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/infrastructure/supabase/supabaseClient";
import {
  Mail,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
} from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const rawEmail = searchParams.get("email");
  const email = rawEmail ? decodeURIComponent(rawEmail) : "";

  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState<string>("");

  const handleResend = async () => {
    if (!email) {
      setResendStatus("error");
      setMessage("No email address provided. Please return to login.");
      return;
    }

    setIsResending(true);
    setResendStatus("idle");
    setMessage("");

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      });

      if (error) {
        setResendStatus("error");
        setMessage(error.message || "Failed to resend confirmation email.");
      } else {
        setResendStatus("success");
        setMessage(
          "Verification email has been resent. Please check your inbox and spam folder."
        );
      }
    } catch (err: any) {
      setResendStatus("error");
      setMessage(
        err?.message || "An unexpected error occurred while resending."
      );
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center shadow-2xl">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
        <Mail className="h-8 w-8 text-indigo-400" />
      </div>

      <h1 className="mb-2 text-2xl font-bold tracking-tight text-white">
        Verify your email address
      </h1>

      <p className="mb-6 text-sm leading-relaxed text-slate-400">
        We sent a verification link to{" "}
        <span className="font-semibold text-white">
          {email || "your email address"}
        </span>
        . Please click the link inside to activate your workspace access.
      </p>

      {resendStatus === "success" && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-emerald-800/80 bg-emerald-950/50 p-3.5 text-left text-xs text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{message}</span>
        </div>
      )}

      {resendStatus === "error" && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-rose-800/80 bg-rose-950/50 p-3.5 text-left text-xs text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{message}</span>
        </div>
      )}

      <div className="space-y-3">
        <button
          type="button"
          onClick={handleResend}
          disabled={isResending}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500 disabled:opacity-50"
        >
          {isResending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Resending Link...</span>
            </>
          ) : (
            <span>Resend Verification Email</span>
          )}
        </button>

        <Link
          href="/login"
          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-800/80 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
        >
          <span>Back to Login</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 py-12 text-white">
      <Suspense
        fallback={
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center shadow-2xl">
            <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-indigo-400" />
            <p className="text-sm text-slate-400">
              Loading verification details...
            </p>
          </div>
        }
      >
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
