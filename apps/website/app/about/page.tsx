import type { Metadata } from 'next'
import { PageHero } from '@/components/site/page-hero'
import { SectionLabel } from '@/components/site/section-label'
import { CtaSection } from '@/components/site/cta-section'
import { getAboutStory, getStats, getPrinciples } from '@/lib/site/content'
import { ABOUT_STORY_FALLBACK, ABOUT_VALUES_FALLBACK, ABOUT_PRINCIPLES_FALLBACK } from '@/lib/site/fallbacks'

export const metadata: Metadata = {
  title: 'About',
  description:
    'Zequel is built by Absalex Labs to make research rigorous, traceable, and trustworthy. Learn about our mission and principles.',
}

export const revalidate = 60

export default async function AboutPage() {
  const [story, values, principles] = await Promise.all([
    getAboutStory(ABOUT_STORY_FALLBACK),
    getStats(ABOUT_VALUES_FALLBACK, 'about'),
    getPrinciples(ABOUT_PRINCIPLES_FALLBACK),
  ])

  return (
    <>
      <PageHero
        label="About"
        title="Research deserves better instruments"
        description="Zequel was created by Absalex Labs on a simple conviction: the answers that shape decisions should be traceable to the evidence behind them."
      />

      <section className="mx-auto w-full max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 text-pretty text-lg leading-relaxed text-foreground/90">
          {story.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-secondary/40">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-px px-4 sm:px-6 lg:grid-cols-4 lg:px-8">
          {values.map((item, i) => (
            <div
              key={item.label}
              className="flex flex-col gap-1.5 px-2 py-10 sm:px-6"
              style={{ borderLeft: i % 4 === 0 ? undefined : '1px solid var(--border)' }}
            >
              <span className="text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">{item.value}</span>
              <span className="font-mono text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionLabel index="01">Principles</SectionLabel>
        <h2 className="mt-4 max-w-2xl text-balance text-3xl font-semibold tracking-[-0.025em] sm:text-4xl">
          What we build by
        </h2>
        <div className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border sm:grid-cols-2">
          {principles.map((p) => (
            <div key={p.title} className="flex flex-col gap-3 bg-card p-8" style={{ boxShadow: 'inset 0 0 0 0.5px var(--border)' }}>
              <h3 className="text-lg font-medium">{p.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      <CtaSection />
    </>
  )
}
