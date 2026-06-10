"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { PageHeader } from "@/components/admin/page-header"
import { StatCard } from "@/components/admin/stat-card"
import { StatusPill } from "@/components/admin/status-pill"
import { DataTable, DataTableCard, TableToolbar } from "@/components/admin/data-table"
import { SubscriptionRowActions, type ManageResult } from "@/components/admin/subscription-manager"
import { useAdminSession } from "@/components/admin/admin-session"
import { useSubscriptions, usePlanConfigs, patchSubscriptionPlan } from "@/lib/admin-dashboard/api"
import { formatCurrency, formatDate, formatNumber } from "@/lib/admin-dashboard/format"
import { TIER_LABELS } from "@/lib/admin-dashboard/types"
import type { Subscription, SubscriptionEvent, SubscriptionTier } from "@/lib/admin-dashboard/types"

const TIER_LABEL = TIER_LABELS

export default function SubscriptionsPage() {
  const { session } = useAdminSession()
  const canRevoke = session.role === "superadmin"

  const [search, setSearch] = useState("")
  const [tier, setTier] = useState("all")
  const [status, setStatus] = useState("all")

  const { subscriptions: subs, isLoading, error, mutate } = useSubscriptions({ plan: tier })
  const { plans } = usePlanConfigs()
  // Event history is recorded server-side via the audit log; per-row history
  // starts empty in this view and is populated by live admin actions.
  const [events, setEvents] = useState<SubscriptionEvent[]>([])

  // Monthly price per tier, sourced from the live, admin-editable plan configs.
  const prices = useMemo<Record<SubscriptionTier, number>>(() => {
    const base: Record<SubscriptionTier, number> = { free: 0, premium_lite: 0, premium_pro: 0 }
    for (const p of plans) base[p.plan] = p.price
    return base
  }, [plans])

  const filtered = useMemo(() => {
    return subs.filter((sub) => {
      const q = search.trim().toLowerCase()
      const matchesSearch = !q || sub.user.toLowerCase().includes(q) || sub.email.toLowerCase().includes(q)
      const matchesStatus = status === "all" || sub.status === status
      return matchesSearch && matchesStatus
    })
  }, [subs, search, status])

  const mrr = subs.filter((s) => s.status === "active").reduce((a, s) => a + (prices[s.tier] ?? 0), 0)
  const activeSubs = subs.filter((s) => s.status === "active").length
  const pastDue = subs.filter((s) => s.status === "past_due").length
  const trialing = subs.filter((s) => s.status === "trialing").length

  async function applyChange(subId: string, result: ManageResult) {
    const sub = subs.find((s) => s.id === subId)
    if (!sub) return
    try {
      // Revoke maps to downgrading the plan to free; otherwise apply the new tier.
      // patchSubscriptionPlan targets the user id (subscriptions.user_id), not
      // the subscription row id.
      await patchSubscriptionPlan(sub.userId, result.status === "canceled" ? "free" : result.tier)
      setEvents((prev) => [
        { ...result.event, id: `subevt_${subId}_${Date.now()}`, subscriptionId: subId },
        ...prev,
      ])
      await mutate()
      toast.success("Subscription updated")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed")
    }
  }

  return (
    <>
      <PageHeader title="Subscriptions" description="Grant, change, or revoke plans and review billing history." />

      {error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Failed to load subscriptions: {error.message}
        </p>
      )}

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="MRR" value={formatCurrency(mrr)} />
        <StatCard label="Active Plans" value={formatNumber(activeSubs)} />
        <StatCard label="Trialing" value={formatNumber(trialing)} />
        <StatCard label="Past Due" value={formatNumber(pastDue)} />
      </section>

      <div className="space-y-4">
        <TableToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search subscribers..."
          filters={[
            {
              id: "tier",
              label: "Tier",
              value: tier,
              onChange: setTier,
              options: [
                { label: "All tiers", value: "all" },
                { label: "Premium Lite", value: "premium_lite" },
                { label: "Premium Pro", value: "premium_pro" },
              ],
            },
            {
              id: "status",
              label: "Status",
              value: status,
              onChange: setStatus,
              options: [
                { label: "All status", value: "all" },
                { label: "Active", value: "active" },
                { label: "Trialing", value: "trialing" },
                { label: "Past Due", value: "past_due" },
                { label: "Canceled", value: "canceled" },
              ],
            },
          ]}
        />

        <DataTableCard>
          <DataTable<Subscription>
            rows={filtered}
            rowKey={(s) => s.id}
            columns={[
              {
                key: "user",
                header: "Subscriber",
                cell: (s) => (
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{s.user}</p>
                    <p className="truncate text-xs text-muted-foreground">{s.email}</p>
                  </div>
                ),
              },
              {
                key: "tier",
                header: "Plan",
                cell: (s) => <span className="text-sm text-foreground">{TIER_LABEL[s.tier]}</span>,
              },
              { key: "status", header: "Status", cell: (s) => <StatusPill status={s.status} /> },
              {
                key: "mrr",
                header: "MRR",
                className: "text-right",
                cell: (s) => (
                  <span className="font-medium tabular-nums text-foreground">
                    {formatCurrency(prices[s.tier] ?? 0)}
                  </span>
                ),
              },
              {
                key: "renews",
                header: "Renews",
                cell: (s) => <span className="text-sm text-muted-foreground">{formatDate(s.renewsAt)}</span>,
              },
              {
                key: "actions",
                header: "",
                className: "text-right",
                cell: (s) => (
                  <SubscriptionRowActions
                    subscription={s}
                    events={events.filter((e) => e.subscriptionId === s.id)}
                    canRevoke={canRevoke}
                    actor={session.name}
                    prices={prices}
                    onApply={applyChange}
                  />
                ),
              },
            ]}
          />
        </DataTableCard>

        <p className="text-xs text-muted-foreground">
          {isLoading ? "Loading subscriptions…" : `Showing ${filtered.length} of ${subs.length} subscriptions`}
        </p>
      </div>
    </>
  )
}
