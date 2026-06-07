"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { PageHeader } from "@/components/admin/page-header"
import { StatCard } from "@/components/admin/stat-card"
import { StatusPill } from "@/components/admin/status-pill"
import { DataTable, DataTableCard, TableToolbar } from "@/components/admin/data-table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { LineTrend } from "@/components/admin/charts"
import { AiUsageRowActions } from "@/components/admin/ai-usage-manager"
import { aiUsage, latencySeries, modelUsage, requestVolumeSeries } from "@/lib/admin-dashboard/mock-data"
import { formatCompact, formatCurrency, formatNumber, relativeTime } from "@/lib/admin-dashboard/format"
import type { AiUsageRecord } from "@/lib/admin-dashboard/types"

const RANGE_FACTOR: Record<string, number> = { "7d": 0.25, "30d": 1, "90d": 2.9 }
const RANGE_LABEL: Record<string, string> = { "7d": "Last 7 days", "30d": "Last 30 days", "90d": "Last 90 days" }

function toCsv(rows: AiUsageRecord[]): string {
  const header = ["id", "user", "model", "type", "tokens", "latencyMs", "cost", "status", "createdAt"]
  const body = rows.map((r) =>
    [r.id, r.user, r.model, r.type, r.tokens, r.latencyMs, r.cost, r.status, r.createdAt]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(","),
  )
  return [header.join(","), ...body].join("\n")
}

export default function AiUsagePage() {
  const [range, setRange] = useState("30d")
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

  const factor = RANGE_FACTOR[range] ?? 1
  const totalTokens = aiUsage.reduce((a, r) => a + r.tokens, 0)
  const totalCost = aiUsage.reduce((a, r) => a + r.cost, 0)
  const errors = aiUsage.filter((r) => r.status === "error").length
  const totalReq = Math.round(requestVolumeSeries.reduce((a, p) => a + p.value, 0) * factor)

  function exportCsv() {
    const csv = toCsv(filtered)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `ai-usage-${range}-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success(`Exported ${filtered.length} rows`)
  }

  return (
    <>
      <PageHeader title="AI Usage" description="Model requests, token consumption, latency, and spend across the platform.">
        <Select value={range} onValueChange={setRange}>
          <SelectTrigger size="sm" className="w-auto min-w-[8.5rem] text-sm" aria-label="Date range">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(RANGE_LABEL).map(([v, label]) => (
              <SelectItem key={v} value={v}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" onClick={exportCsv}>
          Export CSV
        </Button>
      </PageHeader>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={`Requests (${range})`} value={formatCompact(totalReq)} delta={12.8} />
        <StatCard label="Tokens (sample)" value={formatCompact(totalTokens)} />
        <StatCard label="Spend (sample)" value={formatCurrency(totalCost)} />
        <StatCard label="Errors" value={formatNumber(errors)} invertDelta delta={-0.3} />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Latency</CardTitle>
            <CardDescription>Average response latency (ms) over {RANGE_LABEL[range].toLowerCase()}</CardDescription>
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
              {
                key: "actions",
                header: "",
                className: "w-10 text-right",
                cell: (r) => <AiUsageRowActions record={r} onCopy={(_id, msg) => toast.success(msg)} />,
              },
            ]}
          />
        </DataTableCard>

        <p className="text-xs text-muted-foreground">
          Showing {filtered.length} of {aiUsage.length} requests
        </p>
      </div>
    </>
  )
}
