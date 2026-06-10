import { Card } from "@zequel/ui/components/card"
import { relativeTime } from "@/lib/admin-dashboard/format"

interface ActivityItem {
  id: string
  actor: string
  action: string
  time: string
}

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <Card className="gap-0 p-0">
      <div className="border-b border-border px-5 py-4">
        <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          Recent Activity
        </h2>
      </div>
      <ol className="divide-y divide-border">
        {items.map((item) => (
          <li key={item.id} className="flex items-start gap-3 px-5 py-3.5">
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-foreground" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-foreground">
                <span className="font-medium">{item.actor}</span>{" "}
                <span className="text-muted-foreground">{item.action}</span>
              </p>
              <p className="mt-0.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                {relativeTime(item.time)}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  )
}
