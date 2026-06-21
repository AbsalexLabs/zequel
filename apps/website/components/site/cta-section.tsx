import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { ZequelIcon } from '@zequel/ui/components/zequel-icon'
import { AUTH_LINKS } from "@/lib/site/links"

export function CtaSection() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="relative flex min-h-[34rem] items-center justify-center overflow-hidden rounded-3xl border border-border bg-card px-6 py-20 sm:min-h-[40rem] sm:px-12">
        {/* Two-hands engraving background. White is dropped via blend modes so only the
            crosshatch hands remain — inverted in dark mode so they read as light. */}
        <Image
          src="/site/contact-hands.jpg"
          alt=""
          aria-hidden
          fill
          priority
          sizes="(max-width: 1152px) 100vw, 1152px"
          className="pointer-events-none select-none object-cover opacity-90 mix-blend-multiply dark:opacity-80 dark:mix-blend-screen dark:invert"
        />

        {/* Soft focus halo behind the copy so it stays legible over the artwork */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-[36rem] max-w-[90%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-card/70 blur-2xl"
        />

        <div className="relative z-10 flex flex-col items-center text-center">
          <ZequelIcon size={36} className="text-foreground" />
          <h2 className="mt-6 max-w-2xl text-balance text-3xl font-semibold tracking-[-0.025em] text-foreground sm:text-4xl">
            Start building research you can defend
          </h2>
          <p className="mt-4 max-w-xl text-pretty leading-relaxed text-muted-foreground">
            Join researchers, analysts, and teams who treat evidence as non-negotiable. Free to start, no credit card
            required.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
            <Link
              href={AUTH_LINKS.signup}
              className="group inline-flex h-11 items-center gap-2 rounded-md bg-primary px-6 font-mono text-xs uppercase tracking-[0.12em] text-primary-foreground transition-opacity hover:opacity-90"
            >
              Get started free
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex h-11 items-center rounded-md border border-border bg-background/80 px-6 font-mono text-xs uppercase tracking-[0.12em] text-foreground backdrop-blur transition-colors hover:bg-muted"
            >
              Talk to us
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
