import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { ZequelIcon } from '@zequel/ui/components/zequel-icon'
import { AUTH_LINKS } from "@/lib/site/links"

export function CtaSection() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-primary px-6 py-16 text-center text-primary-foreground sm:px-12 sm:py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="relative flex flex-col items-center">
          <ZequelIcon size={36} className="text-primary-foreground" />
          <h2 className="mt-6 max-w-2xl text-balance text-3xl font-semibold tracking-[-0.025em] sm:text-4xl">
            Start building research you can defend
          </h2>
          <p className="mt-4 max-w-xl text-pretty leading-relaxed text-primary-foreground/70">
            Join researchers, analysts, and teams who treat evidence as non-negotiable. Free to start, no credit card
            required.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
            <Link
              href={AUTH_LINKS.signup}
              className="group inline-flex h-11 items-center gap-2 rounded-md bg-background px-6 font-mono text-xs tracking-[0.12em] text-foreground uppercase transition-opacity hover:opacity-90"
            >
              Get started free
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex h-11 items-center rounded-md border border-primary-foreground/25 px-6 font-mono text-xs tracking-[0.12em] text-primary-foreground uppercase transition-colors hover:bg-primary-foreground/10"
            >
              Talk to us
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
