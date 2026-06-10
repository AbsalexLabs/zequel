"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { PageHeader } from "@/components/admin/page-header"
import { StatCard } from "@/components/admin/stat-card"
import { StatusPill, SeverityPill } from "@/components/admin/status-pill"
import { DataTable, DataTableCard, TableToolbar } from "@/components/admin/data-table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@zequel/ui/components/card"
import { SafetyRowActions, type SafetyPatch } from "@/components/admin/safety-manager"
import { useSafetyEvents, updateSafetyAction } from "@/lib/admin-dashboard/api"
import { formatNumber, relativeTime } from "@/lib/admin-dashboard/format"
import type { SafetyEvent } from "@/lib/admin-dashboard/types"

const CATEGORY_LABEL: Record<string, string> = {
  harmful: "Harmful content",
  pii: "PII exposure",
  jailbreak: "Jailbreak attempt",
  spam: "Spam / abuse",
  abuse: "Harassment",
}

export default function SafetyPage() {
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("all")
  const [severity, setSeverity] = useState("all")

  const { events: rows, isLoading, error, mutate } = useSafetyEvents({ limit: 300 })

  const filtered = useMemo(() => {
    return rows.filter((e) => {
      const q = search.trim().toLowerCase()
      const matchesSearch = !q || e.user.toLowerCase().includes(q) || e.detail.toLowerCase().includes(q)
      const matchesCategory = category === "all" || e.category === category
      const matchesSeverity = severity === "all" || e.severity === severity
      return matchesSearch && matchesCategory && matchesSeverity
    })
  }, [rows, search, category, severity])

  const critical = rows.filter((e) => e.severity === "critical").length
  const blocked = rows.filter((e) => e.action === "blocked").length
  const pendingReview = rows.filter((e) => e.action === "flagged").length

  const byCategory = Object.entries(
    rows.reduce<Record<string, number>>((acc, e) => {
      acc[e.category] = (acc[e.category] ?? 0) + 1
      return acc
    }, {}),
  ).sort((a, b) => b[1] - a[1])

  async function patchEvent(id: string, patch: SafetyPatch, message: string) {
    if (!patch.action) return
    try {
      await updateSafetyAction(id, patch.action)
      await mutate()
      toast.success(message)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed")
    }
  }

  return (
    <>
      <PageHeader
        title="Safety Center"
        description="Moderation signals, risk events, and policy enforcement across the platform."
      />

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Events" value={formatNumber(rows.length)} hint="in view" />
        <StatCard label="Critical" value={formatNumber(critical)} />
        <StatCard label="Blocked" value={formatNumber(blocked)} />
        <StatCard label="Pending Review" value={formatNumber(pendingReview)} />
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Events by Category</CardTitle>
          <CardDescription>Distribution of detected risk signals</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
          {byCategory.map(([cat, count]) => {
            const pct = rows.length ? Math.round((count / rows.length) * 100) : 0
            return (
              <div key={cat} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{CATEGORY_LABEL[cat] ?? cat}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {count} · {pct}%
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-foreground" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      <div className="space-y-4">
        {error && (
          <p className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Failed to load safety events: {error.message}
          </p>
        )}
        <TableToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search events..."
          filters={[
            {
              id: "category",
              label: "Category",
              value: category,
              onChange: setCategory,
              options: [
                { label: "All categories", value: "all" },
                { label: "Harmful", value: "harmful" },
                { label: "PII", value: "pii" },
                { label: "Jailbreak", value: "jailbreak" },
                { label: "Spam", value: "spam" },
                { label: "Abuse", value: "abuse" },
              ],
            },
            {
              id: "severity",
              label: "Severity",
              value: severity,
              onChange: setSeverity,
              options: [
                { label: "All severity", value: "all" },
                { label: "Low", value: "low" },
                { label: "Medium", value: "medium" },
                { label: "High", value: "high" },
                { label: "Critical", value: "critical" },
              ],
            },
          ]}
        />

        <DataTableCard>
          <DataTable<SafetyEvent>
            rows={filtered}
            rowKey={(e) => e.id}
            columns={[
              {
                key: "category",
                header: "Category",
                cell: (e) => <span className="text-sm font-medium text-foreground">{CATEGORY_LABEL[e.category]}</span>,
              },
              {
                key: "detail",
                header: "Detail",
                className: "max-w-sm",
                cell: (e) => <span className="text-sm text-muted-foreground">{e.detail}</span>,
              },
              {
                key: "user",
                header: "User",
                cell: (e) => <span className="text-sm text-foreground">{e.user}</span>,
              },
              { key: "severity", header: "Severity", cell: (e) => <SeverityPill severity={e.severity} /> },
              { key: "action", header: "Action", cell: (e) => <StatusPill status={e.action} /> },
              {
                key: "time",
                header: "Detected",
                cell: (e) => <span className="text-sm text-muted-foreground">{relativeTime(e.createdAt)}</span>,
              },
              {
                key: "actions",
                header: "",
                className: "w-10 text-right",
                cell: (e) => <SafetyRowActions event={e} onPatch={patchEvent} />,
              },
            ]}
          />
        </DataTableCard>

        <p className="text-xs text-muted-foreground">
          {isLoading ? "Loading safety events…" : `Showing ${filtered.length} of ${rows.length} events`}
        </p>
      </div>
    </>
  )
}
