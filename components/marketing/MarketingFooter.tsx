"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, Heart, Mail, MapPin, CheckCircle2, Lock, FileText, Check } from "lucide-react";
import { Modal } from "@/components/ui/modal";

export function MarketingFooter() {
  const [legalModal, setLegalModal] = useState<
    "privacy" | "terms" | "security" | "cookies" | "compliance" | "about" | "contact" | null
  >(null);

  return (
    <>
      <footer className="border-t border-slate-800 bg-slate-950 text-slate-400 py-12 sm:py-16 selection:bg-indigo-500/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10 mb-12">
            {/* Col 1: Brand & Mission */}
            <div className="space-y-4 lg:col-span-1">
              <Link href="/" className="inline-block">
                <Image
                  src="/ONE_Header.png"
                  alt="TASQ-ONE Logo"
                  width={200}
                  height={60}
                  className="h-10 w-auto object-contain brightness-0 invert"
                />
              </Link>
              <p className="text-xs text-slate-400 leading-relaxed">
                Intelligent Task Operating System for high-velocity teams. Eliminating WhatsApp chaos with AI task decomposition and immutable delivery tracking.
              </p>
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2 text-xs text-emerald-400">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>100% Isolated PostgreSQL RLS</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>Bengaluru HQ • India</span>
                </div>
              </div>
            </div>

            {/* Col 2: Products */}
            <div className="space-y-3.5">
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                Products &amp; OS
              </div>
              <ul className="space-y-2.5 text-xs">
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
                    Automated Slack Alerts
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-white transition-colors text-indigo-400 font-semibold">
                    Pricing Plans (₹0 Free)
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Solutions */}
            <div className="space-y-3.5">
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                Solutions
              </div>
              <ul className="space-y-2.5 text-xs">
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
              </ul>
            </div>

            {/* Col 4: Trust & Legal */}
            <div className="space-y-3.5">
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                Trust &amp; Legal
              </div>
              <ul className="space-y-2.5 text-xs">
                <li>
                  <button
                    type="button"
                    onClick={() => setLegalModal("security")}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Security (RLS &amp; AES-256)
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setLegalModal("compliance")}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    DPDP Act 2023 (India)
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setLegalModal("privacy")}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setLegalModal("terms")}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Terms of Service
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setLegalModal("cookies")}
                    className="hover:text-white transition-colors cursor-pointer text-left text-amber-300 font-semibold"
                  >
                    Cookie Preferences
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 5: Company & Support */}
            <div className="space-y-3.5">
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                Access &amp; Contact
              </div>
              <ul className="space-y-2.5 text-xs">
                <li>
                  <Link href="/signup" className="hover:text-white transition-colors">
                    Register Your Company
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-white transition-colors">
                    Staff &amp; Employee Login
                  </Link>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setLegalModal("contact")}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Contact Support
                  </button>
                </li>
                <li>
                  <a
                    href="mailto:tasqoneworkos@gmail.com"
                    className="hover:text-white transition-colors font-mono text-[11px] text-indigo-400"
                  >
                    tasqoneworkos@gmail.com
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div className="flex flex-wrap items-center gap-4 text-slate-400">
              <span>© {new Date().getFullYear()} TASQ-ONE Work OS. All rights reserved.</span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono font-bold text-indigo-300 border border-slate-700">
                ₹ INR Localized
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <span>Built for High-Velocity Teams Worldwide with</span>
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" />
            </div>
          </div>
        </div>
      </footer>

      {/* ======================================================================== */}
      {/* LEGAL & COMPLIANCE MODALS                                                */}
      {/* ======================================================================== */}
      {legalModal && (
        <Modal
          isOpen={!!legalModal}
          onClose={() => setLegalModal(null)}
          title={
            legalModal === "privacy"
              ? "Privacy Policy"
              : legalModal === "terms"
              ? "Terms of Service"
              : legalModal === "security"
              ? "Enterprise Security Architecture"
              : legalModal === "compliance"
              ? "DPDP Act 2023 Compliance (India)"
              : legalModal === "cookies"
              ? "Cookie Preferences & Consent"
              : "Contact Engineering & Support"
          }
          description={
            legalModal === "privacy"
              ? "How we protect, store, and process your organization data."
              : legalModal === "terms"
              ? "Fair usage guidelines, uptime SLA, and service agreements."
              : legalModal === "security"
              ? "PostgreSQL Row-Level Security, AES-256 encryption, and threat mitigations."
              : legalModal === "compliance"
              ? "Digital Personal Data Protection Act compliance and Indian data residency standards."
              : legalModal === "cookies"
              ? "Manage tracking preferences and session cookies."
              : "Reach our core engineering and customer success desk."
          }
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs sm:text-sm text-slate-600 max-h-[60vh] overflow-y-auto pr-2">
            {legalModal === "privacy" && (
              <div className="space-y-3">
                <p className="font-semibold text-slate-900">1. Data Ownership &amp; Tenant Isolation</p>
                <p>
                  All tasks, employee activity, file attachments, and workspace metadata belong exclusively to your organization. We enforce cryptographic Row-Level Security (RLS) at the PostgreSQL engine level.
                </p>
                <p className="font-semibold text-slate-900">2. Zero LLM Training on Customer Data</p>
                <p>
                  Prompts sent to the AI Task Decomposer (Groq Llama 3.3 70B) are ephemeral and never used to train foundational AI models.
                </p>
              </div>
            )}

            {legalModal === "terms" && (
              <div className="space-y-3">
                <p className="font-semibold text-slate-900">1. Fair Use &amp; Free Starter Pilot</p>
                <p>
                  The ₹0 Free Starter Pilot allows up to 5 team members with unlimited deliverables. No credit card or automated recurring charge is required.
                </p>
                <p className="font-semibold text-slate-900">2. Service Level Commitment</p>
                <p>
                  TASQ-ONE maintains a 99.9% uptime target backed by distributed edge nodes and multi-region database redundancy.
                </p>
              </div>
            )}

            {legalModal === "security" && (
              <div className="space-y-3">
                <p className="font-semibold text-slate-900">1. Cryptographic Multi-Tenancy</p>
                <p>
                  Every database query executes through PostgreSQL Row-Level Security verifying <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600">auth.jwt() -&gt; &apos;org_id&apos;</code>. Cross-tenant leakage is mathematically blocked.
                </p>
                <p className="font-semibold text-slate-900">2. Zero-Egress Storage Encryption</p>
                <p>
                  All task attachments and file assets are stored with tenant-scoped keys in Cloudflare R2 and encrypted at rest with AES-256.
                </p>
              </div>
            )}

            {legalModal === "compliance" && (
              <div className="space-y-3">
                <p className="font-semibold text-slate-900">1. DPDP Act 2023 Alignment</p>
                <p>
                  TASQ-ONE adheres to India&apos;s Digital Personal Data Protection Act (DPDP Act 2023), honoring employee right-to-forget and data minimization standards.
                </p>
                <p className="font-semibold text-slate-900">2. Data Residency</p>
                <p>
                  Indian customer data is processed with low-latency edge nodes and stored in ISO 27001 / SOC 2 Type II certified data centers.
                </p>
              </div>
            )}

            {legalModal === "cookies" && (
              <div className="space-y-3">
                <p className="font-semibold text-slate-900">Essential Session Cookies Only</p>
                <p>
                  TASQ-ONE utilizes strict, secure HTTP-only cookies exclusively for authentication sessions and CSRF token verification. We do not sell tracking cookies to third-party ad networks.
                </p>
              </div>
            )}

            {legalModal === "contact" && (
              <div className="space-y-3">
                <p className="font-semibold text-slate-900">Official Support Channels</p>
                <p>
                  For engineering assistance, enterprise onboarding, or security disclosures:
                </p>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center gap-2 text-slate-900 font-bold">
                    <Mail className="w-4 h-4 text-indigo-600" />
                    <a href="mailto:tasqoneworkos@gmail.com" className="text-indigo-600 hover:underline">
                      tasqoneworkos@gmail.com
                    </a>
                  </div>
                  <p className="text-xs text-slate-500">Response time: Within 2 business hours</p>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
