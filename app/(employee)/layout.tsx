"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckSquare, User, LogOut, Sparkles } from "lucide-react";
import {
  DashboardSidebar,
  type NavGroup,
  type UserProfileInfo,
} from "@/components/navigation/DashboardSidebar";
import { DashboardHeader } from "@/components/navigation/DashboardHeader";
import { createClient } from "@/infrastructure/supabase/supabaseClient";
import { logoutAction } from "@/app/(auth)/actions";

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [employeeInfo, setEmployeeInfo] = useState<UserProfileInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut().catch(() => {});
      await logoutAction().catch(() => {});
    } catch {
      // Best-effort logout
    } finally {
      window.location.href = "/";
    }
  };

  // Hydrate collapsed state from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("tasq_employee_sidebar_collapsed");
      if (saved !== null) {
        setCollapsed(saved === "true");
      }
    } catch {
      // Ignore
    }
  }, []);

  const handleToggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("tasq_employee_sidebar_collapsed", String(next));
      } catch {
        // Ignore
      }
      return next;
    });
  };

  useEffect(() => {
    setIsLoading(true);
    fetch("/api/v1/dashboard/me")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data?.profile) {
          const p = json.data.profile;
          setEmployeeInfo({
            id: p.id,
            fullName: p.fullName || "Team Member",
            email: p.email || "employee@workspace.com",
            position: p.position || null,
            phoneNumber: p.phoneNumber || null,
            teamName: p.teamName || "General Squad",
            orgName: p.orgName || "Workspace",
            role: "employee",
            employeeCode: p.employeeCode,
            avatarUrl: p.avatarUrl,
          });
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  // Real-time synchronization of personal profile details
  useEffect(() => {
    const handleProfileUpdated = (e: any) => {
      const updated = e.detail || e.data?.profile;
      if (updated) {
        setEmployeeInfo((prev) =>
          prev
            ? {
                ...prev,
                fullName: updated.fullName || prev.fullName,
                position:
                  updated.position !== undefined
                    ? updated.position
                    : prev.position,
                phoneNumber:
                  updated.phoneNumber !== undefined
                    ? updated.phoneNumber
                    : prev.phoneNumber,
                avatarUrl:
                  updated.avatarUrl !== undefined
                    ? updated.avatarUrl
                    : prev.avatarUrl,
              }
            : null
        );
      }
    };

    window.addEventListener("tasq:profile_updated", handleProfileUpdated);

    let bc: BroadcastChannel | null = null;
    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        bc = new BroadcastChannel("tasq-profile-channel");
        bc.onmessage = (event) => {
          if (event.data?.profile) {
            handleProfileUpdated({ detail: event.data.profile });
          }
        };
      }
    } catch {}

    return () => {
      window.removeEventListener("tasq:profile_updated", handleProfileUpdated);
      if (bc) bc.close();
    };
  }, []);

  const navGroups: NavGroup[] = useMemo(
    () => [
      {
        title: "Work Hub",
        items: [
          {
            name: "My Tasks",
            href: "/employee/dashboard",
            icon: CheckSquare,
            exact: true,
          },
        ],
      },
      {
        title: "Account",
        items: [
          {
            name: "My Profile",
            href: "/employee/profile",
            icon: User,
          },
        ],
      },
    ],
    []
  );

  const breadcrumbs = useMemo(() => {
    const squad = employeeInfo?.teamName || "General Squad";
    if (pathname?.includes("/employee/profile")) {
      return [{ label: squad }, { label: "Member" }, { label: "My Profile" }];
    }
    return [{ label: squad }, { label: "Member" }, { label: "My Tasks" }];
  }, [employeeInfo?.teamName, pathname]);

  const initials = employeeInfo?.fullName
    ? employeeInfo.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "EM";

  return (
    <div className="flex min-h-screen bg-slate-50/70 dark:bg-slate-950">
      {/* ── Desktop Collapsible Sidebar ── */}
      <DashboardSidebar
        role="employee"
        user={employeeInfo}
        isLoadingUser={isLoading}
        navGroups={navGroups}
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={handleToggleCollapse}
        homeHref="/employee/dashboard"
      />

      {/* ── Main Workspace Area ── */}
      <div className="flex min-w-0 flex-1 flex-col transition-all duration-300">
        <DashboardHeader
          onOpenMobileMenu={() => setIsMobileOpen(true)}
          breadcrumbs={breadcrumbs}
          isRealtimeConnected={true}
          userInitials={initials}
          userId={employeeInfo?.id}
        />

        <main className="flex-1 p-4 pb-24 sm:p-6 sm:pb-10 lg:p-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>

        {/* ── Mobile Floating Glassmorphic Bottom Navigation Bar ── */}
        <nav className="fixed bottom-3 left-4 right-4 z-40 flex h-15 items-center justify-around rounded-2xl border border-slate-200/80 bg-white/90 px-3 shadow-xl backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/90 sm:hidden">
          <Link
            href="/employee/dashboard"
            className={`flex min-h-[44px] min-w-[44px] flex-col items-center justify-center font-bold ${
              pathname === "/employee/dashboard"
                ? "text-primary dark:text-primary-400"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            <CheckSquare className="h-4.5 w-4.5" />
            <span className="mt-0.5 text-[10px]">My Tasks</span>
          </Link>
          <Link
            href="/employee/profile"
            className={`flex min-h-[44px] min-w-[44px] flex-col items-center justify-center font-medium ${
              pathname === "/employee/profile"
                ? "text-primary dark:text-primary-400"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            <User className="h-4.5 w-4.5" />
            <span className="mt-0.5 text-[10px]">Profile</span>
          </Link>
          <button
            type="button"
            onClick={() => setIsMobileOpen(true)}
            className="flex min-h-[44px] min-w-[44px] flex-col items-center justify-center font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            <Sparkles className="h-4.5 w-4.5" />
            <span className="mt-0.5 text-[10px]">Workspace</span>
          </button>
          <Link
            href="/"
            onClick={handleSignOut}
            className={`flex min-h-[44px] min-w-[44px] flex-col items-center justify-center font-medium text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 ${
              isLoggingOut ? "pointer-events-none opacity-50" : ""
            }`}
          >
            <LogOut className={`h-4.5 w-4.5 ${isLoggingOut ? "animate-spin" : ""}`} />
            <span className="mt-0.5 text-[10px]">{isLoggingOut ? "Signing out…" : "Sign Out"}</span>
          </Link>
        </nav>
      </div>
    </div>
  );
}
