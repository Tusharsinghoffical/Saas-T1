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
    <div className="animate-fade-in mx-auto max-w-6xl space-y-8 pb-16">
      {/* Header */}
      <div className="mx-auto max-w-2xl space-y-3 text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Transparent, Predictable SMB Pricing</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
          Plans that scale with your team
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Zero per-seat surprise fees. Flat organization pricing with generous
          free tiers.
        </p>
      </div>

      {/* Feature Flag Disabled Banner */}
      {!billingActive && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs text-emerald-800 dark:text-emerald-300 sm:items-center">
          <div className="flex-shrink-0 rounded-xl bg-emerald-500/20 p-2 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <span className="text-sm font-bold">
              Pilot Program Active (₹0/month Forever Free)
            </span>
            <p className="mt-0.5 text-[11px] text-emerald-700 dark:text-emerald-400">
              TASQ-ONE is currently operating in pilot mode with zero cloud
              costs for Indian teams. All Pro capabilities (Groq AI, Kanban
              real-time sync, Cloudflare R2 attachments, Slack & WhatsApp
              webhooks) are available at no charge.
            </p>
          </div>
        </div>
      )}

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-3">
        {BILLING_PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.id;
          const isPro = plan.id === "pro";

          return (
            <div
              key={plan.id}
              className={`relative flex flex-col justify-between rounded-3xl p-6 transition-all duration-200 sm:p-8 ${
                isPro
                  ? "border-2 border-primary bg-white shadow-xl ring-4 ring-primary/10 dark:bg-slate-900"
                  : "border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
              }`}
            >
              {isPro && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white shadow-md shadow-primary/30">
                  Most Popular for Indian SMBs & Startups
                </div>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {plan.name}
                  </h3>
                  {isCurrent && (
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      Active
                    </span>
                  )}
                </div>

                <p className="mt-2 min-h-[32px] text-xs text-slate-500 dark:text-slate-400">
                  {plan.description}
                </p>

                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-900 dark:text-white">
                    ₹{plan.priceMonthly.toLocaleString("en-IN")}
                  </span>
                  <span className="text-xs font-medium text-slate-500">
                    {plan.priceMonthly === 0
                      ? "forever"
                      : "/organization /month"}
                  </span>
                </div>

                <div className="mt-8 space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Included Features:
                  </div>
                  <ul className="space-y-2.5">
                    {plan.features.map((feature, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300"
                      >
                        <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-8 border-t border-slate-100 pt-4 dark:border-slate-800">
                {billingActive ? (
                  <Button
                    variant={isPro ? "primary" : "outline"}
                    className="flex min-h-[44px] w-full items-center justify-center gap-2"
                  >
                    {isCurrent ? (
                      "Current Plan"
                    ) : (
                      <>
                        <span>Upgrade to {plan.name}</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    variant={isPro ? "primary" : "outline"}
                    disabled={isCurrent}
                    className="min-h-[44px] w-full"
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
