/**
 * TASQ-ONE Billing & Subscriptions Configuration
 * Feature Flag: Defaulted to OFF (false).
 * The app runs at $0/month until NEXT_PUBLIC_ENABLE_BILLING="true" is explicitly configured.
 */

export const FEATURE_FLAG_BILLING_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_BILLING === "true";

export function isBillingEnabled(): boolean {
  return FEATURE_FLAG_BILLING_ENABLED;
}

export interface BillingPlan {
  id: "free" | "pro" | "enterprise";
  name: string;
  priceMonthly: number;
  description: string;
  features: string[];
  stripePriceId?: string;
  highlighted?: boolean;
}

export const BILLING_PLANS: BillingPlan[] = [
  {
    id: "free",
    name: "Starter (₹0 Free Tier)",
    priceMonthly: 0,
    description: "Everything a growing Indian SMB needs to organize tasks and boost team productivity.",
    features: [
      "Up to 10 Team Members",
      "Interactive Sprint Kanban Board with Real-Time Sync",
      "Employee Focus Dashboard (Due Today / Upcoming)",
      "Groq AI Task Enhancement (30 req/hr)",
      "Cloudflare R2 File Attachments (10MB/file)",
      "Slack & WhatsApp Notification Webhooks",
      "Activity Audit Logs with GST Billing Compatibility",
    ],
  },
  {
    id: "pro",
    name: "SMB Pro",
    priceMonthly: 999,
    description: "Advanced AI acceleration, unlimited team members, and executive reporting.",
    features: [
      "Unlimited Organization Members",
      "Unlimited Tasks & Subtasks",
      "Priority Groq AI (Llama 3.3 70B)",
      "Weekly Executive AI Summary to Admins",
      "Advanced Task Dependency DAG Enforcement",
      "Slack, Email & WhatsApp Webhook Alerts",
      "Exportable CSV Audit Trails & GST Reports",
    ],
    stripePriceId: process.env.STRIPE_PRICE_ID_PRO,
    highlighted: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    priceMonthly: 2499,
    description: "Dedicated support, custom retention, and high-volume workloads with Indian data residency.",
    features: [
      "Everything in SMB Pro",
      "Unlimited Cloudflare R2 Storage",
      "Custom 99.99% SLA & Priority WhatsApp Support",
      "Dedicated PostgreSQL Tenant Isolation",
      "Custom AI Prompt Fine-Tuning & Indian Language Prompts",
    ],
    stripePriceId: process.env.STRIPE_PRICE_ID_ENTERPRISE,
  },
];
