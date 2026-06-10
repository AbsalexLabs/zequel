import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react"
import { Card } from "@zequel/ui/components/card"
import { cn } from "@/lib/utils"
import { formatPercent } from "@/lib/admin-dashboard/format"

interface StatCardProps {
  label: string
  value: string
  delta?: number
  // When true, a negative delta is "good" (e.g. latency, error rate).
  invertDelta?: boolean
  hint?: string
  icon?: React.ReactNode
}

export function StatCard({ label, value, delta, invertDelta, hint, icon }: StatCardProps) {
  const hasDelta = typeof delta === "number"
  const positive = hasDelta ? (invertDelta ? delta! < 0 : delta! > 0) : false
  const neutral = hasDelta && delta === 0

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-2">
        <span className="font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </span>
        {icon ? <span className="text-muted-foreground">{icon}</span> : null}
      </div>
      <div className="space-y-1">
        <div className="text-3xl font-semibold tracking-tight tabular-nums text-foreground">{value}</div>
        <div className="flex items-center gap-2">
          {hasDelta ? (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 text-xs font-medium tabular-nums",
                neutral
                  ? "text-muted-foreground"
                  : positive
                    ? "text-foreground"
                    : "text-muted-foreground",
              )}
            >
              {neutral ? (
                <Minus className="size-3" />
              ) : (invertDelta ? delta! < 0 : delta! > 0) ? (
                <ArrowUpRight className="size-3" />
              ) : (
                <ArrowDownRight className="size-3" />
              )}
              {formatPercent(delta!)}
            </span>
          ) : null}
          {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
        </div>
      </div>
    </Card>
  )
}
