const STATS = [
  { value: '92,418', label: 'Documents indexed' },
  { value: '1.3M', label: 'Evidence-backed queries' },
  { value: '612ms', label: 'Median response' },
  { value: '99.98%', label: 'Uptime' },
]

export function StatsBand() {
  return (
    <section className="border-y border-border bg-secondary/40">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-px overflow-hidden px-4 sm:px-6 lg:grid-cols-4 lg:px-8">
        {STATS.map((stat, i) => (
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
