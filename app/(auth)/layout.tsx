import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { ShieldCheck, Lock, Sparkles } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col justify-between overflow-hidden bg-slate-50 px-4 py-8 text-slate-900 dark:bg-slate-950 dark:text-white sm:px-6 sm:py-12 lg:px-8">
      {/* Ambient background glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-96 w-full max-w-5xl -translate-x-1/2 rounded-full bg-primary/5 blur-3xl dark:bg-primary/10"
        aria-hidden="true"
      />

      {/* Top Header / Logo */}
      <div className="relative z-10 text-center sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mb-3 flex justify-center">
          <Logo size="lg" href="/" />
        </div>
      </div>

      {/* Main Auth Card */}
      <div className="relative z-10 my-auto sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="rounded-3xl border border-slate-200/80 bg-white px-6 py-8 shadow-xl shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/40 sm:px-10 sm:py-10">
          {children}
        </div>
      </div>

      {/* Trust & Security Badges Footer */}
      <div className="relative z-10 pt-6 text-center sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex items-center justify-center gap-6 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>256-Bit TLS Security</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            <span>Multi-Tenant RLS Isolated</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>Zero-Cost Pilot Mode</span>
          </div>
        </div>
        <div className="mt-3 text-[11px] text-slate-400 dark:text-slate-500">
          © {new Date().getFullYear()} TASQ-ONE Work OS. All rights reserved.
        </div>
      </div>
    </div>
  );
}
