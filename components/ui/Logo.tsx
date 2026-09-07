"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

export interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  href?: string;
  className?: string;
  priority?: boolean;
}

export function Logo({
  size = "md",
  href = "/",
  className = "",
  priority = true,
}: LogoProps) {
  // Enhanced, prominent sizing to ensure brand logo stands out clearly
  const sizeConfig = {
    sm: { height: 56, className: "h-12 sm:h-14 w-auto max-w-[220px]" },
    md: {
      height: 80,
      className: "h-14 sm:h-16 md:h-[76px] w-auto max-w-[320px]",
    },
    lg: {
      height: 104,
      className: "h-20 sm:h-24 md:h-[104px] w-auto max-w-[420px]",
    },
    xl: {
      height: 130,
      className: "h-26 sm:h-30 md:h-[130px] w-auto max-w-[500px]",
    },
  }[size];

  // ONE Header .png is used for both Header and Footer
  const imageSrc = "/ONE_Header.png";
  const altText = "TASQ-ONE Logo";

  const content = (
    <div
      className={`group inline-flex select-none items-center transition-transform duration-200 hover:scale-[1.02] ${className}`}
    >
      <Image
        src={imageSrc}
        alt={altText}
        width={360}
        height={sizeConfig.height}
        className={`${sizeConfig.className} drop-shadow-xs object-contain transition-all`}
        priority={priority}
      />
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center focus:outline-none">
        {content}
      </Link>
    );
  }

  return content;
}
