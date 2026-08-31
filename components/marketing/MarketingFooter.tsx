"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, Heart } from "lucide-react";

export function MarketingFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-950 text-slate-400 py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Col 1: Brand & Mission */}
          <div className="space-y-4 md:col-span-1">
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
            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>100% Isolated PostgreSQL RLS</span>
            </div>
          </div>

          {/* Col 2: Product */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">Product</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/features#kanban" className="hover:text-white transition-colors">Sprint Kanban</Link>
              </li>
              <li>
                <Link href="/features#ai" className="hover:text-white transition-colors">AI Task Decomposer</Link>
              </li>
              <li>
                <Link href="/features#employee" className="hover:text-white transition-colors">Due Today Focus Mode</Link>
              </li>
              <li>
                <Link href="/features#alerts" className="hover:text-white transition-colors">Slack Notifications</Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-white transition-colors">Pricing &amp; Plans</Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Solutions */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">Solutions</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/solutions?role=founders" className="hover:text-white transition-colors">Founders &amp; Marketing</Link>
              </li>
              <li>
                <Link href="/solutions?role=engineering" className="hover:text-white transition-colors">Software &amp; Product</Link>
              </li>
              <li>
                <Link href="/solutions?role=operations" className="hover:text-white transition-colors">Operations &amp; SMBs</Link>
              </li>
              <li>
                <Link href="/solutions" className="hover:text-white transition-colors">All Workflows</Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Platform & Support */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">Access</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/signup" className="hover:text-white transition-colors">Register Company</Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white transition-colors">Staff Login</Link>
              </li>
              <li>
                <a href="mailto:tasqoneworkos@gmail.com" className="hover:text-white transition-colors">tasqoneworkos@gmail.com</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} TASQ-ONE Work OS. All rights reserved.</p>
          <div className="flex items-center gap-1">
            <span>Built for the Indian &amp; Global Tech Ecosystem with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" />
          </div>
        </div>
      </div>
    </footer>
  );
}
