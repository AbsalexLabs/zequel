import { SectionLabel } from '@/components/site/section-label'

const STEPS = [
  {
    step: '01',
    title: 'Bring your sources',
    body: 'Upload documents, papers, and notes — or connect a corpus. Zequel indexes everything into a searchable evidence base.',
  },
  {
    step: '02',
    title: 'Ask in plain language',
    body: 'Pose questions the way you think about them. Zequel retrieves the relevant passages and reasons across them.',
  },
  {
    step: '03',
    title: 'Get traceable answers',
    body: 'Receive synthesized conclusions with every claim cited back to its source — ready to verify, share, or build on.',
  },
]

export function HowItWorks() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4">
        <SectionLabel index="03">Workflow</SectionLabel>
        <h2 className="max-w-2xl text-balance text-3xl font-semibold tracking-[-0.025em] sm:text-4xl">
          From documents to defensible answers
        </h2>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border md:grid-cols-3">
        {STEPS.map((item) => (
          <div key={item.step} className="flex flex-col gap-4 bg-card p-8" style={{ boxShadow: 'inset 0 0 0 0.5px var(--border)' }}>
            <span className="font-mono text-5xl font-semibold tracking-[-0.04em] text-foreground/15">{item.step}</span>
            <h3 className="text-lg font-medium">{item.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{item.body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
