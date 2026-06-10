import { SectionLabel } from '@/components/site/section-label'

const PARTNERS = [
  'Absalex Labs',
  'OpenAlex',
  'Semantic Scholar',
  'CrossRef',
  'arXiv',
  'PubMed',
  'Zenodo',
  'ORCID',
]

const TIERS = [
  {
    title: 'Research institutions',
    body: 'Universities and labs deploy Zequel for reproducible literature reviews and grant-grade evidence trails.',
  },
  {
    title: 'Data & API partners',
    body: 'Indexed sources and metadata providers connect directly, so every claim resolves to a verifiable origin.',
  },
  {
    title: 'Integration partners',
    body: 'Reference managers, knowledge bases, and analysis tools extend Zequel into existing research workflows.',
  },
]

export function PartnershipSection() {
  return (
    <section className="border-y border-border">
      <div className="mx-auto w-full max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start gap-4">
          <SectionLabel index="04">Partnerships</SectionLabel>
          <h2 className="max-w-2xl text-balance text-3xl font-semibold tracking-[-0.025em] text-foreground sm:text-4xl">
            Built with the institutions and sources that research depends on
          </h2>
          <p className="max-w-xl text-pretty leading-relaxed text-muted-foreground">
            Zequel partners across the research stack — from data providers to institutions — so evidence stays
            connected to its source.
          </p>
        </div>

        {/* Partner logo wall */}
        <div className="mt-12 grid grid-cols-2 overflow-hidden rounded-xl border border-border sm:grid-cols-4">
          {PARTNERS.map((name, i) => (
            <div
              key={name}
              className="flex h-24 items-center justify-center border-b border-r border-border p-4 [&:nth-child(2n)]:border-r-0 sm:[&:nth-child(2n)]:border-r [&:nth-child(4n)]:sm:border-r-0"
            >
              <span className="text-center font-mono text-xs tracking-[0.15em] text-muted-foreground uppercase">
                {name}
              </span>
            </div>
          ))}
        </div>

        {/* Partnership tiers */}
        <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-3">
          {TIERS.map((tier) => (
            <div key={tier.title} className="flex flex-col gap-3 bg-background p-6">
              <h3 className="text-base font-semibold tracking-[-0.01em] text-foreground">{tier.title}</h3>
              <p className="text-pretty text-sm leading-relaxed text-muted-foreground">{tier.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
