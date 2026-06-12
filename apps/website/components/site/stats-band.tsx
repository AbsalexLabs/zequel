import { getStats } from '@/lib/site/content'
import { HOME_STATS_FALLBACK } from '@/lib/site/fallbacks'

export async function StatsBand() {
  const stats = await getStats(HOME_STATS_FALLBACK, 'home')

  return (
    <section className="border-y border-border bg-secondary/40">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-px overflow-hidden px-4 sm:px-6 lg:grid-cols-4 lg:px-8">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className="flex flex-col gap-1.5 px-2 py-10 sm:px-6"
            style={{ borderLeft: i % 4 === 0 ? undefined : '1px solid var(--border)' }}
          >
            <span className="text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">{stat.value}</span>
            <span className="font-mono text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
