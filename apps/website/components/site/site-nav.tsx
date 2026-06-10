'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ZequelMark } from '@/components/site/zequel-mark'
import { ThemeToggle } from '@zequel/ui/components/theme-toggle'

const NAV_LINKS = [
  { href: '/site/features', label: 'Features' },
  { href: '/site/pricing', label: 'Pricing' },
  { href: '/site/docs', label: 'Docs' },
  { href: '/site/blog', label: 'Blog' },
  { href: '/site/about', label: 'About' },
]

export function SiteNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full border-b transition-colors duration-300',
        scrolled ? 'border-border bg-background/80 backdrop-blur-md' : 'border-transparent bg-transparent',
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/site" className="flex items-center gap-2.5">
          <ZequelMark size={24} className="text-foreground" />
          <span className="font-mono text-sm font-semibold tracking-[0.2em] text-foreground uppercase">Zequel</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'font-mono text-xs tracking-[0.1em] uppercase transition-colors hover:text-foreground',
                pathname === link.href ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          <Link
            href="/auth/login"
            className="font-mono text-xs tracking-[0.1em] text-muted-foreground uppercase transition-colors hover:text-foreground"
          >
            Sign in
          </Link>
          <Link
            href="/auth/sign-up"
            className="inline-flex h-9 items-center rounded-md bg-primary px-4 font-mono text-xs tracking-[0.1em] text-primary-foreground uppercase transition-opacity hover:opacity-90"
          >
            Get started
          </Link>
        </div>

        <div className="flex items-center gap-1.5 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-foreground"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <nav className="mx-auto flex w-full max-w-6xl flex-col px-4 py-2 sm:px-6">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'border-b border-border py-3 font-mono text-xs tracking-[0.1em] uppercase',
                  pathname === link.href ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex flex-col gap-2 py-4">
              <Link
                href="/auth/login"
                className="inline-flex h-10 items-center justify-center rounded-md border border-border font-mono text-xs tracking-[0.1em] uppercase"
              >
                Sign in
              </Link>
              <Link
                href="/auth/sign-up"
                className="inline-flex h-10 items-center justify-center rounded-md bg-primary font-mono text-xs tracking-[0.1em] text-primary-foreground uppercase"
              >
                Get started
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
