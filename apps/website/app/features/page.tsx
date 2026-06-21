import type { Metadata } from 'next'
import { PageHero } from '@/components/site/page-hero'
import { ProductFrame } from '@/components/site/product-frame'
import { SectionLabel } from '@/components/site/section-label'
import { CtaSection } from '@/components/site/cta-section'
import { cn } from '@/lib/utils'
import { getPillars } from '@/lib/site/content'
import { FEATURES_PILLARS_FALLBACK } from '@/lib/site/fallbacks'
import { resolveIcon } from '@/lib/site/icons'

export const metadata: Metadata = {
  title: 'Features',
  description:
    'Three connected workspaces — Study, Research, and Coding — with evidence-backed answers, deep document analysis, and an AI coding companion.',
}

export const revalidate = 60

export default async function FeaturesPage() {
  // Pillars resolve from published CMS rows, falling back to bundled defaults.
  const pillars = await getPillars(FEATURES_PILLARS_FALLBACK)

  return (
    <>
      <PageHero
        label="Features"
        title="Three workspaces, one intelligent instrument"
        description="Study, research, and code in connected workspaces — each pairing powerful retrieval with disciplined reasoning, so the work you produce is not just plausible, but defensible."
      />

      <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-24">
          {pillars.map((pillar, i) => (
            <div key={pillar.title} className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
              <div className={cn('flex flex-col gap-6', i % 2 === 1 && 'lg:order-2')}>
                <SectionLabel index={`0${i + 1}`}>{pillar.label}</SectionLabel>
                <h2 className="text-balance text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">{pillar.title}</h2>
                <p className="text-pretty leading-relaxed text-muted-foreground">{pillar.body}</p>
                <ul className="flex flex-col gap-4">
                  {pillar.points.map((point) => {
                    const Icon = resolveIcon(point.icon)
                    return (
                      <li key={point.text} className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-card">
                          <Icon size={17} strokeWidth={1.5} className="text-foreground" />
                        </span>
                        <span className="text-sm text-foreground/90">{point.text}</span>
                      </li>
                    )
                  })}
                </ul>
              </div>
              <div className={cn(i % 2 === 1 && 'lg:order-1')}>
                <ProductFrame src={pillar.image} srcDark={pillar.imageDark} alt={pillar.title} label={pillar.url} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <CtaSection />
    </>
  )
}
