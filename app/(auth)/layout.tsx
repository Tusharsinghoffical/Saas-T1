import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { ShieldCheck, Lock, Sparkles } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col justify-between py-8 sm:py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white relative overflow-hidden">
      {/* Ambient background glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-96 bg-primary/5 dark:bg-primary/10 blur-3xl pointer-events-none rounded-full"
        aria-hidden="true"
      />

      {/* Top Header / Logo */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <div className="flex justify-center mb-3">
          <Logo size="lg" href="/" />
        </div>
      </div>

      {/* Main Auth Card */}
      <div className="sm:mx-auto sm:w-full sm:max-w-lg relative z-10 my-auto">
        <div className="bg-white dark:bg-slate-900 py-8 px-6 sm:py-10 sm:px-10 shadow-xl shadow-slate-900/5 dark:shadow-black/40 rounded-3xl border border-slate-200/80 dark:border-slate-800">
          {children}
        </div>
      </div>

      {/* Trust & Security Badges Footer */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10 pt-6">
        <div className="flex items-center justify-center gap-6 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>256-Bit TLS Security</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
            <span>Multi-Tenant RLS Isolated</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
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
