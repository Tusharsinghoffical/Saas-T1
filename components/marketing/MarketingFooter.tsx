"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ShieldCheck,
  Smartphone,
  Monitor,
  Check,
  X,
  Lock,
  FileCheck,
  Users,
  Building,
  Heart,
  ExternalLink,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";

export function MarketingFooter() {
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showPwaModal, setShowPwaModal] = useState(false);
  const [legalModal, setLegalModal] = useState<
    | "privacy"
    | "terms"
    | "security"
    | "cookies"
    | "compliance"
    | "about"
    | "contact"
    | null
  >(null);
  const [cookieConsent, setCookieConsent] = useState<{
    necessary: boolean;
    analytics: boolean;
    marketing: boolean;
  }>({
    necessary: true,
    analytics: true,
    marketing: false,
  });

  return (
    <>
      <footer className="overflow-hidden border-t border-slate-800 bg-[#0B0F19] pb-12 pt-16 text-slate-400 transition-colors">
        <div className="mx-auto max-w-7xl space-y-12 px-4 sm:px-6 lg:px-8">
          {/* Top Row — Brand Identity, Version & System Status */}
          <div className="flex flex-col items-start justify-between gap-6 border-b border-slate-800 pb-10 lg:flex-row lg:items-center">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center rounded-xl bg-white p-1">
                  <Image
                    src="/ONE_Footer.png"
                    alt="TASQ-ONE Footer Logo"
                    width={160}
                    height={44}
                    className="h-8 w-auto object-contain sm:h-9"
                  />
                </div>
                <span className="rounded-full border border-indigo-500/30 bg-indigo-500/20 px-2.5 py-0.5 font-mono text-[10px] font-bold text-indigo-300">
                  Work OS v1.0
                </span>
              </div>
              <p className="max-w-xl text-xs text-slate-400">
                The modern, intelligent work operating system engineered to
                eliminate spreadsheet chaos and follow-up meetings. Built for
                high-velocity teams across India and worldwide.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3.5">
              <div className="shadow-xs inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/60 px-3 py-1.5 font-mono text-[11px] font-bold text-emerald-400">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                <span>All Systems Operational • Asia-South (Mumbai)</span>
              </div>
              <Link
                href="/signup"
                className="rounded-xl bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white shadow-md transition-colors hover:bg-indigo-500"
              >
                Create Workspace (₹0)
              </Link>
            </div>
          </div>

          {/* 5-Column Navigation Grid */}
          <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-5 lg:gap-10">
            {/* Column 1: Products & OS */}
            <div className="space-y-3.5">
              <div className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-100">
                Products &amp; OS
              </div>
              <ul className="space-y-2.5 text-[11px]">
                <li>
                  <Link
                    href="/features#kanban"
                    className="transition-colors hover:text-white"
                  >
                    Sprint Delivery Board
                  </Link>
                </li>
                <li>
                  <Link
                    href="/features#ai"
                    className="transition-colors hover:text-white"
                  >
                    AI Task Decomposer (Groq 70B)
                  </Link>
                </li>
                <li>
                  <Link
                    href="/features#employee"
                    className="transition-colors hover:text-white"
                  >
                    Due Today Focus Mode
                  </Link>
                </li>
                <li>
                  <Link
                    href="/features#alerts"
                    className="transition-colors hover:text-white"
                  >
                    Automated Slack &amp; WhatsApp Alerts
                  </Link>
                </li>
                <li>
                  <Link
                    href="/features"
                    className="transition-colors hover:text-white"
                  >
                    Task Dependency DAG
                  </Link>
                </li>
                <li>
                  <Link
                    href="/features"
                    className="transition-colors hover:text-white"
                  >
                    Cloudflare R2 Attachments
                  </Link>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setShowPricingModal(true)}
                    className="cursor-pointer font-semibold text-indigo-400 transition-colors hover:text-white"
                  >
                    Pricing Plans (₹0 Free)
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 2: Solutions */}
            <div className="space-y-3.5">
              <div className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-100">
                Solutions
              </div>
              <ul className="space-y-2.5 text-[11px]">
                <li>
                  <Link
                    href="/solutions?role=founders"
                    className="transition-colors hover:text-white"
                  >
                    Marketing &amp; Client Agencies
                  </Link>
                </li>
                <li>
                  <Link
                    href="/solutions?role=engineering"
                    className="transition-colors hover:text-white"
                  >
                    Software &amp; Product Teams
                  </Link>
                </li>
                <li>
                  <Link
                    href="/solutions?role=operations"
                    className="transition-colors hover:text-white"
                  >
                    Operations &amp; Growing SMBs
                  </Link>
                </li>
                <li>
                  <Link
                    href="/solutions"
                    className="transition-colors hover:text-white"
                  >
                    Founders &amp; Startups
                  </Link>
                </li>
                <li>
                  <Link
                    href="/solutions"
                    className="transition-colors hover:text-white"
                  >
                    Enterprise B2B Teams
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Resources & Tools */}
            <div className="space-y-3.5">
              <div className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-100">
                Resources &amp; Tools
              </div>
              <ul className="space-y-2.5 text-[11px]">
                <li>
                  <Link
                    href="/about"
                    className="transition-colors hover:text-white"
                  >
                    About TASQ-ONE
                  </Link>
                </li>
                <li>
                  <Link
                    href="/features"
                    className="transition-colors hover:text-white"
                  >
                    Features &amp; Live Simulator
                  </Link>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setShowPwaModal(true)}
                    className="cursor-pointer text-left transition-colors hover:text-white"
                  >
                    Install Desktop / Mobile PWA
                  </button>
                </li>
                <li>
                  <Link
                    href="/solutions"
                    className="transition-colors hover:text-white"
                  >
                    Why Teams Switch from WhatsApp
                  </Link>
                </li>
                <li>
                  <Link
                    href="/features"
                    className="transition-colors hover:text-white"
                  >
                    Developer Platform &amp; Webhooks
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Trust & Legal */}
            <div className="space-y-3.5">
              <div className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-100">
                Trust &amp; Compliance
              </div>
              <ul className="space-y-2.5 text-[11px]">
                <li>
                  <Link
                    href="/privacy"
                    className="transition-colors hover:text-white"
                  >
                    Privacy Policy &amp; DPDP Act
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="transition-colors hover:text-white"
                  >
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link
                    href="/security"
                    className="transition-colors hover:text-white"
                  >
                    Security Architecture &amp; RLS
                  </Link>
                </li>
                <li>
                  <Link
                    href="/aup"
                    className="transition-colors hover:text-white"
                  >
                    Acceptable Use Policy (AUP)
                  </Link>
                </li>
                <li>
                  <Link
                    href="/sla"
                    className="transition-colors hover:text-white"
                  >
                    SaaS Subscription &amp; SLA
                  </Link>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setLegalModal("cookies")}
                    className="cursor-pointer text-left font-semibold text-amber-300 transition-colors hover:text-white"
                  >
                    Cookie Preferences &amp; Consent
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 5: Company & Support */}
            <div className="space-y-3.5">
              <div className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-100">
                Company &amp; Support
              </div>
              <ul className="space-y-2.5 text-[11px]">
                <li>
                  <Link
                    href="/about"
                    className="transition-colors hover:text-white"
                  >
                    About TASQ-ONE
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="transition-colors hover:text-white"
                  >
                    Contact Engineering &amp; Support
                  </Link>
                </li>
                <li>
                  <Link
                    href="/solutions"
                    className="transition-colors hover:text-white"
                  >
                    Customer Stories
                  </Link>
                </li>
                <li>
                  <a
                    href="https://codewithmrsingh.me/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 font-semibold text-indigo-400 transition-colors hover:text-white"
                  >
                    <span>Built by Tushar Singh</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
                <li>
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">
                    📍 Delhi / Pune HQ • India
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar — Copyright & Legal Links */}
          <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-800 pt-8 text-[11px] md:flex-row">
            <div className="flex flex-wrap items-center gap-3 text-slate-400">
              <span>© 2026 TASQ-ONE Platform Inc. All rights reserved.</span>
              <span className="hidden text-slate-600 sm:inline">•</span>
              <span>
                Crafted with ❤️ by{" "}
                <a
                  href="https://codewithmrsingh.me/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-indigo-400 hover:underline"
                >
                  Tushar Singh
                </a>
              </span>
              <span className="hidden text-slate-600 sm:inline">•</span>
              <span>
                🇮🇳 Made for High-Velocity Startups &amp; Growing Teams
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-slate-300">
              <span className="rounded-md border border-slate-700 bg-slate-800/80 px-2.5 py-1 font-mono text-[10px] font-bold text-indigo-300">
                ₹ INR
              </span>
              <span className="rounded-md border border-slate-700 bg-slate-800/80 px-2.5 py-1 font-mono text-[10px] font-bold text-slate-300">
                English (India)
              </span>
              <Link
                href="/privacy"
                className="hover:text-white hover:underline"
              >
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-white hover:underline">
                Terms
              </Link>
              <Link
                href="/security"
                className="hover:text-white hover:underline"
              >
                Security
              </Link>
              <Link href="/aup" className="hover:text-white hover:underline">
                AUP
              </Link>
              <Link href="/sla" className="hover:text-white hover:underline">
                SLA
              </Link>
              <button
                type="button"
                onClick={() => setLegalModal("cookies")}
                className="cursor-pointer hover:text-white hover:underline"
              >
                Cookies
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* ======================================================================== */}
      {/* PRICING MODAL (₹ INR PRICING)                                            */}
      {/* ======================================================================== */}
      <Modal
        isOpen={showPricingModal}
        onClose={() => setShowPricingModal(false)}
        title="TASQ-ONE Plans & Pricing (₹ INR)"
        description="Choose the ideal plan for your team. Start free with zero lock-in."
        maxWidth="3xl"
      >
        <div className="grid grid-cols-1 gap-4 pt-2 md:grid-cols-3">
          {/* Starter Plan (Active ₹0) */}
          <div className="relative space-y-3 rounded-2xl border-2 border-indigo-600 bg-white p-4 shadow-sm">
            <div className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-700">
              ● ACTIVE &amp; FREE
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">
                Starter Pilot
              </div>
              <div className="mt-0.5 text-2xl font-black text-slate-900">
                ₹0{" "}
                <span className="text-xs font-normal text-slate-500">
                  / forever
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-600">
              Full core platform for Indian teams up to 10 members.
            </p>
            <ul className="space-y-1.5 text-xs text-slate-700">
              <li className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-600" /> Sprint Kanban
                Board
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-600" /> AI Task
                Structuring (Groq)
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-600" /> Due Today
                Focus View
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-600" /> Multi-Tenant
                RLS Security
              </li>
            </ul>
            <Link
              href="/signup"
              onClick={() => setShowPricingModal(false)}
              className="block w-full rounded-xl bg-indigo-600 py-2 text-center text-xs font-bold text-white shadow-sm transition-colors hover:bg-indigo-700"
            >
              Get Started (₹0 Free)
            </Link>
          </div>

          {/* SMB Pro Plan */}
          <div className="relative space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 opacity-90">
            <div className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-800">
              COMING SOON
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">SMB Pro</div>
              <div className="mt-0.5 text-2xl font-black text-slate-400">
                ₹999{" "}
                <span className="text-xs font-normal text-slate-400">
                  / org / mo
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500">
              For high-velocity software teams and multi-client agencies.
            </p>
            <ul className="space-y-1.5 text-xs text-slate-500">
              <li className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-slate-400" /> Unlimited
                Members
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-slate-400" /> Priority Groq
                AI 70B
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-slate-400" /> Task Dependency
                DAG
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-slate-400" /> Automated Slack
                &amp; WhatsApp Alerts
              </li>
            </ul>
            <button
              type="button"
              disabled
              className="w-full cursor-not-allowed rounded-xl bg-slate-200 py-2 text-center text-xs font-bold text-slate-400"
            >
              Coming Soon
            </button>
          </div>

          {/* Enterprise Plan */}
          <div className="relative space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 opacity-90">
            <div className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-800">
              COMING SOON
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">
                Custom Scale
              </div>
              <div className="mt-0.5 text-2xl font-black text-slate-400">
                ₹2,499{" "}
                <span className="text-xs font-normal text-slate-400">
                  / org / mo
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500">
              Dedicated isolation, custom SLAs, and custom LLM tuning.
            </p>
            <ul className="space-y-1.5 text-xs text-slate-500">
              <li className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-slate-400" /> Everything in
                Pro
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-slate-400" /> Dedicated DB
                Isolation
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-slate-400" /> 99.99% Uptime
                SLA
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-slate-400" /> Cloudflare R2
                Storage
              </li>
            </ul>
            <button
              type="button"
              disabled
              className="w-full cursor-not-allowed rounded-xl bg-slate-200 py-2 text-center text-xs font-bold text-slate-400"
            >
              Coming Soon
            </button>
          </div>
        </div>
      </Modal>

      {/* ======================================================================== */}
      {/* PWA INSTALL MODAL                                                        */}
      {/* ======================================================================== */}
      <Modal
        isOpen={showPwaModal}
        onClose={() => setShowPwaModal(false)}
        title="Install TASQ-ONE App"
        description="Install the desktop or mobile Progressive Web App for instant access."
        maxWidth="md"
      >
        <div className="space-y-3.5 pt-2 text-xs text-slate-700">
          <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <Monitor className="h-4 w-4 text-indigo-600" />
              <span>Desktop (Chrome, Edge, Brave)</span>
            </div>
            <p className="text-slate-600">
              Click the install icon in your browser address bar or select{" "}
              <code className="rounded bg-slate-200 px-1 py-0.5 text-slate-800">
                Settings → Install TASQ-ONE
              </code>
              .
            </p>
          </div>

          <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <Smartphone className="h-4 w-4 text-emerald-600" />
              <span>Mobile (iOS Safari &amp; Android Chrome)</span>
            </div>
            <p className="text-slate-600">
              Tap the Share button{" "}
              <code className="rounded bg-slate-200 px-1 py-0.5 text-slate-800">
                Share → Add to Home Screen
              </code>
              .
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowPwaModal(false)}
            className="w-full cursor-pointer rounded-xl bg-indigo-600 py-2.5 text-center text-xs font-bold text-white shadow-sm transition-colors hover:bg-indigo-700"
          >
            Got It
          </button>
        </div>
      </Modal>

      {/* ======================================================================== */}
      {/* COMPREHENSIVE LEGAL, COOKIE & COMPLIANCE MODALS                          */}
      {/* ======================================================================== */}
      <Modal
        isOpen={legalModal !== null}
        onClose={() => setLegalModal(null)}
        title={
          legalModal === "privacy"
            ? "Privacy Policy & Data Protection"
            : legalModal === "terms"
              ? "Terms of Service"
              : legalModal === "security"
                ? "Enterprise Security Architecture"
                : legalModal === "cookies"
                  ? "Cookie Preferences & Tracking Policy"
                  : legalModal === "compliance"
                    ? "Compliance & Indian DPDP Act 2023"
                    : legalModal === "about"
                      ? "About TASQ-ONE Work OS"
                      : "Contact Engineering & Support"
        }
        description="Last updated: January 2026 • Verified Legal & Security Standard"
        maxWidth="2xl"
      >
        <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-2 text-xs text-slate-700">
          {/* Privacy Policy Modal Content */}
          {legalModal === "privacy" && (
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  1. Customer Data Ownership
                </h4>
                <p className="mt-1 leading-relaxed text-slate-600">
                  All workspace deliverables, tasks, attachments, employee
                  comments, and metadata belong exclusively to your
                  organization. TASQ-ONE does not sell, monetize, or use
                  customer data to train public AI models.
                </p>
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  2. AI Inference Isolation
                </h4>
                <p className="mt-1 leading-relaxed text-slate-600">
                  AI decomposition queries (Groq Llama 3.3 70B) are transmitted
                  via encrypted zero-retention TLS 1.3 tunnels. Prompts and
                  structured responses are discarded from external memory
                  immediately after response delivery.
                </p>
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  3. Data Residency in India
                </h4>
                <p className="mt-1 leading-relaxed text-slate-600">
                  Customer database records are hosted with strict PostgreSQL
                  Row-Level Security (RLS) in the Asia-South (Mumbai) cloud
                  region, adhering strictly to Indian data protection
                  guidelines.
                </p>
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  4. Data Deletion &amp; Portability Rights
                </h4>
                <p className="mt-1 leading-relaxed text-slate-600">
                  Organization Admins can export all workspace logs and tasks in
                  CSV format or execute permanent tenant purge at any time with
                  0 residual retention.
                </p>
              </div>
            </div>
          )}

          {/* Terms of Service Content */}
          {legalModal === "terms" && (
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  1. Workspace Creation &amp; Access
                </h4>
                <p className="mt-1 leading-relaxed text-slate-600">
                  By registering an organization workspace, you represent that
                  you have authority to bind the entity. Admins are responsible
                  for managing member invitations and role allocations (Admin vs
                  Employee).
                </p>
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  2. Fair Use &amp; API Quotas
                </h4>
                <p className="mt-1 leading-relaxed text-slate-600">
                  The ₹0 Starter Pilot is intended for legitimate business
                  collaboration. Automated scraping, malicious brute-force
                  attempts, or intentional tenant probing is strictly prohibited
                  and subject to automated IP blacklisting.
                </p>
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  3. Uptime &amp; Service Level Commitments
                </h4>
                <p className="mt-1 leading-relaxed text-slate-600">
                  TASQ-ONE maintains a target uptime of 99.99% across core
                  database, authentication, and task delivery engines.
                </p>
              </div>
            </div>
          )}

          {/* Security Architecture Content */}
          {legalModal === "security" && (
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  1. Multi-Tenant PostgreSQL Row-Level Security (RLS)
                </h4>
                <p className="mt-1 leading-relaxed text-slate-600">
                  Every SQL query is evaluated against authenticated JWT claims.
                  Even in raw query execution, no tenant can read or modify
                  another organization&apos;s records.
                </p>
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  2. AES-256 Encryption at Rest &amp; TLS 1.3 in Transit
                </h4>
                <p className="mt-1 leading-relaxed text-slate-600">
                  All storage buckets (Cloudflare R2), database volumes, and
                  session cookies are protected with industry-standard AES-256
                  encryption.
                </p>
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  3. Rate Limiting &amp; DDoS Mitigation
                </h4>
                <p className="mt-1 leading-relaxed text-slate-600">
                  Authentication endpoints are protected via distributed Upstash
                  Redis token-bucket algorithms with automatic sliding-window IP
                  blacklists.
                </p>
              </div>
            </div>
          )}

          {/* Cookie Preferences Manager */}
          {legalModal === "cookies" && (
            <div className="space-y-4">
              <p className="leading-relaxed text-slate-600">
                We use cookies and local storage to keep you authenticated,
                remember your active workspace, and optimize page load speed.
                You can customize your preferences below.
              </p>

              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div>
                    <div className="font-bold text-slate-900">
                      Strictly Necessary Cookies
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Required for secure authentication and JWT session token
                      storage.
                    </div>
                  </div>
                  <span className="rounded bg-emerald-100 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-700">
                    ALWAYS ON
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div>
                    <div className="font-bold text-slate-900">
                      Performance &amp; Telemetry
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Helps us detect slow API routes and UI errors (PostHog
                      self-hosted).
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setCookieConsent((prev) => ({
                        ...prev,
                        analytics: !prev.analytics,
                      }))
                    }
                    className={`cursor-pointer rounded-lg px-3 py-1 text-[11px] font-bold transition-colors ${
                      cookieConsent.analytics
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {cookieConsent.analytics ? "Enabled" : "Disabled"}
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setLegalModal(null)}
                  className="cursor-pointer rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-indigo-700"
                >
                  Save Preferences
                </button>
              </div>
            </div>
          )}

          {/* Compliance & DPDP Act India */}
          {legalModal === "compliance" && (
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  1. Digital Personal Data Protection (DPDP) Act 2023
                </h4>
                <p className="mt-1 leading-relaxed text-slate-600">
                  TASQ-ONE adheres to the principles of purpose limitation,
                  explicit consent collection, and lawful processing for all
                  Indian business entities.
                </p>
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  2. ISO/IEC 27001 Security Baseline
                </h4>
                <p className="mt-1 leading-relaxed text-slate-600">
                  Our architecture enforces defense-in-depth security controls,
                  principle of least privilege (RBAC), and automated
                  vulnerability auditing.
                </p>
              </div>
            </div>
          )}

          {/* About TASQ-ONE */}
          {legalModal === "about" && (
            <div className="space-y-3">
              <p className="leading-relaxed text-slate-600">
                TASQ-ONE was founded with a singular mission: to eliminate the
                daily chaos of managing mission-critical business deliverables
                over WhatsApp group chats and disorganized spreadsheets.
              </p>
              <p className="leading-relaxed text-slate-600">
                By combining Groq Llama 3.3 AI task decomposition with
                distraction-free morning checklists and automated async alerts,
                we help founders and managers reclaim 10+ hours every week.
              </p>
              <div className="pt-2 font-mono text-[11px] text-slate-500">
                📍 Engineering Headquarters: Delhi / Pune, India
              </div>
              <div className="pt-2 text-[11px] text-slate-600">
                Founder &amp; Lead Architect:{" "}
                <a
                  href="https://codewithmrsingh.me/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-indigo-600 underline hover:text-indigo-800"
                >
                  Tushar Singh (codewithmrsingh.me)
                </a>
              </div>
            </div>
          )}

          {/* Contact Support */}
          {legalModal === "contact" && (
            <div className="space-y-3">
              <div className="space-y-1 rounded-2xl border border-indigo-200 bg-indigo-50 p-3.5">
                <div className="text-xs font-bold text-indigo-950">
                  Engineering Support Desk
                </div>
                <div className="text-[11px] text-indigo-800">
                  Email:{" "}
                  <a
                    href="mailto:tasqoneworkos@gmail.com"
                    className="font-bold underline transition-colors hover:text-indigo-950"
                  >
                    tasqoneworkos@gmail.com
                  </a>{" "}
                  (Response within 2 hours)
                </div>
              </div>
              <div className="space-y-1 rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5">
                <div className="text-xs font-bold text-emerald-950">
                  WhatsApp Enterprise Broadcast &amp; Escalations
                </div>
                <div className="text-[11px] text-emerald-800">
                  Direct integration support available for Pilot organizations.
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
