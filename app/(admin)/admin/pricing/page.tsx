"use client";

import React, { useState } from "react";
import { BILLING_PLANS, isBillingEnabled } from "@/lib/billing/config";
import {
  Check,
  Sparkles,
  Zap,
  ShieldCheck,
  CreditCard,
  Building,
  ArrowRight,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PricingPlansPage() {
  const billingActive = isBillingEnabled();
  const [currentPlan] = useState<string>("free");
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Transparent, Predictable SMB Pricing</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Plans that scale with your team
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Zero per-seat surprise fees. Flat organization pricing with generous free tiers.
        </p>
      </div>

      {/* Feature Flag Disabled Banner */}
      {!billingActive && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start sm:items-center gap-3 text-xs text-emerald-800 dark:text-emerald-300">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex-shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-sm">Pilot Program Active (₹0/month Forever Free)</span>
            <p className="mt-0.5 text-[11px] text-emerald-700 dark:text-emerald-400">
              TASQ-ONE is currently operating in pilot mode with zero cloud costs for Indian teams. All Pro capabilities (Groq AI, Kanban real-time sync, Cloudflare R2 attachments, Slack & WhatsApp webhooks) are available at no charge.
            </p>
          </div>
        </div>
      )}

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {BILLING_PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.id;
          const isPro = plan.id === "pro";

          return (
            <div
              key={plan.id}
              className={`relative rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-200 ${
                isPro
                  ? "bg-white dark:bg-slate-900 border-2 border-primary shadow-xl ring-4 ring-primary/10"
                  : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm"
              }`}
            >
              {isPro && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-white text-[11px] font-bold tracking-wide uppercase shadow-md shadow-primary/30">
                  Most Popular for Indian SMBs & Startups
                </div>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {plan.name}
                  </h3>
                  {isCurrent && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      Active
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 min-h-[32px]">
                  {plan.description}
                </p>

                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-900 dark:text-white">
                    ₹{plan.priceMonthly.toLocaleString("en-IN")}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {plan.priceMonthly === 0 ? "forever" : "/organization /month"}
                  </span>
                </div>

                <div className="mt-8 space-y-3">
                  <div className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Included Features:
                  </div>
                  <ul className="space-y-2.5">
                    {plan.features.map((feature, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300"
                      >
                        <Check className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800">
                {billingActive ? (
                  <Button
                    variant={isPro ? "primary" : "outline"}
                    className="w-full min-h-[44px] flex items-center justify-center gap-2"
                  >
                    {isCurrent ? (
                      "Current Plan"
                    ) : (
                      <>
                        <span>Upgrade to {plan.name}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    variant={isPro ? "primary" : "outline"}
                    disabled={isCurrent}
                    className="w-full min-h-[44px]"
                  >
                    {isCurrent ? "Active Free Tier" : "Included in Pilot"}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
