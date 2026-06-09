import type { Metadata } from 'next'
import { PageHero } from '@/components/site/page-hero'
import { ProductFrame } from '@/components/site/product-frame'
import { SectionLabel } from '@/components/site/section-label'
import { CtaSection } from '@/components/site/cta-section'
import { FileSearch, GitBranch, ShieldCheck, Layers, Quote, Gauge, Users, Database, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Features',
  description:
    'Multi-document analysis, cited synthesis, traceable reasoning, and built-in governance — every capability Zequel offers for rigorous research.',
}

const PILLARS = [
  {
    label: 'Evidence',
    title: 'Answers grounded in your sources',
    body: 'Zequel reads across your entire corpus and reasons over it as a connected body of evidence. Every conclusion is assembled from passages you can open, read, and verify.',
    src: '/site/product-overview.png',
    url: 'zequel.app/workspace',
    points: [
      { icon: FileSearch, text: 'Ingest PDFs, papers, and notes at scale' },
      { icon: Quote, text: 'Inline citations on every generated claim' },
      { icon: Database, text: 'Searchable, persistent evidence base' },
    ],
  },
  {
    label: 'Traceability',
    title: 'Reasoning you can follow end to end',
    body: 'Inspect the full chain from question to conclusion. Each inference is recorded so results are reproducible and reviewable — not a black box.',
    src: '/site/product-charts.png',
    url: 'zequel.app/workspace/overview',
    points: [
      { icon: GitBranch, text: 'Step-by-step reasoning trails' },
      { icon: Gauge, text: 'Live latency and request analytics' },
      { icon: Layers, text: 'Structured threads and findings' },
    ],
  },
  {
    label: 'Governance',
    title: 'Accountable by design',
    body: 'Safety flags, audit logs, and role-based controls keep research defensible across individuals and teams. Know who did what, and why.',
    src: '/site/product-safety.png',
    url: 'zequel.app/workspace/safety',
    points: [
      { icon: ShieldCheck, text: 'Automated safety and policy flags' },
      { icon: Users, text: 'Role-based access and review queues' },
      { icon: Bell, text: 'Full, immutable audit trail' },
    ],
  },
]

export default function FeaturesPage() {
  return (
    <>
      <PageHero
        label="Features"
        title="Capabilities built for serious research"
        description="Zequel pairs powerful retrieval with disciplined reasoning. The result is research output that is not just plausible, but defensible."
      />

      <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-24">
          {PILLARS.map((pillar, i) => (
            <div key={pillar.title} className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
              <div className={cn('flex flex-col gap-6', i % 2 === 1 && 'lg:order-2')}>
                <SectionLabel index={`0${i + 1}`}>{pillar.label}</SectionLabel>
                <h2 className="text-balance text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">{pillar.title}</h2>
                <p className="text-pretty leading-relaxed text-muted-foreground">{pillar.body}</p>
                <ul className="flex flex-col gap-4">
                  {pillar.points.map((point) => {
                    const Icon = point.icon
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
                <ProductFrame src={pillar.src} alt={pillar.title} label={pillar.url} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <CtaSection />
    </>
  )
}
