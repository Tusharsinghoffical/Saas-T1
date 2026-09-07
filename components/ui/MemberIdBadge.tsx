"use client";

import React, { useState } from "react";
import { Copy, Check, Hash, Shield, Briefcase, UserCheck } from "lucide-react";
import { formatMemberCode, getShortId, MemberRole } from "@/lib/memberId";

interface MemberIdBadgeProps {
  id: string;
  role?: MemberRole;
  showIcon?: boolean;
  copyMode?: "full" | "code";
  className?: string;
  size?: "sm" | "md";
}

export function MemberIdBadge({
  id,
  role = "employee",
  showIcon = true,
  copyMode = "full",
  className = "",
  size = "sm",
}: MemberIdBadgeProps) {
  const [copied, setCopied] = useState(false);

  const memberCode = formatMemberCode(id, role);
  const shortId = getShortId(id);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const textToCopy = copyMode === "full" ? id : memberCode;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const roleStyles =
    role === "admin"
      ? "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/25 hover:border-purple-500/40"
      : role === "manager"
        ? "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/25 hover:border-blue-500/40"
        : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25 hover:border-emerald-500/40";

  const sizeStyles =
    size === "sm"
      ? "text-[10px] py-0.5 px-2 gap-1 rounded-md"
      : "text-xs py-1 px-2.5 gap-1.5 rounded-lg";

  return (
    <div
      onClick={handleCopy}
      title={`Click to copy ${copyMode === "full" ? "Full UUID" : "Member Code"}: ${id}`}
      className={`group inline-flex cursor-pointer select-none items-center border font-mono font-bold transition-all ${roleStyles} ${sizeStyles} ${className}`}
    >
      {showIcon && (
        <span className="opacity-70">
          {role === "admin" ? (
            <Shield className="h-2.5 w-2.5" />
          ) : role === "manager" ? (
            <Briefcase className="h-2.5 w-2.5" />
          ) : (
            <Hash className="h-2.5 w-2.5" />
          )}
        </span>
      )}
      <span>{memberCode}</span>
      <span className="hidden font-sans text-[9px] font-normal opacity-40 sm:inline">
        ({shortId})
      </span>

      <span className="ml-0.5 rounded p-0.5 opacity-60 transition-opacity group-hover:opacity-100">
        {copied ? (
          <Check className="animate-in zoom-in h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400" />
        ) : (
          <Copy className="h-2.5 w-2.5" />
        )}
      </span>

      {copied && (
        <span className="animate-fade-in font-sans text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
          Copied!
        </span>
      )}
    </div>
  );
}
