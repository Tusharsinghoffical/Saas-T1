"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, ArrowRight } from "lucide-react";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

export default function OAuthConsentPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between selection:bg-indigo-500/30">
      <MarketingNav />

      <main className="max-w-md mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto shadow-xl">
          <ShieldCheck className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black tracking-tight text-white">
            TASQ-ONE Identity Authorization
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            Secure single sign-on &amp; OAuth 2.1 authentication protocol for TASQ-ONE Work OS.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-left text-xs space-y-2">
          <div className="font-bold text-slate-200">Authorized Scopes:</div>
          <ul className="list-disc list-inside text-slate-400 space-y-1">
            <li>Read organization profile &amp; membership</li>
            <li>Multi-tenant enterprise access tokens</li>
          </ul>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <Link
            href="/login"
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-lg"
          >
            <span>Proceed to Staff Login</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/signup"
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs text-center transition-colors border border-slate-700"
          >
            Register New Company
          </Link>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
