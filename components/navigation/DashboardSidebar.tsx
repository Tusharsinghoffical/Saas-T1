"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  Building2,
  Crown,
  Shield,
  Sparkles,
  Copy,
  Check,
  X,
  Radio,
  Zap,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";

export interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number | null;
  badgeColor?: string;
  exact?: boolean;
}

export interface NavGroup {
  title?: string;
  items: NavItem[];
}

export interface UserProfileInfo {
  id?: string;
  fullName: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
  employeeCode?: string;
  orgName?: string;
  teamName?: string;
}

interface DashboardSidebarProps {
  role: "admin" | "manager" | "employee";
  user: UserProfileInfo | null;
  isLoadingUser?: boolean;
  navGroups: NavGroup[];
  isMobileOpen: boolean;
  onMobileClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  homeHref?: string;
}

export function DashboardSidebar({
  role,
  user,
  isLoadingUser = false,
  navGroups,
  isMobileOpen,
  onMobileClose,
  collapsed,
  onToggleCollapse,
  homeHref = "/admin/dashboard",
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const initials = user?.fullName
    ? user.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : role === "admin"
      ? "AD"
      : role === "manager"
        ? "MG"
        : "EM";

  // Role Theme Config
  const roleConfig = {
    admin: {
      label: "Admin",
      badgeClass:
        "bg-gradient-to-r from-amber-500/15 to-violet-600/15 text-violet-700 dark:text-violet-300 border-violet-500/20",
      icon: Crown,
      iconColor: "text-amber-500",
      glowBg: "from-primary/10 via-violet-500/5 to-transparent",
      avatarBg: "from-primary to-violet-600",
    },
    manager: {
      label: "Manager",
      badgeClass:
        "bg-gradient-to-r from-emerald-500/15 to-teal-600/15 text-teal-700 dark:text-teal-300 border-teal-500/20",
      icon: Shield,
      iconColor: "text-emerald-500",
      glowBg: "from-emerald-500/10 via-teal-500/5 to-transparent",
      avatarBg: "from-emerald-600 to-teal-500",
    },
    employee: {
      label: "Member",
      badgeClass:
        "bg-gradient-to-r from-indigo-500/15 to-sky-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/20",
      icon: Sparkles,
      iconColor: "text-indigo-500",
      glowBg: "from-indigo-500/10 via-sky-500/5 to-transparent",
      avatarBg: "from-indigo-600 to-sky-500",
    },
  }[role];

  const RoleIcon = roleConfig.icon;

  const sidebarContent = (isMobile: boolean) => {
    const isCollapsed = !isMobile && collapsed;

    return (
      <div className="flex h-full flex-col justify-between overflow-hidden">
        {/* Top Section */}
        <div className="flex flex-col overflow-hidden">
          {/* Brand Header */}
          <div
            className={`flex h-[76px] items-center border-b border-slate-200/70 dark:border-slate-800/80 ${
              isCollapsed
                ? "justify-center px-2"
                : "justify-between px-4 sm:px-5"
            }`}
          >
            {isCollapsed ? (
              <Link
                href={homeHref}
                className="group flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-violet-600 text-base font-black text-white shadow-md shadow-primary/25 transition-transform hover:scale-105"
                title="TASQ-ONE Workspace"
              >
                T1
              </Link>
            ) : (
              <div className="flex min-w-0 flex-1 items-center py-1">
                <Logo size="md" href={homeHref} className="max-w-[195px]" />
              </div>
            )}

            {/* Desktop Collapse Toggle */}
            {!isMobile && (
              <button
                type="button"
                onClick={onToggleCollapse}
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                className="hidden h-7 w-7 items-center justify-center rounded-lg border border-slate-200/80 bg-slate-50 text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white md:flex"
                title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </button>
            )}

            {/* Mobile Close Button */}
            {isMobile && (
              <button
                type="button"
                onClick={onMobileClose}
                aria-label="Close menu"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200/80 bg-slate-50 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-400"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Workspace Scope Banner */}
          {!isCollapsed && (
            <div className="px-3.5 pt-3.5 pb-1">
              <div
                className={`relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br ${roleConfig.glowBg} p-3 shadow-xs dark:border-slate-800`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-white/90 shadow-xs dark:bg-slate-800">
                      <Building2 className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[12px] font-bold text-slate-900 dark:text-white">
                        {isLoadingUser
                          ? "Loading…"
                          : user?.orgName || user?.teamName || "Workspace"}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        </span>
                        <span>Active Scope</span>
                      </div>
                    </div>
                  </div>

                  {/* Role Badge */}
                  <span
                    className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] font-bold ${roleConfig.badgeClass}`}
                  >
                    <RoleIcon className={`h-2.5 w-2.5 ${roleConfig.iconColor}`} />
                    {roleConfig.label}
                  </span>
                </div>

                {/* Employee Code / ID row if available */}
                {user?.employeeCode && !isLoadingUser && (
                  <div className="mt-2.5 flex items-center justify-between border-t border-slate-200/50 pt-2 text-[10px] text-slate-400 dark:border-slate-800/60">
                    <span className="font-mono">ID: {user.employeeCode}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(user.employeeCode!)}
                      className="inline-flex items-center gap-1 text-[10px] text-slate-500 transition hover:text-primary dark:text-slate-400"
                      title="Copy Employee ID"
                    >
                      {copiedCode ? (
                        <Check className="h-2.5 w-2.5 text-emerald-500" />
                      ) : (
                        <Copy className="h-2.5 w-2.5" />
                      )}
                      <span>{copiedCode ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation Links List */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
            {navGroups.map((group, groupIdx) => (
              <div key={group.title || groupIdx} className="space-y-1">
                {group.title && !isCollapsed && (
                  <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {group.title}
                  </div>
                )}

                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.exact
                      ? pathname === item.href
                      : pathname === item.href ||
                        pathname?.startsWith(item.href + "/");

                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={isMobile ? onMobileClose : undefined}
                        className={`group relative flex items-center rounded-xl text-[13px] font-medium transition-all duration-200 ${
                          isCollapsed
                            ? "h-11 w-11 justify-center mx-auto"
                            : "gap-3 px-3 py-2.5"
                        } ${
                          isActive
                            ? "bg-primary/10 font-semibold text-primary shadow-xs dark:bg-primary/15 dark:text-primary-300"
                            : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-white"
                        }`}
                        title={isCollapsed ? item.name : undefined}
                      >
                        {/* Active Left Indicator Bar */}
                        {isActive && !isCollapsed && (
                          <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-primary" />
                        )}

                        <Icon
                          className={`flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                            isCollapsed ? "h-5 w-5" : "h-4 w-4"
                          } ${
                            isActive
                              ? "text-primary dark:text-primary-300"
                              : "text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200"
                          }`}
                        />

                        {!isCollapsed && (
                          <>
                            <span className="min-w-0 flex-1 truncate">
                              {item.name}
                            </span>
                            {item.badge !== undefined &&
                              item.badge !== null && (
                                <span
                                  className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                                    item.badgeColor ||
                                    "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                                  }`}
                                >
                                  {item.badge}
                                </span>
                              )}
                          </>
                        )}

                        {/* Collapsed Tooltip Flyout */}
                        {isCollapsed && (
                          <div className="pointer-events-none absolute left-full ml-3 hidden whitespace-nowrap rounded-lg border border-slate-200 bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white shadow-xl group-hover:block dark:border-slate-800 z-50">
                            {item.name}
                            {item.badge && (
                              <span className="ml-1.5 rounded bg-primary px-1 py-0.2 text-[9px]">
                                {item.badge}
                              </span>
                            )}
                          </div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User Identity & Logout Footer */}
        <div className="border-t border-slate-200/80 p-3 dark:border-slate-800">
          {isCollapsed ? (
            <div className="flex flex-col items-center gap-2">
              <div
                className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-violet-600 text-xs font-bold text-white shadow-xs"
                title={user?.fullName || "User Profile"}
              >
                {initials}
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900" />
              </div>

              <Link
                href="/login"
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 dark:hover:text-rose-400"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2.5 rounded-xl p-1.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="relative flex-shrink-0">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${roleConfig.avatarBg} text-xs font-bold text-white shadow-sm`}
                  >
                    {isLoadingUser ? "…" : initials}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-bold text-slate-900 dark:text-white">
                    {isLoadingUser
                      ? "Loading…"
                      : user?.fullName || "Active User"}
                  </div>
                  <div className="truncate text-[10px] text-slate-500 dark:text-slate-400">
                    {isLoadingUser ? "" : user?.email || "workspace user"}
                  </div>
                </div>
              </div>

              <Link
                href="/login"
                className="group flex-shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 dark:hover:text-rose-400"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* ── Desktop Collapsible Sidebar ── */}
      <aside
        className={`sticky top-0 z-30 hidden h-screen flex-shrink-0 flex-col border-r border-slate-200/80 bg-white/90 backdrop-blur-xl transition-all duration-300 ease-in-out dark:border-slate-800/80 dark:bg-slate-900/90 md:flex ${
          collapsed ? "w-[76px]" : "w-[264px]"
        }`}
      >
        {sidebarContent(false)}
      </aside>

      {/* ── Mobile Slide-Over Drawer Backdrop ── */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300 md:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* ── Mobile Slide-Over Drawer ── */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-[280px] border-r border-slate-200 bg-white shadow-2xl transition-transform duration-300 ease-in-out dark:border-slate-800 dark:bg-slate-900 md:hidden ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent(true)}
      </div>
    </>
  );
}
