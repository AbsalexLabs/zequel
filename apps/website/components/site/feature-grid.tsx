import { SectionLabel } from '@/components/site/section-label'
import { cn } from '@/lib/utils'
import { getFeatures } from '@/lib/site/content'
import { FEATURES_FALLBACK } from '@/lib/site/fallbacks'
import { resolveIcon } from '@/lib/site/icons'

export async function FeatureGrid() {
  const features = await getFeatures(FEATURES_FALLBACK)

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
        {features.map((feature, i) => {
          const Icon = resolveIcon(feature.icon)
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
              <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
