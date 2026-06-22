import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { ZequelMark } from '@/components/site/zequel-mark'
import { AUTH_LINKS } from "@/lib/site/links"

export function CtaSection() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="relative isolate flex min-h-[20rem] items-center overflow-hidden rounded-2xl border border-border sm:min-h-[24rem]">
        {/* Video background */}
        <video
          className="absolute inset-0 -z-10 h-full w-full object-cover"
          src="/site/cta-people.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
        />
        {/* Left-weighted scrim keeps the copy legible over the footage */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-gradient-to-r from-black/85 via-black/65 to-black/25"
        />
        <div className="flex max-w-2xl flex-col items-start px-6 py-12 text-left text-white sm:px-12 sm:py-16">
          <ZequelMark size={36} className="text-white" />
          <h2 className="mt-6 max-w-2xl text-balance text-3xl font-semibold tracking-[-0.025em] sm:text-4xl">
            Start building research you can defend
          </h2>
          <p className="mt-4 max-w-xl text-pretty leading-relaxed text-white/75">
            Join researchers, analysts, and teams who treat evidence as non-negotiable. Free to start, no credit card
            required.
          </p>
          <div className="mt-8 flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center">
            <Link
              href={AUTH_LINKS.signup}
              className="group inline-flex h-11 items-center justify-center gap-2 rounded-md bg-white px-6 font-mono text-xs tracking-[0.12em] text-black uppercase transition-opacity hover:opacity-90"
            >
              Get started free
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex h-11 items-center justify-center rounded-md border border-white/30 px-6 font-mono text-xs tracking-[0.12em] text-white uppercase transition-colors hover:bg-white/10"
            >
              Talk to us
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
