"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  LayoutDashboard,
  Bot,
  CheckSquare,
  Bell,
  Briefcase,
  Terminal,
  Building,
  Users,
  Smartphone,
  Monitor,
  Download,
  Menu,
  X,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";

export function MarketingNav() {
  const pathname = usePathname();
  const [openDropdown, setOpenDropdown] = useState<"products" | "solutions" | "resources" | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showPwaModal, setShowPwaModal] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <header
        ref={headerRef}
        className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md transition-all duration-200"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 sm:h-22 flex items-center justify-between gap-6">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group focus:outline-none py-1 shrink-0">
            <div className="relative flex items-center">
              <Image
                src="/ONE_Header.png"
                alt="TASQ-ONE Logo"
                width={280}
                height={80}
                priority
                className="h-14 sm:h-16 md:h-20 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
              />
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-5 xl:gap-7 text-xs font-bold uppercase tracking-wider text-slate-700">
            {/* Home Route Link */}
            <Link
              href="/"
              className={`py-2 transition-colors ${
                pathname === "/" ? "text-slate-950 font-extrabold" : "hover:text-slate-950"
              }`}
            >
              Home
            </Link>

            {/* Features / Products Link & Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === "products" ? null : "products")}
                className={`py-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                  pathname === "/features" || openDropdown === "products" ? "text-slate-950 font-extrabold" : "hover:text-slate-950"
                }`}
              >
                <span>Features</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    openDropdown === "products" ? "rotate-180 text-indigo-600" : "text-slate-400"
                  }`}
                />
              </button>

              {openDropdown === "products" && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-80 p-2.5 rounded-2xl bg-white border border-slate-200 shadow-2xl z-50 space-y-1 animate-in fade-in zoom-in-95 duration-150 normal-case tracking-normal">
                  <Link
                    href="/features#kanban"
                    onClick={() => setOpenDropdown(null)}
                    className="w-full flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 shrink-0">
                      <LayoutDashboard className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900">Sprint Delivery Board</div>
                      <div className="text-[11px] text-slate-500">Live multi-column drag-and-drop delivery board</div>
                    </div>
                  </Link>

                  <Link
                    href="/features#ai"
                    onClick={() => setOpenDropdown(null)}
                    className="w-full flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="p-2 rounded-lg bg-purple-50 text-purple-600 border border-purple-100 shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900">Instant AI Task Decomposer</div>
                      <div className="text-[11px] text-slate-500">Groq Llama 3.3 70B instant ticket structuring</div>
                    </div>
                  </Link>

                  <Link
                    href="/features#employee"
                    onClick={() => setOpenDropdown(null)}
                    className="w-full flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 shrink-0">
                      <CheckSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900">Due Today Focus View</div>
                      <div className="text-[11px] text-slate-500">Distraction-free morning checklist for team members</div>
                    </div>
                  </Link>

                  <Link
                    href="/features#alerts"
                    onClick={() => setOpenDropdown(null)}
                    className="w-full flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-indigo-100 shrink-0">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900">Automated Async Alerts</div>
                      <div className="text-[11px] text-slate-500">Slack release cards and executive email digests</div>
                    </div>
                  </Link>
                </div>
              )}
            </div>

            {/* Solutions Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === "solutions" ? null : "solutions")}
                className={`py-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                  pathname === "/solutions" || openDropdown === "solutions" ? "text-slate-950 font-extrabold" : "hover:text-slate-950"
                }`}
              >
                <span>Solutions</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    openDropdown === "solutions" ? "rotate-180 text-indigo-600" : "text-slate-400"
                  }`}
                />
              </button>

              {openDropdown === "solutions" && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-72 p-2.5 rounded-2xl bg-white border border-slate-200 shadow-2xl z-50 space-y-1 animate-in fade-in zoom-in-95 duration-150 normal-case tracking-normal">
                  <Link
                    href="/solutions?role=founders"
                    onClick={() => setOpenDropdown(null)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 text-left transition-colors"
                  >
                    <Briefcase className="w-4 h-4 text-indigo-600 shrink-0" />
                    <div>
                      <div className="font-bold text-xs text-slate-900">Marketing &amp; Agencies</div>
                      <div className="text-[11px] text-slate-500">Multi-client sprint deliverables</div>
                    </div>
                  </Link>
                  <Link
                    href="/solutions?role=engineering"
                    onClick={() => setOpenDropdown(null)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 text-left transition-colors"
                  >
                    <Terminal className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <div className="font-bold text-xs text-slate-900">Software &amp; Product</div>
                      <div className="text-[11px] text-slate-500">Fast sprint cycles &amp; bug tracking</div>
                    </div>
                  </Link>
                  <Link
                    href="/solutions?role=operations"
                    onClick={() => setOpenDropdown(null)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 text-left transition-colors"
                  >
                    <Building className="w-4 h-4 text-amber-600 shrink-0" />
                    <div>
                      <div className="font-bold text-xs text-slate-900">Operations &amp; SMBs</div>
                      <div className="text-[11px] text-slate-500">Centralized operations checklists</div>
                    </div>
                  </Link>
                </div>
              )}
            </div>

            {/* Pricing Route Link */}
            <Link
              href="/pricing"
              className={`py-2 transition-colors ${
                pathname === "/pricing" ? "text-slate-950 font-extrabold" : "hover:text-slate-950"
              }`}
            >
              Pricing
            </Link>

            {/* About Route Link */}
            <Link
              href="/about"
              className={`py-2 transition-colors ${
                pathname === "/about" ? "text-slate-950 font-extrabold" : "hover:text-slate-950"
              }`}
            >
              About
            </Link>

            {/* Contact Route Link */}
            <Link
              href="/contact"
              className={`py-2 transition-colors ${
                pathname === "/contact" ? "text-slate-950 font-extrabold" : "hover:text-slate-950"
              }`}
            >
              Contact
            </Link>
          </nav>

          {/* Action CTAs */}
          <div className="hidden sm:flex items-center gap-3 shrink-0">
            {/* Download Software / PWA Button */}
            <button
              type="button"
              onClick={() => setShowPwaModal(true)}
              className="px-3 py-2 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Download Desktop & Mobile App"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600" />
              <span>Download App</span>
            </button>

            {/* Staff Login */}
            <Link
              href="/login"
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-950 hover:bg-slate-100 border border-slate-200 transition flex items-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5 text-slate-500" />
              <span>Staff Login</span>
            </Link>

            {/* Register Company */}
            <Link
              href="/signup"
              className="px-4 py-2 rounded-xl text-xs font-extrabold text-white bg-[#0B0F19] hover:bg-slate-800 shadow-sm transition-all flex items-center gap-1.5"
            >
              <span>Register Company</span>
            </Link>
          </div>

          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-6 space-y-4 animate-in slide-in-from-top duration-200">
            <div className="space-y-2">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="block p-2 text-sm font-bold text-slate-800 rounded-lg hover:bg-slate-50"
              >
                Home
              </Link>
              <Link
                href="/features"
                onClick={() => setMobileMenuOpen(false)}
                className="block p-2 text-sm font-bold text-slate-800 rounded-lg hover:bg-slate-50"
              >
                Features &amp; Simulator
              </Link>
              <Link
                href="/solutions"
                onClick={() => setMobileMenuOpen(false)}
                className="block p-2 text-sm font-bold text-slate-800 rounded-lg hover:bg-slate-50"
              >
                Tailored Solutions
              </Link>
              <Link
                href="/pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="block p-2 text-sm font-bold text-slate-800 rounded-lg hover:bg-slate-50"
              >
                Pricing &amp; Free Pilot
              </Link>
              <Link
                href="/about"
                onClick={() => setMobileMenuOpen(false)}
                className="block p-2 text-sm font-bold text-slate-800 rounded-lg hover:bg-slate-50"
              >
                About TASQ-ONE
              </Link>
              <Link
                href="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className="block p-2 text-sm font-bold text-slate-800 rounded-lg hover:bg-slate-50"
              >
                Contact Desk &amp; Queries
              </Link>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowPwaModal(true);
                }}
                className="w-full text-left p-2 text-sm font-bold text-indigo-700 rounded-lg hover:bg-indigo-50 flex items-center gap-2"
              >
                <Download className="w-4 h-4 text-indigo-600" />
                <span>Download Desktop &amp; Mobile App</span>
              </button>
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-700"
              >
                Staff Login
              </Link>
              <Link
                href="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-xl bg-slate-950 text-sm font-bold text-white shadow-sm"
              >
                Register Company
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* PWA INSTALL / DOWNLOAD MODAL */}
      <Modal
        isOpen={showPwaModal}
        onClose={() => setShowPwaModal(false)}
        title="Download & Install TASQ-ONE Software"
        description="Install the desktop or mobile app for offline deliverable access and instantaneous launch."
        maxWidth="md"
      >
        <div className="space-y-3.5 text-xs text-slate-700 pt-2">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="font-bold text-slate-900 flex items-center gap-2">
              <Monitor className="w-4 h-4 text-indigo-600" />
              <span>Desktop Application (Chrome, Edge, Brave, Arc)</span>
            </div>
            <p className="text-slate-600">
              Click the install icon in your browser address bar or select{" "}
              <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">Settings → Install TASQ-ONE</code> for a standalone windowed desktop experience.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="font-bold text-slate-900 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-600" />
              <span>Mobile Application (iOS Safari &amp; Android Chrome)</span>
            </div>
            <p className="text-slate-600">
              Tap the Share / Menu button{" "}
              <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">Share → Add to Home Screen</code> to install TASQ-ONE directly on your mobile device.
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
    </>
  );
}
