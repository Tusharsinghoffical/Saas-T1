import React from "react";
import { cn } from "@/lib/utils";

export interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  variant?: "default" | "urgent" | "success";
}

export function KPICard({ title, value, subtitle, icon, variant = "default" }: KPICardProps) {
  const textColors = {
    default: "text-slate-900 dark:text-white",
    urgent: "text-urgent",
    success: "text-success",
  };

  return (
    <div className="p-5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500">{title}</span>
        {icon && <div className="text-slate-400">{icon}</div>}
      </div>
      <div className={cn("mt-3 text-3xl font-extrabold", textColors[variant])}>{value}</div>
      {subtitle && <div className="mt-1 text-xs text-slate-500">{subtitle}</div>}
    </div>
  );
}
