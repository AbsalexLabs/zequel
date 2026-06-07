"use client"

import { useMemo, useState } from "react"
import { PageHeader } from "@/components/admin/page-header"
import { StatCard } from "@/components/admin/stat-card"
import { StatusPill } from "@/components/admin/status-pill"
import { DataTable, DataTableCard, TableToolbar } from "@/components/admin/data-table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { LineTrend } from "@/components/admin/charts"
import { aiUsage, latencySeries, modelUsage, requestVolumeSeries } from "@/lib/admin-dashboard/mock-data"
import { formatCompact, formatCurrency, formatNumber, relativeTime } from "@/lib/admin-dashboard/format"
import type { AiUsageRecord } from "@/lib/admin-dashboard/types"

export default function AiUsagePage() {
  const [search, setSearch] = useState("")
  const [model, setModel] = useState("all")
  const [status, setStatus] = useState("all")

  const filtered = useMemo(() => {
    return aiUsage.filter((r) => {
      const q = search.trim().toLowerCase()
      const matchesSearch = !q || r.user.toLowerCase().includes(q) || r.model.toLowerCase().includes(q)
      const matchesModel = model === "all" || r.model === model
      const matchesStatus = status === "all" || r.status === status
      return matchesSearch && matchesModel && matchesStatus
    })
  }, [search, model, status])

  const totalTokens = aiUsage.reduce((a, r) => a + r.tokens, 0)
  const totalCost = aiUsage.reduce((a, r) => a + r.cost, 0)
  const errors = aiUsage.filter((r) => r.status === "error").length
  const totalReq = requestVolumeSeries.reduce((a, p) => a + p.value, 0)

  return (
    <>
      <PageHeader title="AI Usage" description="Model requests, token consumption, latency, and spend across the platform." />

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Requests (30d)" value={formatCompact(totalReq)} delta={12.8} />
        <StatCard label="Tokens (sample)" value={formatCompact(totalTokens)} />
        <StatCard label="Spend (sample)" value={formatCurrency(totalCost)} />
        <StatCard label="Errors" value={formatNumber(errors)} invertDelta delta={-0.3} />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Latency</CardTitle>
            <CardDescription>Average response latency (ms) over 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <LineTrend data={latencySeries} label="Latency (ms)" className="aspect-[16/6] w-full" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Model Share</CardTitle>
            <CardDescription>Requests by model</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {modelUsage.map((m) => (
              <div key={m.model} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-mono text-xs text-foreground">{m.model}</span>
                  <span className="tabular-nums text-muted-foreground">{m.share}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-foreground" style={{ width: `${m.share}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <div className="space-y-4">
        <TableToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search requests..."
          filters={[
            {
              id: "model",
              label: "Model",
              value: model,
              onChange: setModel,
              options: [
                { label: "All models", value: "all" },
                ...modelUsage.map((m) => ({ label: m.model, value: m.model })),
              ],
            },
            {
              id: "status",
              label: "Status",
              value: status,
              onChange: setStatus,
              options: [
                { label: "All status", value: "all" },
                { label: "Success", value: "success" },
                { label: "Error", value: "error" },
                { label: "Throttled", value: "throttled" },
              ],
            },
          ]}
        />

        <DataTableCard>
          <DataTable<AiUsageRecord>
            rows={filtered}
            rowKey={(r) => r.id}
            columns={[
              {
                key: "user",
                header: "User",
                cell: (r) => <span className="text-sm font-medium text-foreground">{r.user}</span>,
              },
              {
                key: "model",
                header: "Model",
                cell: (r) => <span className="font-mono text-xs text-foreground">{r.model}</span>,
              },
              {
                key: "type",
                header: "Type",
                cell: (r) => <span className="text-sm capitalize text-muted-foreground">{r.type}</span>,
              },
              {
                key: "tokens",
                header: "Tokens",
                className: "text-right",
                cell: (r) => <span className="tabular-nums text-foreground">{formatNumber(r.tokens)}</span>,
              },
              {
                key: "latency",
                header: "Latency",
                className: "text-right",
                cell: (r) => <span className="tabular-nums text-muted-foreground">{r.latencyMs}ms</span>,
              },
              {
                key: "cost",
                header: "Cost",
                className: "text-right",
                cell: (r) => <span className="tabular-nums text-foreground">{formatCurrency(r.cost)}</span>,
              },
              { key: "status", header: "Status", cell: (r) => <StatusPill status={r.status} /> },
              {
                key: "time",
                header: "Time",
                cell: (r) => <span className="text-sm text-muted-foreground">{relativeTime(r.createdAt)}</span>,
              },
            ]}
          />
        </DataTableCard>
      </div>
    </>
  )
}
