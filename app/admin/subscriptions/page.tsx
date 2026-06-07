"use client"

import { useMemo, useState } from "react"
import { PageHeader } from "@/components/admin/page-header"
import { StatCard } from "@/components/admin/stat-card"
import { StatusPill } from "@/components/admin/status-pill"
import { DataTable, DataTableCard, TableToolbar } from "@/components/admin/data-table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AreaTrend } from "@/components/admin/charts"
import { subscriptions, revenueSeries } from "@/lib/admin-dashboard/mock-data"
import { formatCurrency, formatDate, formatNumber } from "@/lib/admin-dashboard/format"
import type { Subscription } from "@/lib/admin-dashboard/types"

const TIER_LABEL: Record<string, string> = { pro: "Pro", team: "Team", enterprise: "Enterprise" }

export default function SubscriptionsPage() {
  const [search, setSearch] = useState("")
  const [tier, setTier] = useState("all")
  const [status, setStatus] = useState("all")

  const filtered = useMemo(() => {
    return subscriptions.filter((sub) => {
      const q = search.trim().toLowerCase()
      const matchesSearch = !q || sub.user.toLowerCase().includes(q) || sub.email.toLowerCase().includes(q)
      const matchesTier = tier === "all" || sub.tier === tier
      const matchesStatus = status === "all" || sub.status === status
      return matchesSearch && matchesTier && matchesStatus
    })
  }, [search, tier, status])

  const mrr = subscriptions.filter((s) => s.status === "active").reduce((a, s) => a + s.mrr, 0)
  const activeSubs = subscriptions.filter((s) => s.status === "active").length
  const pastDue = subscriptions.filter((s) => s.status === "past_due").length
  const trialing = subscriptions.filter((s) => s.status === "trialing").length

  return (
    <>
      <PageHeader title="Subscriptions" description="Plans, billing status, seats, and recurring revenue.">
        <Button variant="outline" size="sm">
          Export CSV
        </Button>
      </PageHeader>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="MRR" value={formatCurrency(mrr)} delta={4.9} />
        <StatCard label="Active Plans" value={formatNumber(activeSubs)} />
        <StatCard label="Trialing" value={formatNumber(trialing)} />
        <StatCard label="Past Due" value={formatNumber(pastDue)} invertDelta delta={-2.1} />
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revenue Trend</CardTitle>
          <CardDescription>Daily recurring revenue over the last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <AreaTrend data={revenueSeries} label="Revenue" className="aspect-[16/5] w-full" />
        </CardContent>
      </Card>

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
                { label: "Pro", value: "pro" },
                { label: "Team", value: "team" },
                { label: "Enterprise", value: "enterprise" },
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
                key: "seats",
                header: "Seats",
                className: "text-right",
                cell: (s) => <span className="tabular-nums text-foreground">{s.seats}</span>,
              },
              {
                key: "mrr",
                header: "MRR",
                className: "text-right",
                cell: (s) => (
                  <span className="font-medium tabular-nums text-foreground">{formatCurrency(s.mrr)}</span>
                ),
              },
              {
                key: "renews",
                header: "Renews",
                cell: (s) => <span className="text-sm text-muted-foreground">{formatDate(s.renewsAt)}</span>,
              },
            ]}
          />
        </DataTableCard>

        <p className="text-xs text-muted-foreground">
          Showing {filtered.length} of {subscriptions.length} subscriptions
        </p>
      </div>
    </>
  )
}
