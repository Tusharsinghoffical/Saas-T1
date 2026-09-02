"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/infrastructure/supabase/supabaseClient";
import { Mail, CheckCircle2, AlertCircle, Loader2, ArrowRight } from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const rawEmail = searchParams.get("email");
  const email = rawEmail ? decodeURIComponent(rawEmail) : "";

  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<"idle" | "success" | "error">("idle");
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
        setMessage("Verification email has been resent. Please check your inbox and spam folder.");
      }
    } catch (err: any) {
      setResendStatus("error");
      setMessage(err?.message || "An unexpected error occurred while resending.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-center">
      <div className="w-16 h-16 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-primary">
        <Mail className="w-8 h-8 text-indigo-400" />
      </div>

      <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
        Verify your email address
      </h1>

      <p className="text-slate-400 text-sm mb-6 leading-relaxed">
        We sent a verification link to{" "}
        <span className="font-semibold text-white">{email || "your email address"}</span>.
        Please click the link inside to activate your workspace access.
      </p>

      {resendStatus === "success" && (
        <div className="mb-6 p-3.5 bg-emerald-950/50 border border-emerald-800/80 rounded-xl text-emerald-300 text-xs flex items-center gap-2 text-left">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{message}</span>
        </div>
      )}

      {resendStatus === "error" && (
        <div className="mb-6 p-3.5 bg-rose-950/50 border border-rose-800/80 rounded-xl text-rose-300 text-xs flex items-center gap-2 text-left">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{message}</span>
        </div>
      )}

      <div className="space-y-3">
        <button
          type="button"
          onClick={handleResend}
          disabled={isResending}
          className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/20"
        >
          {isResending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Resending Link...</span>
            </>
          ) : (
            <span>Resend Verification Email</span>
          )}
        </button>

        <Link
          href="/login"
          className="w-full py-2.5 px-4 bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-sm font-medium rounded-xl transition flex items-center justify-center gap-1.5"
        >
          <span>Back to Login</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center px-4 py-12">
      <Suspense
        fallback={
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mx-auto mb-4" />
            <p className="text-slate-400 text-sm">Loading verification details...</p>
          </div>
        }
      >
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
