import type { Metadata } from 'next'
import { SiteNav } from '@/components/site/site-nav'
import { SiteFooter } from '@/components/site/site-footer'
import { SiteTexture } from '@/components/site/site-texture'

export const metadata: Metadata = {
  title: {
    default: 'Zequel — The Research System for Evidence-Backed Reasoning',
    template: '%s — Zequel',
  },
  description:
    'Zequel is a structured research workspace for evidence-backed reasoning, multi-document analysis, and traceable synthesis. Built by Absalex Labs.',
}

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-background text-foreground">
      <SiteTexture />
      <SiteNav />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  )
}
