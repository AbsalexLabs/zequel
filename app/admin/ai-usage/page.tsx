"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { PageHeader } from "@/components/admin/page-header"
import { StatCard } from "@/components/admin/stat-card"
import { StatusPill } from "@/components/admin/status-pill"
import { DataTable, DataTableCard, TableToolbar } from "@/components/admin/data-table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AiUsageRowActions } from "@/components/admin/ai-usage-manager"
import { useAiUsage } from "@/lib/admin-dashboard/api"
import { formatCompact, formatCurrency, formatNumber, relativeTime } from "@/lib/admin-dashboard/format"
import type { AiUsageRecord } from "@/lib/admin-dashboard/types"

function toCsv(rows: AiUsageRecord[]): string {
  const header = ["id", "user", "model", "type", "tokens", "cost", "status", "createdAt"]
  const body = rows.map((r) =>
    [r.id, r.user, r.model, r.type, r.tokens, r.cost, r.status, r.createdAt]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(","),
  )
  return [header.join(","), ...body].join("\n")
}

export default function AiUsagePage() {
  const [search, setSearch] = useState("")
  const [model, setModel] = useState("all")
  const [status, setStatus] = useState("all")

  const { logs, total, totalTokens, isLoading, error } = useAiUsage({ status })

  // Derive the model list and per-model share from the live logs.
  const modelShare = useMemo(() => {
    const counts = new Map<string, number>()
    for (const r of logs) counts.set(r.model, (counts.get(r.model) || 0) + 1)
    const totalReq = logs.length || 1
    return Array.from(counts.entries())
      .map(([m, c]) => ({ model: m, requests: c, share: Math.round((c / totalReq) * 1000) / 10 }))
      .sort((a, b) => b.requests - a.requests)
  }, [logs])

  const filtered = useMemo(() => {
    return logs.filter((r) => {
      const q = search.trim().toLowerCase()
      const matchesSearch = !q || r.user.toLowerCase().includes(q) || r.model.toLowerCase().includes(q)
      const matchesModel = model === "all" || r.model === model
      return matchesSearch && matchesModel
    })
  }, [logs, search, model])

  const totalCost = logs.reduce((a, r) => a + r.cost, 0)
  const errors = logs.filter((r) => r.status === "error").length

  function exportCsv() {
    const csv = toCsv(filtered)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `ai-usage-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success(`Exported ${filtered.length} rows`)
  }

  return (
    <>
      <PageHeader title="AI Usage" description="Model requests, token consumption, and spend across the platform.">
        <Button size="sm" onClick={exportCsv}>
          Export CSV
        </Button>
      </PageHeader>

      {error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Failed to load AI usage: {error.message}
        </p>
      )}

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Requests" value={isLoading ? "—" : formatCompact(total)} />
        <StatCard label="Tokens (sample)" value={formatCompact(totalTokens)} />
        <StatCard label="Spend (sample)" value={formatCurrency(totalCost)} />
        <StatCard label="Errors" value={formatNumber(errors)} />
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Model Share</CardTitle>
          <CardDescription>Requests by model in the current sample</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {modelShare.length === 0 ? (
            <p className="text-sm text-muted-foreground">No usage recorded yet.</p>
          ) : (
            modelShare.map((m) => (
              <div key={m.model} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-mono text-xs text-foreground">{m.model}</span>
                  <span className="tabular-nums text-muted-foreground">{m.share}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-foreground" style={{ width: `${m.share}%` }} />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

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
                ...modelShare.map((m) => ({ label: m.model, value: m.model })),
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
          {isLoading ? "Loading usage…" : `Showing ${filtered.length} of ${logs.length} requests`}
        </p>
      </div>
    </>
  )
}
