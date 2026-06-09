import Link from 'next/link'
import { ZequelIcon } from '@/components/zequel-icon'

const FOOTER_COLUMNS = [
  {
    title: 'Product',
    links: [
      { href: '/site/features', label: 'Features' },
      { href: '/site/pricing', label: 'Pricing' },
      { href: '/site/docs', label: 'Documentation' },
      { href: '/workspace', label: 'Open workspace' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/site/about', label: 'About' },
      { href: '/site/blog', label: 'Blog' },
      { href: '/site/contact', label: 'Contact' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { href: '/site/docs', label: 'Getting started' },
      { href: '/site/docs', label: 'API reference' },
      { href: '/site/blog', label: 'Changelog' },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-5">
          <div className="col-span-2 flex flex-col gap-4">
            <Link href="/site" className="flex items-center gap-2.5">
              <ZequelIcon size={22} className="text-foreground" />
              <span className="font-mono text-sm font-semibold tracking-[0.2em] text-foreground uppercase">Zequel</span>
            </Link>
            <p className="max-w-xs text-pretty text-sm leading-relaxed text-muted-foreground">
              A structured research system for evidence-backed reasoning, multi-document analysis, and traceable
              synthesis.
            </p>
            <p className="font-mono text-[11px] tracking-[0.15em] text-muted-foreground uppercase">
              Developed by Absalex Labs
            </p>
          </div>

          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title} className="flex flex-col gap-4">
              <span className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
                {col.title}
              </span>
              <ul className="flex flex-col gap-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-foreground/80 transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-border pt-8 sm:flex-row sm:items-center">
          <p className="font-mono text-[11px] tracking-[0.12em] text-muted-foreground uppercase">
            &copy; {new Date().getFullYear()} Zequel — All rights reserved
          </p>
          <div className="flex items-center gap-6">
            <Link href="/site/legal/privacy" className="font-mono text-[11px] tracking-[0.12em] text-muted-foreground uppercase transition-colors hover:text-foreground">
              Privacy
            </Link>
            <Link href="/site/legal/terms" className="font-mono text-[11px] tracking-[0.12em] text-muted-foreground uppercase transition-colors hover:text-foreground">
              Terms
            </Link>
            <span className="flex items-center gap-2 font-mono text-[11px] tracking-[0.12em] text-muted-foreground uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
              All systems operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
