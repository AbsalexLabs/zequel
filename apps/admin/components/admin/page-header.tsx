import { cn } from "@/lib/utils"

export function PageHeader({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        <h1 className="text-balance text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description ? <p className="max-w-2xl text-pretty text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {children ? <div className="flex flex-wrap items-center gap-2">{children}</div> : null}
    </div>
  )
}

export function SectionHeader({
  title,
  description,
  className,
  children,
}: {
  title: string
  description?: string
  className?: string
  children?: React.ReactNode
}) {
  return (
    <div className={cn("flex items-end justify-between gap-4", className)}>
      <div className="space-y-0.5">
        <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          {title}
        </h2>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </div>
  )
}
