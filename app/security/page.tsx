"use client";

import React from "react";
import { ShieldCheck, Lock, Database, Key } from "lucide-react";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

export default function SecurityPolicyPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 antialiased selection:bg-indigo-500/20 selection:text-indigo-900">
      <MarketingNav />

      {/* Header Banner */}
      <section className="border-b border-slate-200 bg-slate-50/70 py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600">
            <ShieldCheck className="h-4 w-4" />
            <span>Enterprise Security Architecture</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Security Policy &amp; Architecture
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
            Last Updated: August 31, 2026 • Verified Bank-Grade Tenant Isolation
            Standards
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl space-y-10 px-4 py-12 text-sm leading-relaxed text-slate-700 sm:px-6 sm:text-base lg:px-8">
        {/* Intro callout */}
        <div className="space-y-1.5 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 text-xs text-emerald-950 sm:text-sm">
          <div className="flex items-center gap-2 font-bold text-emerald-900">
            <Lock className="h-4 w-4 text-emerald-600" />
            <span>Zero-Trust Cryptographic Isolation</span>
          </div>
          <p className="text-emerald-900">
            Every organization on TASQ-ONE is protected by PostgreSQL Row-Level
            Security (RLS) enforced at the database engine level, AES-256
            encryption at rest, and TLS 1.3 in transit.
          </p>
        </div>

        {/* Section 1 */}
        <section className="space-y-4">
          <h2 className="text-xl font-black text-slate-900 sm:text-2xl">
            1. Data Isolation (Multi-Tenancy via RLS)
          </h2>
          <p>
            Every SQL query is evaluated against authenticated JWT claims. Even
            in the unlikely event of an application-layer logic defect, the
            database engine itself refuses to return or update another
            organization&apos;s records.
          </p>
          <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
            <div className="space-y-1 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <Database className="h-4 w-4 text-indigo-600" />
                <span>11 Isolated Tables</span>
              </div>
              <p className="text-xs text-slate-600">
                Tasks, profiles, attachments, activity logs, comments, and
                squads all enforce RLS.
              </p>
            </div>
            <div className="space-y-1 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <Key className="h-4 w-4 text-emerald-600" />
                <span>Custom JWT Auth Hook</span>
              </div>
              <p className="text-xs text-slate-600">
                Dynamically binds org_id and role into every authenticated
                session claim.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-xl font-black text-slate-900 sm:text-2xl">
            2. Encryption &amp; Credential Protection
          </h2>
          <ul className="list-inside list-disc space-y-2 text-slate-600">
            <li>
              <strong>In Transit:</strong> All data is encrypted via TLS 1.3
              with HSTS (HTTP Strict Transport Security) enabled.
            </li>
            <li>
              <strong>At Rest:</strong> PostgreSQL database volumes and
              Cloudflare R2 object storage enforce AES-256 encryption.
            </li>
            <li>
              <strong>Password Storage:</strong> Salted bcrypt/Argon2 hashes via
              Supabase GoTrue engine (plaintext passwords are never logged or
              stored).
            </li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="text-xl font-black text-slate-900 sm:text-2xl">
            3. Authentication &amp; DDoS Rate Limiting
          </h2>
          <p>
            - <strong>Distributed Token-Bucket Limits:</strong> Login, signup,
            and invite endpoints are protected by Upstash Redis (5 attempts per
            5 minutes per IP).
            <br />- <strong>No Open Self-Registration:</strong> Employees and
            managers cannot self-register into existing organizations —
            single-use expiring invite tokens are strictly required.
            <br />- <strong>Strict 3-Way Role Confinement:</strong> Server-side
            middleware redirects unauthorized roles with HTTP 307.
          </p>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="text-xl font-black text-slate-900 sm:text-2xl">
            4. Application Defense Practices
          </h2>
          <ul className="list-inside list-disc space-y-2 text-slate-600">
            <li>
              <strong>SQL Injection:</strong> Parameterized queries exclusively
              via Supabase client SDK.
            </li>
            <li>
              <strong>XSS Mitigation:</strong> React automatic HTML escaping and
              strict Content Security Policies (CSP).
            </li>
            <li>
              <strong>SSRF Defense:</strong> Slack webhook URLs are validated
              against strict{" "}
              <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">
                https://hooks.slack.com/services/
              </code>{" "}
              domain allowlists.
            </li>
            <li>
              <strong>AI Prompt Injection:</strong> Ephemeral zero-retention
              processing with strict system delimiter boundaries on Groq Llama
              3.3 70B.
            </li>
          </ul>
        </section>

        {/* Section 5 */}
        <section className="space-y-3 border-t border-slate-200 pt-6">
          <h2 className="text-xl font-black text-slate-900 sm:text-2xl">
            5. Responsible Vulnerability Disclosure
          </h2>
          <p>
            If you believe you have found a security vulnerability in TASQ-ONE,
            please report it responsibly directly to our engineering desk:
          </p>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-xs text-slate-800">
            Email:{" "}
            <a
              href="mailto:tasqoneworkos@gmail.com"
              className="font-bold text-indigo-600 underline"
            >
              tasqoneworkos@gmail.com
            </a>{" "}
            (Subject: Security Disclosure)
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
