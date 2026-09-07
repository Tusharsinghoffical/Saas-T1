"use client";

import React, { useEffect, useState, useMemo } from "react";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Activity,
  Settings,
  BarChart3,
} from "lucide-react";
import {
  DashboardSidebar,
  type NavGroup,
  type UserProfileInfo,
} from "@/components/navigation/DashboardSidebar";
import { DashboardHeader } from "@/components/navigation/DashboardHeader";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [profile, setProfile] = useState<UserProfileInfo | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Hydrate collapsed state from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("tasq_admin_sidebar_collapsed");
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
        localStorage.setItem("tasq_admin_sidebar_collapsed", String(next));
      } catch {
        // Ignore
      }
      return next;
    });
  };

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/v1/dashboard/admin");
        const json = await res.json();
        if (json.success && json.data?.adminProfile) {
          const p = json.data.adminProfile;
          setProfile({
            fullName: p.fullName || "Admin User",
            email: p.email || "",
            orgName: p.orgName || "Organization",
            role: "admin",
            avatarUrl: p.avatarUrl,
            employeeCode: p.employeeCode,
          });
        } else {
          const meRes = await fetch("/api/v1/dashboard/me").catch(() => null);
          if (meRes && meRes.ok) {
            const meJson = await meRes.json();
            if (meJson.success && meJson.data?.profile) {
              const p = meJson.data.profile;
              setProfile({
                fullName: p.fullName || "Admin User",
                email: p.email || "",
                orgName: p.orgName || "Organization",
                role: "admin",
                avatarUrl: p.avatarUrl,
                employeeCode: p.employeeCode,
              });
            }
          }
        }
      } catch {
        // Non-blocking
      } finally {
        setIsLoadingProfile(false);
      }
    }
    loadProfile();
  }, []);

  // Categorized Navigation
  const navGroups: NavGroup[] = useMemo(
    () => [
      {
        title: "Workspace",
        items: [
          {
            name: "Dashboard",
            href: "/admin/dashboard",
            icon: LayoutDashboard,
            badge: null,
          },
        ],
      },
      {
        title: "Management",
        items: [
          {
            name: "Team & Access",
            href: "/admin/team",
            icon: Users,
            badge: null,
          },
          {
            name: "Activity Log",
            href: "/admin/activity",
            icon: Activity,
            badge: null,
          },
        ],
      },
      {
        title: "System",
        items: [
          {
            name: "Analytics",
            href: "/admin/analytics-debug",
            icon: BarChart3,
            badge: "Beta",
            badgeColor:
              "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300",
          },
          {
            name: "Settings",
            href: "/admin/settings",
            icon: Settings,
            badge: null,
          },
        ],
      },
    ],
    []
  );

  // Dynamic Breadcrumb computation
  const breadcrumbs = useMemo(() => {
    const org = profile?.orgName || "Workspace";
    if (pathname?.includes("/admin/team")) {
      return [{ label: org }, { label: "Admin" }, { label: "Team & Access" }];
    }
    if (pathname?.includes("/admin/activity")) {
      return [{ label: org }, { label: "Admin" }, { label: "Activity Log" }];
    }
    if (pathname?.includes("/admin/analytics-debug")) {
      return [{ label: org }, { label: "Admin" }, { label: "Analytics" }];
    }
    if (pathname?.includes("/admin/settings")) {
      return [{ label: org }, { label: "Admin" }, { label: "Settings" }];
    }
    return [{ label: org }, { label: "Admin" }, { label: "Dashboard" }];
  }, [pathname, profile?.orgName]);

  const initials = profile?.fullName
    ? profile.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "AD";

  return (
    <div className="flex min-h-screen bg-slate-50/70 dark:bg-slate-950">
      {/* ── Redesigned Modern Sidebar ── */}
      <DashboardSidebar
        role="admin"
        user={profile}
        isLoadingUser={isLoadingProfile}
        navGroups={navGroups}
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={handleToggleCollapse}
        homeHref="/admin/dashboard"
      />

      {/* ── Main Interface Content ── */}
      <div className="flex min-w-0 flex-1 flex-col transition-all duration-300">
        {/* Modern Sticky Glassmorphic Header */}
        <DashboardHeader
          onOpenMobileMenu={() => setIsMobileOpen(true)}
          breadcrumbs={breadcrumbs}
          isRealtimeConnected={true}
          userInitials={initials}
        />

        {/* Page Container with Ambient Lighting */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
