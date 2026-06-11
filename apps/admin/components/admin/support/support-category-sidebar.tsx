"use client"

import {
  Inbox,
  UserCheck,
  CircleDashed,
  CircleDot,
  Clock,
  CheckCircle2,
  Archive,
  Mail,
  Info,
  Bug,
  Globe,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  CATEGORIES,
  SOURCES,
  type CategoryCounts,
  type CategoryId,
  type SourceCounts,
  type TicketSource,
} from "@/lib/admin-dashboard/support-center"

const CATEGORY_ICON: Record<CategoryId, LucideIcon> = {
  all: Inbox,
  assigned_to_me: UserCheck,
  unassigned: CircleDashed,
  open: CircleDot,
  waiting_for_user: Clock,
  resolved: CheckCircle2,
  closed: Archive,
}

const SOURCE_ICON: Record<TicketSource, LucideIcon> = {
  support_email: Mail,
  information_request: Info,
  bug_report: Bug,
  contact_form: Globe,
}

function Row({
  icon: Icon,
  label,
  count,
  active,
  onClick,
}: {
  icon: LucideIcon
  label: string
  count: number
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
        active
          ? "bg-secondary font-medium text-foreground"
          : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
      )}
    >
      <Icon className={cn("size-4 shrink-0", active ? "text-foreground" : "text-muted-foreground")} />
      <span className="truncate">{label}</span>
      <span
        className={cn(
          "ml-auto shrink-0 font-mono text-[11px] tabular-nums",
          active ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {count}
      </span>
    </button>
  )
}

export function SupportCategorySidebar({
  categoryCounts,
  sourceCounts,
  category,
  source,
  onSelectCategory,
  onSelectSource,
}: {
  categoryCounts?: CategoryCounts
  sourceCounts?: SourceCounts
  category: CategoryId
  source: TicketSource | null
  onSelectCategory: (id: CategoryId) => void
  onSelectSource: (id: TicketSource | null) => void
}) {
  return (
    <div className="flex h-full flex-col overflow-y-auto p-3">
      <div className="space-y-4">
        <section className="space-y-1">
          <p className="px-2.5 pb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            Support Categories
          </p>
          {CATEGORIES.map((c) => (
            <Row
              key={c.id}
              icon={CATEGORY_ICON[c.id]}
              label={c.label}
              count={categoryCounts?.[c.id] ?? 0}
              active={source === null && category === c.id}
              onClick={() => {
                onSelectSource(null)
                onSelectCategory(c.id)
              }}
            />
          ))}
        </section>

        <section className="space-y-1">
          <p className="px-2.5 pb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            Submission Sources
          </p>
          {SOURCES.map((s) => (
            <Row
              key={s.id}
              icon={SOURCE_ICON[s.id]}
              label={s.label}
              count={sourceCounts?.[s.id] ?? 0}
              active={source === s.id}
              onClick={() => onSelectSource(source === s.id ? null : s.id)}
            />
          ))}
        </section>
      </div>
    </div>
  )
}
