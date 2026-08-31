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
  const [customSubject, setCustomSubject] = useState(QUERY_TEMPLATES[0].subject);
  const [messageBody, setMessageBody] = useState(QUERY_TEMPLATES[0].defaultMessage);
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
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased selection:bg-indigo-500/20 selection:text-indigo-900">
      <MarketingNav />

      {/* Header Banner */}
      <section className="border-b border-slate-200 bg-slate-50/70 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-bold text-indigo-700">
            <Clock className="w-3.5 h-3.5" />
            <span>Response within 2 Business Hours</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
            Contact Engineering &amp; Support Desk
          </h1>
          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-600 leading-relaxed">
            Have a question, pilot setup request, or technical query? Choose a topic below to auto-format your email and send it directly to our core desk.
          </p>
        </div>
      </section>

      {/* Main Interactive Contact Section */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Info Column */}
          <div className="lg:col-span-4 space-y-6">
            {/* Quick Email Card */}
            <div className="p-6 rounded-3xl bg-slate-900 text-white space-y-4 shadow-xl">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-mono text-indigo-300 font-bold uppercase tracking-wider">
                  Direct Support Email
                </div>
                <div className="text-sm sm:text-base font-black text-white mt-1 break-all">
                  tasqoneworkos@gmail.com
                </div>
              </div>
              <button
                type="button"
                onClick={handleCopyEmail}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-300">Email Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-400" />
                    <span>Copy Support Email</span>
                  </>
                )}
              </button>
            </div>

            {/* Response Time & Location */}
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-4 text-xs text-slate-600">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-xs">Fast Turnaround</div>
                  <div>Average response time &lt; 2 hours during Indian business hours.</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700 shrink-0">
                  <Building className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-xs">Engineering Headquarters</div>
                  <div>Delhi / Pune, India • Serving High-Velocity Teams Worldwide</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-100 text-purple-700 shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-xs">Lead Architect</div>
                  <div>
                    Tushar Singh (
                    <a
                      href="https://codewithmrsingh.me/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 underline font-semibold"
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
          <div className="lg:col-span-8 p-6 sm:p-8 rounded-3xl border border-slate-200/80 bg-white shadow-xl space-y-6">
            <div>
              <label className="block text-xs font-mono font-bold text-slate-900 uppercase tracking-wider mb-2.5">
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
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tmpl.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <form onSubmit={handleSendEmail} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Your Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aarav Sharma"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-xs sm:text-sm text-slate-900 bg-slate-50/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Work Email</label>
                  <input
                    type="email"
                    required
                    placeholder="aarav@company.com"
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-xs sm:text-sm text-slate-900 bg-slate-50/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Company / Organization Name</label>
                <input
                  type="text"
                  placeholder="e.g. Acme Innovations Pvt Ltd"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-xs sm:text-sm text-slate-900 bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Subject</label>
                <input
                  type="text"
                  required
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-xs sm:text-sm text-slate-900 bg-slate-50/50 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Message Body (Editable)</label>
                <textarea
                  rows={6}
                  required
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  className="w-full p-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-xs sm:text-sm text-slate-900 bg-slate-50/50 font-mono leading-relaxed"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-bold text-white text-sm shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Open in Email App &amp; Send Query (tasqoneworkos@gmail.com)</span>
                </button>
                <p className="text-[11px] text-slate-500 text-center mt-2">
                  Clicking will launch your default email client (Gmail, Outlook, Apple Mail) with all details pre-filled.
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
