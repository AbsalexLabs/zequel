import { SectionLabel } from '@/components/site/section-label'

type Partner = {
  name: string
  /** Path to a monochrome SVG mark. When omitted, only the wordmark is shown. */
  logo?: string
}

const PARTNERS: Partner[] = [
  { name: 'Absalex Labs' },
  { name: 'OpenAlex' },
  { name: 'Semantic Scholar', logo: '/site/partners/semantic-scholar.svg' },
  { name: 'CrossRef' },
  { name: 'arXiv', logo: '/site/partners/arxiv.svg' },
  { name: 'PubMed', logo: '/site/partners/pubmed.svg' },
  { name: 'Zenodo', logo: '/site/partners/zenodo.svg' },
  { name: 'ORCID', logo: '/site/partners/orcid.svg' },
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

        {/* Partner logo line — single row, dimmed and faded toward both edges */}
        <div
          className="mt-12 overflow-x-auto"
          style={{
            maskImage:
              'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
            WebkitMaskImage:
              'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
          }}
        >
          <ul className="flex w-max min-w-full items-center justify-between gap-10 py-2 sm:gap-14">
            {PARTNERS.map((partner) => (
              <li
                key={partner.name}
                className="flex shrink-0 items-center gap-2.5 opacity-50 grayscale transition hover:opacity-90"
              >
                {partner.logo && (
                  <span
                    aria-hidden="true"
                    className="h-5 w-5 bg-foreground"
                    style={{
                      maskImage: `url(${partner.logo})`,
                      WebkitMaskImage: `url(${partner.logo})`,
                      maskSize: 'contain',
                      WebkitMaskSize: 'contain',
                      maskRepeat: 'no-repeat',
                      WebkitMaskRepeat: 'no-repeat',
                      maskPosition: 'center',
                      WebkitMaskPosition: 'center',
                    }}
                  />
                )}
                <span className="whitespace-nowrap font-mono text-xs tracking-[0.15em] text-foreground uppercase">
                  {partner.name}
                </span>
              </li>
            ))}
          </ul>
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
