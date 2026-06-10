import { cn } from "@/lib/utils"

type Tone = "neutral" | "active" | "muted" | "warn" | "danger"

const TONE_CLASS: Record<Tone, string> = {
  // Monochrome-first. "danger" is the only place we let red through,
  // matching Zequel's --destructive usage.
  neutral: "border-border bg-secondary text-secondary-foreground",
  active: "border-transparent bg-primary text-primary-foreground",
  muted: "border-border bg-transparent text-muted-foreground",
  warn: "border-foreground/30 bg-transparent text-foreground",
  danger: "border-transparent bg-destructive/10 text-destructive",
}

// Central mapping from any domain status string to a visual tone.
const STATUS_TONE: Record<string, Tone> = {
  // users / generic
  active: "active",
  suspended: "danger",
  invited: "muted",
  // subscriptions
  trialing: "warn",
  past_due: "danger",
  canceled: "muted",
  // ai usage
  success: "active",
  error: "danger",
  throttled: "warn",
  // conversations
  archived: "muted",
  flagged: "danger",
  // documents
  indexed: "active",
  processing: "warn",
  failed: "danger",
  // safety actions
  blocked: "danger",
  reviewed: "neutral",
  dismissed: "muted",
  // tickets
  open: "active",
  pending: "warn",
  resolved: "neutral",
  closed: "muted",
}

function labelize(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

export function StatusPill({ status, tone }: { status: string; tone?: Tone }) {
  const resolved = tone ?? STATUS_TONE[status] ?? "neutral"
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium",
        TONE_CLASS[resolved],
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          resolved === "active" && "bg-current",
          resolved === "danger" && "bg-destructive",
          resolved === "warn" && "bg-foreground",
          (resolved === "muted" || resolved === "neutral") && "bg-muted-foreground",
        )}
        aria-hidden
      />
      {labelize(status)}
    </span>
  )
}

const SEVERITY_TONE: Record<string, Tone> = {
  low: "muted",
  medium: "neutral",
  high: "warn",
  critical: "danger",
}

export function SeverityPill({ severity }: { severity: string }) {
  return <StatusPill status={severity} tone={SEVERITY_TONE[severity] ?? "neutral"} />
}

const PRIORITY_TONE: Record<string, Tone> = {
  low: "muted",
  normal: "neutral",
  high: "warn",
  urgent: "danger",
}

export function PriorityPill({ priority }: { priority: string }) {
  return <StatusPill status={priority} tone={PRIORITY_TONE[priority] ?? "neutral"} />
}
