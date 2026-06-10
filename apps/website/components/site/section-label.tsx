import { cn } from '@/lib/utils'

/**
 * Mono-uppercase tracked label used to tag sections.
 * Matches the brand's "TOTAL USERS" / "SYSTEM STATUS" treatment.
 */
export function SectionLabel({
  children,
  className,
  index,
}: {
  children: React.ReactNode
  className?: string
  index?: string
}) {
  return (
    <div className={cn('flex items-center gap-2 font-mono text-[11px] tracking-[0.2em] text-muted-foreground uppercase', className)}>
      {index ? <span className="text-foreground">{index}</span> : <span className="h-px w-6 bg-border" />}
      <span>{children}</span>
    </div>
  )
}
