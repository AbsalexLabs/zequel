"use client"

import { useMemo, useState } from "react"
import { History, Settings2, ArrowRight, Ban, BadgeCheck, CreditCard, RefreshCw, Plus } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { StatusPill } from "@/components/admin/status-pill"
import { computeMrr, TIER_SEATS } from "@/lib/admin-dashboard/mock-data"
import { formatCurrency, formatDateTime, relativeTime } from "@/lib/admin-dashboard/format"
import type {
  Subscription,
  SubscriptionEvent,
  SubscriptionEventType,
  SubscriptionTier,
} from "@/lib/admin-dashboard/types"

const PAID_TIERS: SubscriptionTier[] = ["pro", "team", "enterprise"]
const TIER_LABEL: Record<SubscriptionTier, string> = {
  free: "Free",
  pro: "Pro",
  team: "Team",
  enterprise: "Enterprise",
}

const EVENT_META: Record<SubscriptionEventType, { label: string; icon: typeof BadgeCheck }> = {
  granted: { label: "Plan granted", icon: BadgeCheck },
  tier_changed: { label: "Plan changed", icon: ArrowRight },
  renewed: { label: "Renewed", icon: RefreshCw },
  payment_failed: { label: "Payment failed", icon: CreditCard },
  revoked: { label: "Revoked", icon: Ban },
  reactivated: { label: "Reactivated", icon: Plus },
}

export interface ManageResult {
  status: Subscription["status"]
  tier: SubscriptionTier
  mrr: number
  seats: number
  event: Omit<SubscriptionEvent, "id" | "subscriptionId">
}

export function SubscriptionRowActions({
  subscription,
  events,
  canRevoke,
  actor,
  onApply,
}: {
  subscription: Subscription
  events: SubscriptionEvent[]
  canRevoke: boolean
  actor: string
  onApply: (subId: string, result: ManageResult) => void
}) {
  const [manageOpen, setManageOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)

  return (
    <div className="flex items-center justify-end gap-1.5">
      <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-2" onClick={() => setHistoryOpen(true)}>
        <History className="size-3.5" />
        <span className="hidden sm:inline">History</span>
      </Button>
      <Button variant="outline" size="sm" className="h-8 gap-1.5 px-2.5" onClick={() => setManageOpen(true)}>
        <Settings2 className="size-3.5" />
        Manage
      </Button>

      <ManageDialog
        open={manageOpen}
        onOpenChange={setManageOpen}
        subscription={subscription}
        canRevoke={canRevoke}
        actor={actor}
        onApply={onApply}
      />
      <HistoryDialog
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        subscription={subscription}
        events={events}
      />
    </div>
  )
}

