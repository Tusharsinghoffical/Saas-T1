"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Mail,
  Send,
  CheckCircle2,
  Copy,
  Clock,
  Building,
  User,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  Zap,
  HelpCircle,
  Bug,
  Briefcase,
} from "lucide-react";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

interface QueryTemplate {
  id: string;
  label: string;
  icon: React.ElementType;
  subject: string;
  defaultMessage: string;
}

const QUERY_TEMPLATES: QueryTemplate[] = [
  {
    id: "pilot",
    label: "Free Pilot Onboarding",
    icon: Zap,
    subject: "TASQ-ONE Pilot Onboarding Request",
    defaultMessage:
      "Hi TASQ-ONE Team,\n\nWe would like assistance setting up our free 5-member starter pilot for our organization. Here are our details:\n\n- Company Name:\n- Team Size:\n- Current Workflow (WhatsApp / Spreadsheets):\n\nPlease guide us on the next steps.",
  },
  {
    id: "enterprise",
    label: "Enterprise SLA & Security",
    icon: ShieldCheck,
    subject: "Enterprise Security & SLA Due Diligence Inquiry",
    defaultMessage:
      "Hi TASQ-ONE Security & Architecture Team,\n\nWe are evaluating TASQ-ONE for our team and require due diligence documentation regarding:\n\n- PostgreSQL Row-Level Security (RLS) data isolation\n- Custom 99.99% SLA terms\n- Indian DPDP Act 2023 compliance addendum\n\nLooking forward to hearing from you.",
  },
  {
    id: "bug",
    label: "Bug Report & Technical Support",
    icon: Bug,
    subject: "Technical Support / Bug Report",
    defaultMessage:
      "Hi Engineering Support,\n\nI encountered an issue while using TASQ-ONE. Here are the reproduction details:\n\n- Affected Page / URL:\n- Browser / Device:\n- Steps to reproduce:\n- Expected vs actual behavior:\n\nThank you.",
  },
  {
    id: "feature",
    label: "Custom Feature Request",
    icon: Sparkles,
    subject: "Feature Suggestion / Integration Request",
    defaultMessage:
      "Hi TASQ-ONE Product Team,\n\nI have a suggestion that would enhance our daily workflow:\n\n- Proposed Feature / Integration:\n- How it would help our team:\n\nThanks for building a great Work OS!",
  },
  {
    id: "general",
    label: "General Inquiry / Founder Chat",
    icon: Briefcase,
    subject: "General Inquiry / Partnership",
    defaultMessage:
      "Hi Tushar & TASQ-ONE Team,\n\nI would like to connect regarding:\n\n- Purpose of inquiry:\n- Best contact number / time:\n\nRegards,",
  },
];

