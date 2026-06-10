import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { ThemeProvider } from "@zequel/ui/components/theme-provider"
import { SiteNav } from "@/components/site/site-nav"
import { SiteFooter } from "@/components/site/site-footer"
import { SiteTexture } from "@/components/site/site-texture"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Zequel — The Research System for Evidence-Backed Reasoning",
    template: "%s — Zequel",
  },
  description:
    "Zequel is a structured research workspace for evidence-backed reasoning, multi-document analysis, and traceable synthesis. Built by Absalex Labs.",
  manifest: "/manifest.json",
  icons: { icon: "/zequel-logo-new.png", apple: "/zequel-logo-new.png" },
  openGraph: {
    title: "Zequel — Research System",
    description:
      "Structured research workspace for evidence-backed reasoning, multi-document analysis, and traceable synthesis.",
    images: [{ url: "/zequel-logo-new.png", width: 1080, height: 1080, alt: "Zequel" }],
    siteName: "Zequel",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Zequel — Research System",
    description:
      "Structured research workspace for evidence-backed reasoning, multi-document analysis, and traceable synthesis.",
    images: ["/zequel-logo-new.png"],
  },
  applicationName: "Zequel",
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          <div className="relative flex min-h-[100dvh] flex-col bg-background text-foreground">
            <SiteTexture />
            <SiteNav />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
