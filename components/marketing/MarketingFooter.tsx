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
    "privacy" | "terms" | "security" | "cookies" | "compliance" | "about" | "contact" | null
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
      <footer className="bg-[#0B0F19] text-slate-400 border-t border-slate-800 transition-colors pt-16 pb-12 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Top Row — Brand Identity, Version & System Status */}
          <div className="pb-10 border-b border-slate-800 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-1 rounded-xl bg-white flex items-center justify-center">
                  <Image
                    src="/ONE_Footer.png"
                    alt="TASQ-ONE Footer Logo"
                    width={160}
                    height={44}
                    className="h-8 sm:h-9 w-auto object-contain"
                  />
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono text-[10px] font-bold">
                  Work OS v1.0
                </span>
              </div>
              <p className="text-xs text-slate-400 max-w-xl">
                The modern, intelligent work operating system engineered to eliminate spreadsheet chaos and follow-up meetings. Built for high-velocity teams across India and worldwide.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3.5">
              <div className="inline-flex items-center gap-2 text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-500/30 font-bold shadow-xs">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>All Systems Operational • Asia-South (Mumbai)</span>
              </div>
              <Link
                href="/signup"
                className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-colors"
              >
                Create Workspace (₹0)
              </Link>
            </div>
          </div>

          {/* 5-Column Navigation Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-10">
            {/* Column 1: Products & OS */}
            <div className="space-y-3.5">
              <div className="text-[11px] font-mono font-bold text-slate-100 uppercase tracking-wider">
                Products &amp; OS
              </div>
              <ul className="space-y-2.5 text-[11px]">
                <li>
                  <Link href="/features#kanban" className="hover:text-white transition-colors">
                    Sprint Delivery Board
                  </Link>
                </li>
                <li>
                  <Link href="/features#ai" className="hover:text-white transition-colors">
                    AI Task Decomposer (Groq 70B)
                  </Link>
                </li>
                <li>
                  <Link href="/features#employee" className="hover:text-white transition-colors">
                    Due Today Focus Mode
                  </Link>
                </li>
                <li>
                  <Link href="/features#alerts" className="hover:text-white transition-colors">
                    Automated Slack &amp; WhatsApp Alerts
                  </Link>
                </li>
                <li>
                  <Link href="/features" className="hover:text-white transition-colors">
                    Task Dependency DAG
                  </Link>
                </li>
                <li>
                  <Link href="/features" className="hover:text-white transition-colors">
                    Cloudflare R2 Attachments
                  </Link>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setShowPricingModal(true)}
                    className="hover:text-white transition-colors cursor-pointer text-indigo-400 font-semibold"
                  >
                    Pricing Plans (₹0 Free)
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 2: Solutions */}
            <div className="space-y-3.5">
              <div className="text-[11px] font-mono font-bold text-slate-100 uppercase tracking-wider">
                Solutions
              </div>
              <ul className="space-y-2.5 text-[11px]">
                <li>
                  <Link href="/solutions?role=founders" className="hover:text-white transition-colors">
                    Marketing &amp; Client Agencies
                  </Link>
                </li>
                <li>
                  <Link href="/solutions?role=engineering" className="hover:text-white transition-colors">
                    Software &amp; Product Teams
                  </Link>
                </li>
                <li>
                  <Link href="/solutions?role=operations" className="hover:text-white transition-colors">
                    Operations &amp; Growing SMBs
                  </Link>
                </li>
                <li>
                  <Link href="/solutions" className="hover:text-white transition-colors">
                    Founders &amp; Startups
                  </Link>
                </li>
                <li>
                  <Link href="/solutions" className="hover:text-white transition-colors">
                    Enterprise B2B Teams
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Resources & Tools */}
            <div className="space-y-3.5">
              <div className="text-[11px] font-mono font-bold text-slate-100 uppercase tracking-wider">
                Resources &amp; Tools
              </div>
              <ul className="space-y-2.5 text-[11px]">
                <li>
                  <Link href="/pricing" className="hover:text-white transition-colors">
                    Pricing &amp; Free Pilot
                  </Link>
                </li>
                <li>
                  <Link href="/features" className="hover:text-white transition-colors">
                    Features &amp; Live Simulator
                  </Link>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setShowPwaModal(true)}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Install Desktop / Mobile PWA
                  </button>
                </li>
                <li>
                  <Link href="/solutions" className="hover:text-white transition-colors">
                    Why Teams Switch from WhatsApp
                  </Link>
                </li>
                <li>
                  <Link href="/features" className="hover:text-white transition-colors">
                    Developer Platform &amp; Webhooks
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Trust & Legal */}
            <div className="space-y-3.5">
              <div className="text-[11px] font-mono font-bold text-slate-100 uppercase tracking-wider">
                Trust &amp; Compliance
              </div>
              <ul className="space-y-2.5 text-[11px]">
                <li>
                  <Link href="/privacy" className="hover:text-white transition-colors">
                    Privacy Policy &amp; DPDP Act
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-white transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/security" className="hover:text-white transition-colors">
                    Security Architecture &amp; RLS
                  </Link>
                </li>
                <li>
                  <Link href="/aup" className="hover:text-white transition-colors">
                    Acceptable Use Policy (AUP)
                  </Link>
                </li>
                <li>
                  <Link href="/sla" className="hover:text-white transition-colors">
                    SaaS Subscription &amp; SLA
                  </Link>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setLegalModal("cookies")}
                    className="hover:text-white transition-colors cursor-pointer text-left text-amber-300 font-semibold"
                  >
                    Cookie Preferences &amp; Consent
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 5: Company & Support */}
            <div className="space-y-3.5">
              <div className="text-[11px] font-mono font-bold text-slate-100 uppercase tracking-wider">
                Company &amp; Support
              </div>
              <ul className="space-y-2.5 text-[11px]">
                <li>
                  <Link href="/about" className="hover:text-white transition-colors">
                    About TASQ-ONE
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white transition-colors">
                    Contact Engineering &amp; Support
                  </Link>
                </li>
                <li>
                  <Link href="/solutions" className="hover:text-white transition-colors">
                    Customer Stories
                  </Link>
                </li>
                <li>
                  <a
                    href="https://codewithmrsingh.me/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors flex items-center gap-1.5 text-indigo-400 font-semibold"
                  >
                    <span>Built by Tushar Singh</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
                <li>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px]">
                    📍 Delhi / Pune HQ • India
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar — Copyright & Legal Links */}
          <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px]">
            <div className="flex flex-wrap items-center gap-3 text-slate-400">
              <span>© 2026 TASQ-ONE Platform Inc. All rights reserved.</span>
              <span className="hidden sm:inline text-slate-600">•</span>
              <span>
                Crafted with ❤️ by{" "}
                <a
                  href="https://codewithmrsingh.me/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-400 font-bold hover:underline"
                >
                  Tushar Singh
                </a>
              </span>
              <span className="hidden sm:inline text-slate-600">•</span>
              <span>🇮🇳 Made for High-Velocity Startups &amp; Growing Teams</span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-slate-300">
              <span className="px-2.5 py-1 rounded-md bg-slate-800/80 text-[10px] font-mono font-bold text-indigo-300 border border-slate-700">
                ₹ INR
              </span>
              <span className="px-2.5 py-1 rounded-md bg-slate-800/80 text-[10px] font-mono font-bold text-slate-300 border border-slate-700">
                English (India)
              </span>
              <Link
                href="/privacy"
                className="hover:text-white hover:underline"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="hover:text-white hover:underline"
              >
                Terms
              </Link>
              <Link
                href="/security"
                className="hover:text-white hover:underline"
              >
                Security
              </Link>
              <Link
                href="/aup"
                className="hover:text-white hover:underline"
              >
                AUP
              </Link>
              <Link
                href="/sla"
                className="hover:text-white hover:underline"
              >
                SLA
              </Link>
              <button
                type="button"
                onClick={() => setLegalModal("cookies")}
                className="hover:text-white hover:underline cursor-pointer"
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Starter Plan (Active ₹0) */}
          <div className="p-4 rounded-2xl bg-white border-2 border-indigo-600 space-y-3 relative shadow-sm">
            <div className="inline-flex px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono font-bold">
              ● ACTIVE &amp; FREE
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">Starter Pilot</div>
              <div className="text-2xl font-black text-slate-900 mt-0.5">
                ₹0 <span className="text-xs text-slate-500 font-normal">/ forever</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-600">Full core platform for Indian teams up to 10 members.</p>
            <ul className="space-y-1.5 text-xs text-slate-700">
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600" /> Sprint Kanban Board
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600" /> AI Task Structuring (Groq)
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600" /> Due Today Focus View
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600" /> Multi-Tenant RLS Security
              </li>
            </ul>
            <Link
              href="/signup"
              onClick={() => setShowPricingModal(false)}
              className="block w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-center text-xs shadow-sm transition-colors"
            >
              Get Started (₹0 Free)
            </Link>
          </div>

          {/* SMB Pro Plan */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 relative opacity-90">
            <div className="inline-flex px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-mono font-bold">
              COMING SOON
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">SMB Pro</div>
              <div className="text-2xl font-black text-slate-400 mt-0.5">
                ₹999 <span className="text-xs text-slate-400 font-normal">/ org / mo</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500">For high-velocity software teams and multi-client agencies.</p>
            <ul className="space-y-1.5 text-xs text-slate-500">
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-slate-400" /> Unlimited Members
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-slate-400" /> Priority Groq AI 70B
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-slate-400" /> Task Dependency DAG
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-slate-400" /> Automated Slack &amp; WhatsApp Alerts
              </li>
            </ul>
            <button
              type="button"
              disabled
              className="w-full py-2 rounded-xl bg-slate-200 text-slate-400 font-bold text-center text-xs cursor-not-allowed"
            >
              Coming Soon
            </button>
          </div>

          {/* Enterprise Plan */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 relative opacity-90">
            <div className="inline-flex px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-mono font-bold">
              COMING SOON
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">Custom Scale</div>
              <div className="text-2xl font-black text-slate-400 mt-0.5">
                ₹2,499 <span className="text-xs text-slate-400 font-normal">/ org / mo</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500">Dedicated isolation, custom SLAs, and custom LLM tuning.</p>
            <ul className="space-y-1.5 text-xs text-slate-500">
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-slate-400" /> Everything in Pro
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-slate-400" /> Dedicated DB Isolation
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-slate-400" /> 99.99% Uptime SLA
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-slate-400" /> Cloudflare R2 Storage
              </li>
            </ul>
            <button
              type="button"
              disabled
              className="w-full py-2 rounded-xl bg-slate-200 text-slate-400 font-bold text-center text-xs cursor-not-allowed"
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
        <div className="space-y-3.5 text-xs text-slate-700 pt-2">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="font-bold text-slate-900 flex items-center gap-2">
              <Monitor className="w-4 h-4 text-indigo-600" />
              <span>Desktop (Chrome, Edge, Brave)</span>
            </div>
            <p className="text-slate-600">
              Click the install icon in your browser address bar or select{" "}
              <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">Settings → Install TASQ-ONE</code>.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="font-bold text-slate-900 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-600" />
              <span>Mobile (iOS Safari &amp; Android Chrome)</span>
            </div>
            <p className="text-slate-600">
              Tap the Share button{" "}
              <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">Share → Add to Home Screen</code>.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowPwaModal(false)}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-center text-xs transition-colors cursor-pointer shadow-sm"
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
        <div className="space-y-4 text-xs text-slate-700 max-h-[60vh] overflow-y-auto pr-2">
          {/* Privacy Policy Modal Content */}
          {legalModal === "privacy" && (
            <div className="space-y-3">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">1. Customer Data Ownership</h4>
                <p className="text-slate-600 mt-1 leading-relaxed">
                  All workspace deliverables, tasks, attachments, employee comments, and metadata belong exclusively to your organization. TASQ-ONE does not sell, monetize, or use customer data to train public AI models.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">2. AI Inference Isolation</h4>
                <p className="text-slate-600 mt-1 leading-relaxed">
                  AI decomposition queries (Groq Llama 3.3 70B) are transmitted via encrypted zero-retention TLS 1.3 tunnels. Prompts and structured responses are discarded from external memory immediately after response delivery.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">3. Data Residency in India</h4>
                <p className="text-slate-600 mt-1 leading-relaxed">
                  Customer database records are hosted with strict PostgreSQL Row-Level Security (RLS) in the Asia-South (Mumbai) cloud region, adhering strictly to Indian data protection guidelines.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">4. Data Deletion &amp; Portability Rights</h4>
                <p className="text-slate-600 mt-1 leading-relaxed">
                  Organization Admins can export all workspace logs and tasks in CSV format or execute permanent tenant purge at any time with 0 residual retention.
                </p>
              </div>
            </div>
          )}

          {/* Terms of Service Content */}
          {legalModal === "terms" && (
            <div className="space-y-3">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">1. Workspace Creation &amp; Access</h4>
                <p className="text-slate-600 mt-1 leading-relaxed">
                  By registering an organization workspace, you represent that you have authority to bind the entity. Admins are responsible for managing member invitations and role allocations (Admin vs Employee).
                </p>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">2. Fair Use &amp; API Quotas</h4>
                <p className="text-slate-600 mt-1 leading-relaxed">
                  The ₹0 Starter Pilot is intended for legitimate business collaboration. Automated scraping, malicious brute-force attempts, or intentional tenant probing is strictly prohibited and subject to automated IP blacklisting.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">3. Uptime &amp; Service Level Commitments</h4>
                <p className="text-slate-600 mt-1 leading-relaxed">
                  TASQ-ONE maintains a target uptime of 99.99% across core database, authentication, and task delivery engines.
                </p>
              </div>
            </div>
          )}

          {/* Security Architecture Content */}
          {legalModal === "security" && (
            <div className="space-y-3">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">1. Multi-Tenant PostgreSQL Row-Level Security (RLS)</h4>
                <p className="text-slate-600 mt-1 leading-relaxed">
                  Every SQL query is evaluated against authenticated JWT claims. Even in raw query execution, no tenant can read or modify another organization&apos;s records.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">2. AES-256 Encryption at Rest &amp; TLS 1.3 in Transit</h4>
                <p className="text-slate-600 mt-1 leading-relaxed">
                  All storage buckets (Cloudflare R2), database volumes, and session cookies are protected with industry-standard AES-256 encryption.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">3. Rate Limiting &amp; DDoS Mitigation</h4>
                <p className="text-slate-600 mt-1 leading-relaxed">
                  Authentication endpoints are protected via distributed Upstash Redis token-bucket algorithms with automatic sliding-window IP blacklists.
                </p>
              </div>
            </div>
          )}

          {/* Cookie Preferences Manager */}
          {legalModal === "cookies" && (
            <div className="space-y-4">
              <p className="text-slate-600 leading-relaxed">
                We use cookies and local storage to keep you authenticated, remember your active workspace, and optimize page load speed. You can customize your preferences below.
              </p>

              <div className="space-y-3 pt-1">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-bold text-slate-900">Strictly Necessary Cookies</div>
                    <div className="text-[11px] text-slate-500">Required for secure authentication and JWT session token storage.</div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    ALWAYS ON
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-bold text-slate-900">Performance &amp; Telemetry</div>
                    <div className="text-[11px] text-slate-500">Helps us detect slow API routes and UI errors (PostHog self-hosted).</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCookieConsent((prev) => ({ ...prev, analytics: !prev.analytics }))}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${cookieConsent.analytics
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-200 text-slate-600"
                      }`}
                  >
                    {cookieConsent.analytics ? "Enabled" : "Disabled"}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setLegalModal(null)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-sm"
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
                <h4 className="font-bold text-slate-900 text-sm">1. Digital Personal Data Protection (DPDP) Act 2023</h4>
                <p className="text-slate-600 mt-1 leading-relaxed">
                  TASQ-ONE adheres to the principles of purpose limitation, explicit consent collection, and lawful processing for all Indian business entities.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">2. ISO/IEC 27001 Security Baseline</h4>
                <p className="text-slate-600 mt-1 leading-relaxed">
                  Our architecture enforces defense-in-depth security controls, principle of least privilege (RBAC), and automated vulnerability auditing.
                </p>
              </div>
            </div>
          )}

          {/* About TASQ-ONE */}
          {legalModal === "about" && (
            <div className="space-y-3">
              <p className="text-slate-600 leading-relaxed">
                TASQ-ONE was founded with a singular mission: to eliminate the daily chaos of managing mission-critical business deliverables over WhatsApp group chats and disorganized spreadsheets.
              </p>
              <p className="text-slate-600 leading-relaxed">
                By combining Groq Llama 3.3 AI task decomposition with distraction-free morning checklists and automated async alerts, we help founders and managers reclaim 10+ hours every week.
              </p>
              <div className="pt-2 text-[11px] text-slate-500 font-mono">
                📍 Engineering Headquarters: Delhi / Pune, India
              </div>
              <div className="pt-2 text-[11px] text-slate-600">
                Founder &amp; Lead Architect:{" "}
                <a
                  href="https://codewithmrsingh.me/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 font-bold underline hover:text-indigo-800"
                >
                  Tushar Singh (codewithmrsingh.me)
                </a>
              </div>
            </div>
          )}

          {/* Contact Support */}
          {legalModal === "contact" && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 space-y-1">
                <div className="font-bold text-indigo-950 text-xs">Engineering Support Desk</div>
                <div className="text-[11px] text-indigo-800">
                  Email:{" "}
                  <a
                    href="mailto:tasqoneworkos@gmail.com"
                    className="font-bold underline hover:text-indigo-950 transition-colors"
                  >
                    tasqoneworkos@gmail.com
                  </a>{" "}
                  (Response within 2 hours)
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
                <div className="font-bold text-emerald-950 text-xs">WhatsApp Enterprise Broadcast &amp; Escalations</div>
                <div className="text-[11px] text-emerald-800">Direct integration support available for Pilot organizations.</div>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
