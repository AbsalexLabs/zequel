import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { ProductFrame } from '@/components/site/product-frame'
import { getHero } from '@/lib/site/content'
import { HOME_HERO_FALLBACK } from '@/lib/site/fallbacks'

export async function Hero() {
  const hero = await getHero('home', HOME_HERO_FALLBACK)

  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto w-full max-w-6xl px-4 pt-20 pb-12 sm:px-6 sm:pt-28 lg:px-8">
        <div className="flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3.5 py-1.5 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
            <span className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
              {hero.eyebrow}
            </span>
          </div>

          <h1 className="mt-7 max-w-4xl text-balance text-4xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-6xl lg:text-7xl">
            {hero.headline}
          </h1>

          <p className="mt-6 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            {hero.subhead}
          </p>

          <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
            <Link
              href={hero.primaryCtaHref}
              className="group inline-flex h-11 items-center gap-2 rounded-md bg-primary px-6 font-mono text-xs tracking-[0.12em] text-primary-foreground uppercase transition-opacity hover:opacity-90"
            >
              {hero.primaryCtaLabel}
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href={hero.secondaryCtaHref}
              className="inline-flex h-11 items-center rounded-md border border-border bg-background px-6 font-mono text-xs tracking-[0.12em] text-foreground uppercase transition-colors hover:bg-secondary"
            >
              {hero.secondaryCtaLabel}
            </Link>
          </div>

          <p className="mt-5 font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
            No credit card required &middot; Free research tier
          </p>
        </div>

        <div className="relative mx-auto mt-16 max-w-5xl">
          <ProductFrame
            src="/site/product-overview.png"
            alt="Zequel control center showing usage, revenue, and system health"
            label="zequel.xyz/workspace"
            priority
          />
        </div>
      </div>
    </section>
  )
}
