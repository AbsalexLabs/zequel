import { StatusPill } from "@/components/admin/status-pill"

type Tone = "neutral" | "active" | "muted" | "warn" | "danger"

// Maps every CMS-specific status string to a visual tone using the shared
// StatusPill. Keeps the monochrome-first Zequel look (danger = destructive only).
const CMS_STATUS_TONE: Record<string, Tone> = {
  // publish status
  published: "active",
  draft: "warn",
  scheduled: "neutral",
  archived: "muted",
  // contact messages
  new: "active",
  read: "neutral",
  replied: "muted",
  // feature requests
  open: "active",
  planned: "warn",
  in_progress: "warn",
  shipped: "neutral",
  declined: "muted",
  // bug status
  triaged: "warn",
  resolved: "neutral",
  wont_fix: "muted",
}

export function CmsStatusPill({ status }: { status: string }) {
  return <StatusPill status={status} tone={CMS_STATUS_TONE[status] ?? "neutral"} />
}

const CHANGELOG_TONE: Record<string, Tone> = {
  feature: "active",
  improvement: "neutral",
  fix: "warn",
  security: "danger",
}

export function ChangelogTypePill({ type }: { type: string }) {
  return <StatusPill status={type} tone={CHANGELOG_TONE[type] ?? "neutral"} />
}