function ManageDialog({
  open,
  onOpenChange,
  subscription,
  canRevoke,
  actor,
  onApply,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  subscription: Subscription
  canRevoke: boolean
  actor: string
  onApply: (subId: string, result: ManageResult) => void
}) {
  const isRevoked = subscription.status === "canceled"
  const [tier, setTier] = useState<SubscriptionTier>(
    subscription.tier === "free" ? "pro" : subscription.tier,
  )
  const [note, setNote] = useState("")

  const previewMrr = useMemo(() => computeMrr(tier), [tier])
  const tierChanged = tier !== subscription.tier

  function close() {
    onOpenChange(false)
    setNote("")
    setTier(subscription.tier === "free" ? "pro" : subscription.tier)
  }

  function grantOrChange() {
    const now = new Date().toISOString()
    const isGrant = isRevoked || subscription.tier === "free"
    onApply(subscription.id, {
      status: "active",
      tier,
      mrr: computeMrr(tier),
      seats: TIER_SEATS[tier],
      event: {
        type: isGrant ? (isRevoked ? "reactivated" : "granted") : "tier_changed",
        fromTier: subscription.tier,
        toTier: tier,
        actor,
        note: note.trim() || undefined,
        createdAt: now,
      },
    })
    close()
  }

  function revoke() {
    const now = new Date().toISOString()
    onApply(subscription.id, {
      status: "canceled",
      tier: subscription.tier,
      mrr: 0,
      seats: subscription.seats,
      event: {
        type: "revoked",
        fromTier: subscription.tier,
        actor,
        note: note.trim() || undefined,
        createdAt: now,
      },
    })
    close()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(true) : close())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage subscription</DialogTitle>
          <DialogDescription>
            {subscription.user} · {subscription.email}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-1">
          <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/40 px-3 py-2.5">
            <div>
              <p className="text-xs text-muted-foreground">Current plan</p>
              <p className="text-sm font-medium text-foreground">{TIER_LABEL[subscription.tier]}</p>
            </div>
            <StatusPill status={subscription.status} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tier-select">{isRevoked ? "Reactivate with plan" : "Assign plan"}</Label>
            <Select value={tier} onValueChange={(v) => setTier(v as SubscriptionTier)}>
              <SelectTrigger id="tier-select" className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAID_TIERS.map((t) => (
                  <SelectItem key={t} value={t}>
                    {TIER_LABEL[t]} — {formatCurrency(computeMrr(t))}/mo · {TIER_SEATS[t]} seat
                    {TIER_SEATS[t] > 1 ? "s" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              New MRR <span className="font-medium tabular-nums text-foreground">{formatCurrency(previewMrr)}</span>
              {tierChanged && (
                <>
                  {" "}
                  · changed from {TIER_LABEL[subscription.tier]}
                </>
              )}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Note <span className="text-muted-foreground">(optional)</span></Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Reason for this change (recorded in history)"
              className="min-h-[64px] resize-none text-sm"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          {!isRevoked && subscription.tier !== "free" ? (
            <Button
              variant="ghost"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
              disabled={!canRevoke}
              onClick={revoke}
              title={canRevoke ? undefined : "Superadmin role required to revoke"}
            >
              <Ban className="size-4" />
              Revoke
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={close}>
              Cancel
            </Button>
            <Button onClick={grantOrChange}>
              {isRevoked ? "Reactivate" : subscription.tier === "free" ? "Grant" : "Save changes"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function HistoryDialog({
  open,
  onOpenChange,
  subscription,
  events,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  subscription: Subscription
  events: SubscriptionEvent[]
}) {
  const sorted = useMemo(
    () => [...events].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [events],
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Subscription history</DialogTitle>
          <DialogDescription>
            {subscription.user} · {subscription.email}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto overscroll-contain pr-1">
          {sorted.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No history recorded.</p>
          ) : (
            <ol className="relative space-y-0">
              {sorted.map((evt, idx) => {
                const meta = EVENT_META[evt.type]
                const Icon = meta.icon
                const isLast = idx === sorted.length - 1
                return (
                  <li key={evt.id} className="relative flex gap-3 pb-5">
                    {!isLast && <span className="absolute left-[15px] top-8 h-full w-px bg-border" aria-hidden />}
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-secondary/60 text-foreground">
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1 pt-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="text-sm font-medium text-foreground">{meta.label}</p>
                        <time className="shrink-0 text-xs text-muted-foreground" title={formatDateTime(evt.createdAt)}>
                          {relativeTime(evt.createdAt)}
                        </time>
                      </div>
                      {(evt.fromTier || evt.toTier) && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {evt.fromTier ? TIER_LABEL[evt.fromTier] : "—"}
                          {evt.toTier && (
                            <>
                              {" "}
                              <ArrowRight className="inline size-3 -translate-y-px" /> {TIER_LABEL[evt.toTier]}
                            </>
                          )}
                        </p>
                      )}
                      {evt.note && <p className="mt-1 text-xs text-foreground/80">{evt.note}</p>}
                      <p className="mt-1 font-mono text-[11px] text-muted-foreground">by {evt.actor}</p>
                    </div>
                  </li>
                )
              })}
            </ol>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
