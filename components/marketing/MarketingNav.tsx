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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export function MarketingNav() {
  const pathname = usePathname();
  const [openDropdown, setOpenDropdown] = useState<
    "products" | "solutions" | null
  >(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSideWidgetOpen, setIsSideWidgetOpen] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        headerRef.current &&
        !headerRef.current.contains(event.target as Node)
      ) {
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
        <div className="sm:h-22 mx-auto flex h-20 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
          {/* Brand Logo */}
          <Link
            href="/"
            className="group flex shrink-0 items-center gap-3 py-1 focus:outline-none"
          >
            <div className="relative flex items-center">
              <Image
                src="/ONE_Header.png"
                alt="TASQ-ONE Logo"
                width={280}
                height={80}
                priority
                className="h-14 w-auto object-contain transition-transform duration-200 group-hover:scale-105 sm:h-16 md:h-20"
              />
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden items-center gap-6 text-xs font-bold uppercase tracking-wider text-slate-700 lg:flex xl:gap-8">
            {/* Home Route Link */}
            <Link
              href="/"
              className={`py-2 transition-colors ${
                pathname === "/"
                  ? "font-extrabold text-slate-950"
                  : "hover:text-slate-950"
              }`}
            >
              Home
            </Link>

            {/* Features / Products Link & Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setOpenDropdown(
                    openDropdown === "products" ? null : "products"
                  )
                }
                className={`flex cursor-pointer items-center gap-1.5 py-2 transition-all ${
                  pathname === "/features" || openDropdown === "products"
                    ? "font-extrabold text-slate-950"
                    : "hover:text-slate-950"
                }`}
              >
                <span>Features</span>
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform duration-200 ${
                    openDropdown === "products"
                      ? "rotate-180 text-indigo-600"
                      : "text-slate-400"
                  }`}
                />
              </button>

              {openDropdown === "products" && (
                <div className="animate-in fade-in zoom-in-95 absolute left-1/2 top-full z-50 mt-2 w-80 -translate-x-1/2 space-y-1 rounded-2xl border border-slate-200 bg-white p-2.5 normal-case tracking-normal shadow-2xl duration-150">
                  <Link
                    href="/features#kanban"
                    onClick={() => setOpenDropdown(null)}
                    className="flex w-full items-start gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-slate-50"
                  >
                    <div className="shrink-0 rounded-lg border border-indigo-100 bg-indigo-50 p-2 text-indigo-600">
                      <LayoutDashboard className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        Sprint Delivery Board
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Live multi-column drag-and-drop delivery board
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/features#ai"
                    onClick={() => setOpenDropdown(null)}
                    className="flex w-full items-start gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-slate-50"
                  >
                    <div className="shrink-0 rounded-lg border border-purple-100 bg-purple-50 p-2 text-purple-600">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        Instant AI Task Decomposer
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Groq Llama 3.3 70B instant ticket structuring
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/features#employee"
                    onClick={() => setOpenDropdown(null)}
                    className="flex w-full items-start gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-slate-50"
                  >
                    <div className="shrink-0 rounded-lg border border-emerald-100 bg-emerald-50 p-2 text-emerald-600">
                      <CheckSquare className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        Due Today Focus View
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Distraction-free morning checklist for team members
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/features#alerts"
                    onClick={() => setOpenDropdown(null)}
                    className="flex w-full items-start gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-slate-50"
                  >
                    <div className="shrink-0 rounded-lg border border-indigo-100 bg-blue-50 p-2 text-blue-600">
                      <Bell className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        Automated Async Alerts
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Slack release cards and executive email digests
                      </div>
                    </div>
                  </Link>
                </div>
              )}
            </div>

            {/* Solutions Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setOpenDropdown(
                    openDropdown === "solutions" ? null : "solutions"
                  )
                }
                className={`flex cursor-pointer items-center gap-1.5 py-2 transition-all ${
                  pathname === "/solutions" || openDropdown === "solutions"
                    ? "font-extrabold text-slate-950"
                    : "hover:text-slate-950"
                }`}
              >
                <span>Solutions</span>
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform duration-200 ${
                    openDropdown === "solutions"
                      ? "rotate-180 text-indigo-600"
                      : "text-slate-400"
                  }`}
                />
              </button>

              {openDropdown === "solutions" && (
                <div className="animate-in fade-in zoom-in-95 absolute left-1/2 top-full z-50 mt-2 w-72 -translate-x-1/2 space-y-1 rounded-2xl border border-slate-200 bg-white p-2.5 normal-case tracking-normal shadow-2xl duration-150">
                  <Link
                    href="/solutions?role=founders"
                    onClick={() => setOpenDropdown(null)}
                    className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-slate-50"
                  >
                    <Briefcase className="h-4 w-4 shrink-0 text-indigo-600" />
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        Marketing &amp; Agencies
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Multi-client sprint deliverables
                      </div>
                    </div>
                  </Link>
                  <Link
                    href="/solutions?role=engineering"
                    onClick={() => setOpenDropdown(null)}
                    className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-slate-50"
                  >
                    <Terminal className="h-4 w-4 shrink-0 text-emerald-600" />
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        Software &amp; Product
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Fast sprint cycles &amp; bug tracking
                      </div>
                    </div>
                  </Link>
                  <Link
                    href="/solutions?role=operations"
                    onClick={() => setOpenDropdown(null)}
                    className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-slate-50"
                  >
                    <Building className="h-4 w-4 shrink-0 text-amber-600" />
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        Operations &amp; SMBs
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Centralized operations checklists
                      </div>
                    </div>
                  </Link>
                </div>
              )}
            </div>

            {/* About Route Link */}
            <Link
              href="/about"
              className={`py-2 transition-colors ${
                pathname === "/about"
                  ? "font-extrabold text-slate-950"
                  : "hover:text-slate-950"
              }`}
            >
              About
            </Link>

            {/* Contact Route Link */}
            <Link
              href="/contact"
              className={`py-2 transition-colors ${
                pathname === "/contact"
                  ? "font-extrabold text-slate-950"
                  : "hover:text-slate-950"
              }`}
            >
              Contact
            </Link>
          </nav>

          {/* Action CTAs */}
          <div className="hidden shrink-0 items-center gap-3 sm:flex">
            {/* Staff Login */}
            <Link
              href="/login"
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
            >
              <Users className="h-3.5 w-3.5 text-slate-500" />
              <span>Staff Login</span>
            </Link>

            {/* Register Company */}
            <Link
              href="/signup"
              className="flex items-center gap-1.5 rounded-xl bg-[#0B0F19] px-4 py-2 text-xs font-extrabold text-white shadow-sm transition-all hover:bg-slate-800"
            >
              <span>Register Company</span>
            </Link>
          </div>

          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-xl border border-slate-200 p-2 text-slate-700 hover:bg-slate-50 lg:hidden"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="animate-in slide-in-from-top space-y-4 border-t border-slate-200 bg-white px-4 py-6 duration-200 lg:hidden">
            <div className="space-y-2">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-lg p-2 text-sm font-bold text-slate-800 hover:bg-slate-50"
              >
                Home
              </Link>
              <Link
                href="/features"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-lg p-2 text-sm font-bold text-slate-800 hover:bg-slate-50"
              >
                Features &amp; Simulator
              </Link>
              <Link
                href="/solutions"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-lg p-2 text-sm font-bold text-slate-800 hover:bg-slate-50"
              >
                Tailored Solutions
              </Link>
              <Link
                href="/about"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-lg p-2 text-sm font-bold text-slate-800 hover:bg-slate-50"
              >
                About TASQ-ONE
              </Link>
              <Link
                href="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-lg p-2 text-sm font-bold text-slate-800 hover:bg-slate-50"
              >
                Contact Desk &amp; Queries
              </Link>
            </div>

            <div className="flex flex-col gap-2 border-t border-slate-100 pt-4">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full rounded-xl border border-slate-200 py-2.5 text-center text-sm font-bold text-slate-700"
              >
                Staff Login
              </Link>
              <Link
                href="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full rounded-xl bg-slate-950 py-2.5 text-center text-sm font-bold text-white shadow-sm"
              >
                Register Company
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ======================================================================== */}
      {/* SLIDE-OUT MINIMAL APP DOWNLOAD WIDGET (TINY ICON ON SIDE)               */}
      {/* ======================================================================== */}
      {!isSideWidgetOpen ? (
        <button
          type="button"
          onClick={() => setIsSideWidgetOpen(true)}
          className="group fixed right-0 top-1/2 z-50 flex -translate-y-1/2 cursor-pointer flex-col items-center justify-center gap-1 rounded-l-xl border-y border-l border-slate-700 bg-slate-900/90 p-2 text-white shadow-xl backdrop-blur-md transition-all hover:-translate-x-1 hover:bg-slate-950"
          title="Download App (< Click to expand)"
          aria-label="Download App"
        >
          <ChevronLeft className="h-3.5 w-3.5 text-indigo-400 transition-transform group-hover:-translate-x-0.5" />
          <Download className="h-3.5 w-3.5 text-emerald-400" />
        </button>
      ) : (
        <div className="animate-in slide-in-from-right fixed right-4 top-1/2 z-50 w-72 max-w-[calc(100vw-2rem)] -translate-y-1/2 space-y-3 rounded-2xl border border-slate-700 bg-slate-900/95 p-4 text-white shadow-2xl backdrop-blur-xl duration-150">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold">
              <Download className="h-3.5 w-3.5 text-indigo-400" />
              <span>Install TASQ-ONE App</span>
            </div>
            <button
              type="button"
              onClick={() => setIsSideWidgetOpen(false)}
              className="flex cursor-pointer items-center gap-0.5 rounded-lg p-1 text-xs font-bold text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
              title="Hide"
            >
              <span>Hide</span>
              <ChevronRight className="h-3.5 w-3.5 text-indigo-400" />
            </button>
          </div>

          <div className="space-y-2 text-xs text-slate-300">
            <div className="space-y-1 rounded-xl border border-slate-700/80 bg-slate-800/80 p-2.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-white">
                <Monitor className="h-3 w-3 text-indigo-400" />
                <span>Desktop (Chrome / Edge)</span>
              </div>
              <p className="text-[10.5px] leading-relaxed text-slate-400">
                Click the install icon in your address bar or select{" "}
                <code className="rounded bg-slate-950 px-1 py-0.5 text-slate-300">
                  Settings → Install
                </code>
                .
              </p>
            </div>

            <div className="space-y-1 rounded-xl border border-slate-700/80 bg-slate-800/80 p-2.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-white">
                <Smartphone className="h-3 w-3 text-emerald-400" />
                <span>Mobile (iOS / Android)</span>
              </div>
              <p className="text-[10.5px] leading-relaxed text-slate-400">
                Tap browser Share menu{" "}
                <code className="rounded bg-slate-950 px-1 py-0.5 text-slate-300">
                  Share → Add to Home Screen
                </code>
                .
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsSideWidgetOpen(false)}
            className="w-full cursor-pointer rounded-xl bg-indigo-600 py-1.5 text-center text-xs font-bold text-white shadow-md transition-colors hover:bg-indigo-700"
          >
            Got It
          </button>
        </div>
      )}
    </>
  );
}
