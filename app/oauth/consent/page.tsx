"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, ArrowRight } from "lucide-react";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

export default function OAuthConsentPage() {
  return (
    <div className="flex min-h-screen flex-col justify-between bg-slate-950 text-white selection:bg-indigo-500/30">
      <MarketingNav />

      <main className="mx-auto max-w-md space-y-6 px-4 py-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-400 shadow-xl">
          <ShieldCheck className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black tracking-tight text-white">
            TASQ-ONE Identity Authorization
          </h1>
          <p className="text-xs leading-relaxed text-slate-400">
            Secure single sign-on &amp; OAuth 2.1 authentication protocol for
            TASQ-ONE Work OS.
          </p>
        </div>

        <div className="space-y-2 rounded-2xl border border-slate-800 bg-slate-900 p-4 text-left text-xs">
          <div className="font-bold text-slate-200">Authorized Scopes:</div>
          <ul className="list-inside list-disc space-y-1 text-slate-400">
            <li>Read organization profile &amp; membership</li>
            <li>Multi-tenant enterprise access tokens</li>
          </ul>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <Link
            href="/login"
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-lg transition-colors hover:bg-indigo-700"
          >
            <span>Proceed to Staff Login</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/signup"
            className="w-full rounded-xl border border-slate-700 bg-slate-800 py-2.5 text-center text-xs font-bold text-slate-300 transition-colors hover:bg-slate-700"
          >
            Register New Company
          </Link>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
