import type React from "react"
import type { Metadata, Viewport } from "next"
import { Plus_Jakarta_Sans } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ErrorBoundary } from "@/components/error-boundary"
import { ClientErrorDetector } from "@/components/client-error-detector"
import { Toaster } from "@/components/ui/toaster"
import { KeyboardShortcutsModal } from "@/components/keyboard-shortcuts-modal"
import { GlobalSearch } from "@/components/global-search"
import { ServiceWorkerRegister } from "@/components/sw-register"
import { OfflineIndicator } from "@/components/offline-indicator"
import { OnboardingTour } from "@/components/onboarding-tour"
import "@/lib/string-safety"
import "./globals.css"

// Force cache busting
console.log("[LAYOUT] Loading layout with timestamp:", Date.now())

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "800"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: "MGS | Mind · Grind · Scale",
  description:
    "Track your trading performance, share insights with your community, and grow together. Built for day traders, swing traders, investors, and e-commerce entrepreneurs.",
  generator: "v0.app",
  keywords: [
    "trading journal",
    "day trading",
    "swing trading",
    "e-commerce",
    "dropshipping",
    "performance tracking",
    "MGS",
    "mind grind scale",
  ],
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export const viewport: Viewport = {
  themeColor: "#030406",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={`${plusJakarta.variable} font-sans antialiased`}>
        <ClientErrorDetector />
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
        <Toaster />
        <KeyboardShortcutsModal />
        <GlobalSearch />
        <ServiceWorkerRegister />
        <OfflineIndicator />
        <OnboardingTour />
        <Analytics />
      </body>
    </html>
  )
}
