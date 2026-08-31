"use client";

import React from "react";
import { ShieldCheck, Lock, Database, Key } from "lucide-react";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

export default function SecurityPolicyPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased selection:bg-indigo-500/20 selection:text-indigo-900">
      <MarketingNav />

      {/* Header Banner */}
      <section className="border-b border-slate-200 bg-slate-50/70 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-wider mb-3">
            <ShieldCheck className="w-4 h-4" />
            <span>Enterprise Security Architecture</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Security Policy &amp; Architecture
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
            Last Updated: August 31, 2026 • Verified Bank-Grade Tenant Isolation Standards
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 text-sm sm:text-base text-slate-700 leading-relaxed">
        {/* Intro callout */}
        <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs sm:text-sm text-emerald-950 space-y-1.5">
          <div className="font-bold flex items-center gap-2 text-emerald-900">
            <Lock className="w-4 h-4 text-emerald-600" />
            <span>Zero-Trust Cryptographic Isolation</span>
          </div>
          <p className="text-emerald-900">
            Every organization on TASQ-ONE is protected by PostgreSQL Row-Level Security (RLS) enforced at the database engine level, AES-256 encryption at rest, and TLS 1.3 in transit.
          </p>
        </div>

        {/* Section 1 */}
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">1. Data Isolation (Multi-Tenancy via RLS)</h2>
          <p>
            Every SQL query is evaluated against authenticated JWT claims. Even in the unlikely event of an application-layer logic defect, the database engine itself refuses to return or update another organization&apos;s records.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-indigo-600" />
                <span>11 Isolated Tables</span>
              </div>
              <p className="text-xs text-slate-600">Tasks, profiles, attachments, activity logs, comments, and squads all enforce RLS.</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <Key className="w-4 h-4 text-emerald-600" />
                <span>Custom JWT Auth Hook</span>
              </div>
              <p className="text-xs text-slate-600">Dynamically binds org_id and role into every authenticated session claim.</p>
            </div>
          </div>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">2. Encryption &amp; Credential Protection</h2>
          <ul className="space-y-2 list-disc list-inside text-slate-600">
            <li><strong>In Transit:</strong> All data is encrypted via TLS 1.3 with HSTS (HTTP Strict Transport Security) enabled.</li>
            <li><strong>At Rest:</strong> PostgreSQL database volumes and Cloudflare R2 object storage enforce AES-256 encryption.</li>
            <li><strong>Password Storage:</strong> Salted bcrypt/Argon2 hashes via Supabase GoTrue engine (plaintext passwords are never logged or stored).</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">3. Authentication &amp; DDoS Rate Limiting</h2>
          <p>
            - <strong>Distributed Token-Bucket Limits:</strong> Login, signup, and invite endpoints are protected by Upstash Redis (5 attempts per 5 minutes per IP).<br />
            - <strong>No Open Self-Registration:</strong> Employees and managers cannot self-register into existing organizations — single-use expiring invite tokens are strictly required.<br />
            - <strong>Strict 3-Way Role Confinement:</strong> Server-side middleware redirects unauthorized roles with HTTP 307.
          </p>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">4. Application Defense Practices</h2>
          <ul className="space-y-2 list-disc list-inside text-slate-600">
            <li><strong>SQL Injection:</strong> Parameterized queries exclusively via Supabase client SDK.</li>
            <li><strong>XSS Mitigation:</strong> React automatic HTML escaping and strict Content Security Policies (CSP).</li>
            <li><strong>SSRF Defense:</strong> Slack webhook URLs are validated against strict <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">https://hooks.slack.com/services/</code> domain allowlists.</li>
            <li><strong>AI Prompt Injection:</strong> Ephemeral zero-retention processing with strict system delimiter boundaries on Groq Llama 3.3 70B.</li>
          </ul>
        </section>

        {/* Section 5 */}
        <section className="space-y-3 pt-6 border-t border-slate-200">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">5. Responsible Vulnerability Disclosure</h2>
          <p>
            If you believe you have found a security vulnerability in TASQ-ONE, please report it responsibly directly to our engineering desk:
          </p>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-800">
            Email: <a href="mailto:tasqoneworkos@gmail.com" className="text-indigo-600 font-bold underline">tasqoneworkos@gmail.com</a> (Subject: Security Disclosure)
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