export default function ContactPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("pilot");
  const [senderName, setSenderName] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [customSubject, setCustomSubject] = useState(
    QUERY_TEMPLATES[0].subject
  );
  const [messageBody, setMessageBody] = useState(
    QUERY_TEMPLATES[0].defaultMessage
  );
  const [copied, setCopied] = useState(false);

  const handleTemplateChange = (tmplId: string) => {
    setSelectedTemplate(tmplId);
    const tmpl = QUERY_TEMPLATES.find((t) => t.id === tmplId);
    if (tmpl) {
      setCustomSubject(tmpl.subject);
      setMessageBody(tmpl.defaultMessage);
    }
  };

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    const finalBody = `Name: ${senderName || "Not specified"}\nEmail: ${
      senderEmail || "Not specified"
    }\nCompany: ${companyName || "Not specified"}\n\n---\nMessage:\n${messageBody}`;

    const mailtoUrl = `mailto:tasqoneworkos@gmail.com?subject=${encodeURIComponent(
      customSubject
    )}&body=${encodeURIComponent(finalBody)}`;

    // Redirect directly to default mail client
    if (typeof window !== "undefined") {
      window.location.href = mailtoUrl;
    }
  };

  const handleCopyEmail = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText("tasqoneworkos@gmail.com");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 antialiased selection:bg-indigo-500/20 selection:text-indigo-900">
      <MarketingNav />

      {/* Header Banner */}
      <section className="border-b border-slate-200 bg-slate-50/70 py-12 sm:py-16">
        <div className="mx-auto max-w-4xl space-y-3 px-4 text-center sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
            <Clock className="h-3.5 w-3.5" />
            <span>Response within 2 Business Hours</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
            Contact Engineering &amp; Support Desk
          </h1>
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
            Have a question, pilot setup request, or technical query? Choose a
            topic below to auto-format your email and send it directly to our
            core desk.
          </p>
        </div>
      </section>

      {/* Main Interactive Contact Section */}
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          {/* Left Info Column */}
          <div className="space-y-6 lg:col-span-4">
            {/* Quick Email Card */}
            <div className="space-y-4 rounded-3xl bg-slate-900 p-6 text-white shadow-xl">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <div className="font-mono text-xs font-bold uppercase tracking-wider text-indigo-300">
                  Direct Support Email
                </div>
                <div className="mt-1 break-all text-sm font-black text-white sm:text-base">
                  tasqoneworkos@gmail.com
                </div>
              </div>
              <button
                type="button"
                onClick={handleCopyEmail}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 py-2.5 text-xs font-bold text-slate-200 transition-all hover:bg-slate-700"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span className="text-emerald-300">Email Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 text-slate-400" />
                    <span>Copy Support Email</span>
                  </>
                )}
              </button>
            </div>

            {/* Response Time & Location */}
            <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-6 text-xs text-slate-600">
              <div className="flex items-center gap-3">
                <div className="shrink-0 rounded-xl bg-emerald-100 p-2 text-emerald-700">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    Fast Turnaround
                  </div>
                  <div>
                    Average response time &lt; 2 hours during Indian business
                    hours.
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="shrink-0 rounded-xl bg-indigo-100 p-2 text-indigo-700">
                  <Building className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    Engineering Headquarters
                  </div>
                  <div>
                    Delhi / Pune, India • Serving High-Velocity Teams Worldwide
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="shrink-0 rounded-xl bg-purple-100 p-2 text-purple-700">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    Lead Architect
                  </div>
                  <div>
                    Tushar Singh (
                    <a
                      href="https://codewithmrsingh.me/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-indigo-600 underline"
                    >
                      codewithmrsingh.me
                    </a>
                    )
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Form Column: Interactive Query Composer */}
          <div className="space-y-6 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl sm:p-8 lg:col-span-8">
            <div>
              <label className="mb-2.5 block font-mono text-xs font-bold uppercase tracking-wider text-slate-900">
                Select Query Category
              </label>
              <div className="flex flex-wrap gap-2">
                {QUERY_TEMPLATES.map((tmpl) => {
                  const Icon = tmpl.icon;
                  const isSelected = selectedTemplate === tmpl.id;
                  return (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => handleTemplateChange(tmpl.id)}
                      className={`flex cursor-pointer items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                        isSelected
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{tmpl.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <form onSubmit={handleSendEmail} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">
                    Your Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aarav Sharma"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">
                    Work Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="aarav@company.com"
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">
                  Company / Organization Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Acme Innovations Pvt Ltd"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 sm:text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">
                  Email Subject
                </label>
                <input
                  type="text"
                  required
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs font-semibold text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 sm:text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">
                  Message Body (Editable)
                </label>
                <textarea
                  rows={6}
                  required
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-4 font-mono text-xs leading-relaxed text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 sm:text-sm"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/25 transition-all hover:bg-indigo-700"
                >
                  <Send className="h-4 w-4" />
                  <span>
                    Open in Email App &amp; Send Query (tasqoneworkos@gmail.com)
                  </span>
                </button>
                <p className="mt-2 text-center text-[11px] text-slate-500">
                  Clicking will launch your default email client (Gmail,
                  Outlook, Apple Mail) with all details pre-filled.
                </p>
              </div>
            </form>
          </div>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
