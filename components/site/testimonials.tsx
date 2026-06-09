import { SectionLabel } from '@/components/site/section-label'

const TESTIMONIALS = [
  {
    quote:
      'Zequel changed how my lab handles literature reviews. Every synthesis comes with citations, so I can verify in seconds instead of hours.',
    name: 'Dr. Elena Royce',
    role: 'Principal Researcher, Computational Biology',
  },
  {
    quote:
      'The traceable reasoning is the killer feature. I can show reviewers exactly how a conclusion was reached, step by step.',
    name: 'Marcus Adeyemi',
    role: 'Policy Analyst',
  },
  {
    quote:
      'It feels like an instrument built for serious work — dense, fast, and honest about its sources. Nothing else comes close.',
    name: 'Priya Nair',
    role: 'Research Lead, Legal Tech',
  },
]

export function Testimonials() {
  return (
    <section className="border-t border-border bg-secondary/30">
      <div className="mx-auto w-full max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4">
          <SectionLabel index="04">Voices</SectionLabel>
          <h2 className="max-w-2xl text-balance text-3xl font-semibold tracking-[-0.025em] sm:text-4xl">
            Trusted by people who can&apos;t afford to be wrong
          </h2>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure
              key={t.name}
              className="flex flex-col justify-between gap-8 rounded-xl border border-border bg-card p-7"
            >
              <blockquote className="text-pretty leading-relaxed text-foreground/90">&ldquo;{t.quote}&rdquo;</blockquote>
              <figcaption className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">{t.name}</span>
                <span className="font-mono text-[11px] tracking-[0.12em] text-muted-foreground uppercase">
                  {t.role}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
