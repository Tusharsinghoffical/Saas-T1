import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { PwaInstallPrompt } from "@/components/pwa/PwaInstallPrompt";
import { AnalyticsProvider } from "@/components/analytics/AnalyticsProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#4F46E5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: "TASQ-ONE — Multi-Tenant Work OS for SMBs",
  description: "AI-assisted multi-tenant SaaS task management platform for small and medium businesses.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "TASQ-ONE",
  },
  icons: {
    icon: "/ONE_Header.png",
    shortcut: "/ONE_Header.png",
    apple: "/ONE_Header.png",
  },
  openGraph: {
    title: "TASQ-ONE — Multi-Tenant Work OS for SMBs",
    description: "AI-assisted multi-tenant SaaS task management platform for small and medium businesses.",
    images: [
      {
        url: "/ONE_Header.png",
        width: 512,
        height: 512,
        alt: "TASQ-ONE Brand Logo Thumbnail",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "TASQ-ONE — Multi-Tenant Work OS",
    description: "AI-assisted multi-tenant SaaS task management platform for small and medium businesses.",
    images: ["/ONE_Header.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} font-sans`} suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/ONE_Header.png" type="image/png" />
        <link rel="apple-touch-icon" href="/ONE_Header.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body
        className="bg-background-light text-slate-900 antialiased selection:bg-primary/20 selection:text-primary"
        suppressHydrationWarning
      >
        {children}
        <PwaInstallPrompt />
        <AnalyticsProvider />
      </body>
    </html>
  );
}
