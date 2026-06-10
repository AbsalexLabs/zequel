import type { Metadata } from 'next'
import { PageHero } from '@/components/site/page-hero'
import { SectionLabel } from '@/components/site/section-label'
import { CtaSection } from '@/components/site/cta-section'

export const metadata: Metadata = {
  title: 'About',
  description:
    'Zequel is built by Absalex Labs to make research rigorous, traceable, and trustworthy. Learn about our mission and principles.',
}

const PRINCIPLES = [
  {
    title: 'Evidence over assertion',
    body: 'A confident answer means nothing without a source. We hold every output to the standard of provable, citable evidence.',
  },
  {
    title: 'Transparency over magic',
    body: 'Research tools should show their work. We expose the full reasoning path so results can be inspected and reproduced.',
  },
  {
    title: 'Rigor over speed',
    body: 'We move fast, but never at the expense of correctness. Defensible conclusions are the only conclusions worth shipping.',
  },
  {
    title: 'Accountability over convenience',
    body: 'Serious research demands a record. Audit trails and governance are foundations, not afterthoughts.',
  },
]

const VALUES = [
  { value: '2023', label: 'Founded' },
  { value: 'Remote', label: 'Team' },
  { value: 'Absalex Labs', label: 'Built by' },
  { value: 'Research-first', label: 'Mandate' },
]

export default function AboutPage() {
  return (
    <>
      <PageHero
        label="About"
        title="Research deserves better instruments"
        description="Zequel was created by Absalex Labs on a simple conviction: the answers that shape decisions should be traceable to the evidence behind them."
      />

      <section className="mx-auto w-full max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 text-pretty text-lg leading-relaxed text-foreground/90">
          <p>
            Most AI tools optimize for fluency. They produce text that sounds right, whether or not it is. For
            research — where a wrong conclusion has real consequences — that is not good enough.
          </p>
          <p>
            We built Zequel as an instrument, not a chatbot. It reasons across the documents you trust, cites every
            claim it makes, and records the path from question to answer so you can verify each step. The point is not
            to replace the researcher, but to make rigorous work faster and more accountable.
          </p>
          <p>
            We are a small, focused team at Absalex Labs, building for the people who cannot afford to be wrong.
          </p>
        </div>
      </section>

      <section className="border-y border-border bg-secondary/40">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-px px-4 sm:px-6 lg:grid-cols-4 lg:px-8">
          {VALUES.map((item, i) => (
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
          {PRINCIPLES.map((p) => (
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
