"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

export interface LogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  variant?: "full" | "mark";
  collapsed?: boolean;
  href?: string;
  className?: string;
  priority?: boolean;
}

export function Logo({
  size = "md",
  variant = "full",
  collapsed = false,
  href = "/",
  className = "",
  priority = true,
}: LogoProps) {
  const isMark = collapsed || variant === "mark";

  // Prominent, crisp sizing for the full banner logo (465x198 trimmed)
  const fullSizeConfig = {
    xs: { height: 36, className: "h-8 sm:h-9 w-auto max-w-[150px]" },
    sm: { height: 48, className: "h-10 sm:h-11 w-auto max-w-[200px]" },
    md: {
      height: 64,
      className: "h-13 sm:h-14 md:h-16 w-auto max-w-[260px]",
    },
    lg: {
      height: 84,
      className: "h-18 sm:h-20 md:h-22 w-auto max-w-[340px]",
    },
    xl: {
      height: 110,
      className: "h-22 sm:h-26 md:h-28 w-auto max-w-[440px]",
    },
  }[size];

  // Circular .ONE mark sizing for collapsed sidebar and icon contexts
  const markSizeConfig = {
    xs: "h-8 w-8",
    sm: "h-9 w-9",
    md: "h-11 w-11 sm:h-12 sm:w-12",
    lg: "h-14 w-14 sm:h-15 sm:w-15",
    xl: "h-18 w-18 sm:h-20 sm:w-20",
  }[size];

  const imageSrc = isMark ? "/ONE_Mark.png" : "/ONE_Header.png";
  const altText = isMark ? "TASQ-ONE Logomark" : "TASQ-ONE Logo";

  const content = isMark ? (
    <div
      className={`group inline-flex select-none items-center justify-center rounded-full transition-transform duration-200 hover:scale-105 dark:ring-1 dark:ring-white/25 dark:shadow-md dark:shadow-indigo-500/15 ${className}`}
      title="TASQ-ONE"
    >
      <Image
        src={imageSrc}
        alt={altText}
        width={96}
        height={96}
        className={`${markSizeConfig} object-contain drop-shadow-sm transition-all`}
        priority={priority}
      />
    </div>
  ) : (
    <div
      className={`group inline-flex select-none items-center transition-transform duration-200 hover:scale-[1.02] dark:drop-shadow-[0_2px_10px_rgba(255,255,255,0.08)] ${className}`}
    >
      <Image
        src={imageSrc}
        alt={altText}
        width={360}
        height={fullSizeConfig.height}
        className={`${fullSizeConfig.className} object-contain transition-all`}
        priority={priority}
      />
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="inline-flex items-center focus:outline-none"
        title="TASQ-ONE Workspace"
      >
        {content}
      </Link>
    );
  }

  return content;
}
