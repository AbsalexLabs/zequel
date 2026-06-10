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
} from "@zequel/ui/components/dialog"
import { Button } from "@zequel/ui/components/button"
import { Label } from "@zequel/ui/components/label"
import { Textarea } from "@zequel/ui/components/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@zequel/ui/components/select"
import { StatusPill } from "@/components/admin/status-pill"
import { formatCurrency, formatDateTime, relativeTime } from "@/lib/admin-dashboard/format"
import type {
  Subscription,
  SubscriptionEvent,
  SubscriptionEventType,
  SubscriptionTier,
} from "@/lib/admin-dashboard/types"

const ASSIGNABLE_TIERS: SubscriptionTier[] = ["free", "premium_lite", "premium_pro"]
const TIER_LABEL: Record<SubscriptionTier, string> = {
  free: "Free",
  premium_lite: "Premium Lite",
  premium_pro: "Premium Pro",
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
  event: Omit<SubscriptionEvent, "id" | "subscriptionId">
}

export function SubscriptionRowActions({
  subscription,
  events,
  canRevoke,
  actor,
  prices,
  onApply,
}: {
  subscription: Subscription
  events: SubscriptionEvent[]
  canRevoke: boolean
  actor: string
  prices: Record<SubscriptionTier, number>
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
        prices={prices}
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
  prices,
  onApply,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  subscription: Subscription
  canRevoke: boolean
  actor: string
  prices: Record<SubscriptionTier, number>
  onApply: (subId: string, result: ManageResult) => void
}) {
  const isRevoked = subscription.status === "canceled"
  const [tier, setTier] = useState<SubscriptionTier>(
    isRevoked && subscription.tier === "free" ? "premium_lite" : subscription.tier,
  )
  const [note, setNote] = useState("")

  const previewPrice = useMemo(() => prices[tier] ?? 0, [tier, prices])
  const tierChanged = tier !== subscription.tier

  function close() {
    onOpenChange(false)
    setNote("")
    setTier(isRevoked && subscription.tier === "free" ? "premium_lite" : subscription.tier)
  }

  function grantOrChange() {
    const now = new Date().toISOString()
    // Reactivating a canceled plan, or moving a free user onto a paid plan, is a
    // grant. Moving between paid plans (or down to free) is a tier change.
    const isGrant = isRevoked || (subscription.tier === "free" && tier !== "free")
    onApply(subscription.id, {
      status: "active",
      tier,
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
                {ASSIGNABLE_TIERS.map((t) => (
                  <SelectItem key={t} value={t}>
                    {TIER_LABEL[t]} — {formatCurrency(prices[t] ?? 0)}/mo
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              New price <span className="font-medium tabular-nums text-foreground">{formatCurrency(previewPrice)}</span>/mo
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
            <Button onClick={grantOrChange} disabled={!isRevoked && !tierChanged}>
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
