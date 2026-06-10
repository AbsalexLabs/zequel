import Link from 'next/link'
import { Linkedin, Youtube } from 'lucide-react'
import { ZequelMark } from '@/components/site/zequel-mark'

/** X (formerly Twitter) glyph — not available in lucide, so provided inline. */
function XIcon({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
    </svg>
  )
}

const SOCIAL_LINKS = [
  { href: 'https://x.com/zequel', label: 'X (Twitter)', Icon: XIcon },
  { href: 'https://www.linkedin.com/company/zequel', label: 'LinkedIn', Icon: Linkedin },
  { href: 'https://www.youtube.com/@zequel', label: 'YouTube', Icon: Youtube },
]

const FOOTER_COLUMNS = [
  {
    title: 'Product',
    links: [
      { href: '/features', label: 'Features' },
      { href: '/pricing', label: 'Pricing' },
      { href: '/docs', label: 'Documentation' },
      { href: '/workspace', label: 'Open workspace' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/about', label: 'About' },
      { href: '/blog', label: 'Blog' },
      { href: '/contact', label: 'Contact' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { href: '/docs', label: 'Getting started' },
      { href: '/docs', label: 'API reference' },
      { href: '/blog', label: 'Changelog' },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-5">
          <div className="col-span-2 flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2.5">
              <ZequelMark size={24} className="text-foreground" />
              <span className="font-mono text-sm font-semibold tracking-[0.2em] text-foreground uppercase">Zequel</span>
            </Link>
            <p className="max-w-xs text-pretty text-sm leading-relaxed text-muted-foreground">
              A structured research system for evidence-backed reasoning, multi-document analysis, and traceable
              synthesis.
            </p>
            <p className="font-mono text-[11px] tracking-[0.15em] text-muted-foreground uppercase">
              Developed by Absalex Labs
            </p>
            <div className="mt-1 flex items-center gap-2">
              {SOCIAL_LINKS.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
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
            <Link href="/legal/privacy" className="font-mono text-[11px] tracking-[0.12em] text-muted-foreground uppercase transition-colors hover:text-foreground">
              Privacy
            </Link>
            <Link href="/legal/terms" className="font-mono text-[11px] tracking-[0.12em] text-muted-foreground uppercase transition-colors hover:text-foreground">
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
