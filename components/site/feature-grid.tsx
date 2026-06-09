import { FileSearch, GitBranch, ShieldCheck, Layers, Quote, Gauge } from 'lucide-react'
import { SectionLabel } from '@/components/site/section-label'
import { cn } from '@/lib/utils'

const FEATURES = [
  {
    icon: FileSearch,
    title: 'Multi-document analysis',
    body: 'Ingest PDFs, papers, and notes. Zequel reads across your entire corpus and reasons over it as one connected body of evidence.',
  },
  {
    icon: Quote,
    title: 'Cited synthesis',
    body: 'Every claim links back to its source passage. No hallucinated facts — answers are grounded in the documents you provide.',
  },
  {
    icon: GitBranch,
    title: 'Traceable reasoning',
    body: 'Follow the full chain of thought from question to conclusion. Inspect each step, verify each inference, reproduce each result.',
  },
  {
    icon: ShieldCheck,
    title: 'Safety & governance',
    body: 'Built-in safety flags, audit logs, and role controls keep research accountable across individuals and teams.',
  },
  {
    icon: Layers,
    title: 'Structured workspace',
    body: 'Organize threads, documents, and findings into a control center designed for sustained, serious research work.',
  },
  {
    icon: Gauge,
    title: 'Fast, low-cost inference',
    body: 'Sub-second median responses on dense source material, so you stay in flow instead of waiting on the model.',
  },
]

export function FeatureGrid() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4">
        <SectionLabel index="01">Capabilities</SectionLabel>
        <h2 className="max-w-2xl text-balance text-3xl font-semibold tracking-[-0.025em] sm:text-4xl">
          Everything a rigorous research process demands
        </h2>
        <p className="max-w-2xl text-pretty leading-relaxed text-muted-foreground">
          Zequel pairs powerful retrieval with disciplined reasoning — so the answers you get are not just plausible,
          but defensible.
        </p>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature, i) => {
          const Icon = feature.icon
          return (
            <div
              key={feature.title}
              className={cn(
                'group flex flex-col gap-4 bg-card p-7 transition-colors hover:bg-secondary/50',
                'border-border',
                i % 1 === 0 && 'border-t sm:border-t-0',
              )}
              style={{
                boxShadow: 'inset 0 0 0 0.5px var(--border)',
              }}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-md border border-border bg-background">
                <Icon size={20} className="text-foreground" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-medium">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{feature.body}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
