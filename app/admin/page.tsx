import { Users, Activity, Cpu, DollarSign, FileText, ShieldAlert, Gauge, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { PageHeader } from "@/components/admin/page-header"
import { StatCard } from "@/components/admin/stat-card"
import { ActivityFeed } from "@/components/admin/activity-feed"
import { AreaTrend, DonutBreakdown } from "@/components/admin/charts"
import { Button } from "@/components/ui/button"
import {
  overviewStats as s,
  requestVolumeSeries,
  tierBreakdown,
  activityFeed,
  modelUsage,
} from "@/lib/admin-dashboard/mock-data"
import { formatCompact, formatCurrency, formatNumber } from "@/lib/admin-dashboard/format"

export default function OverviewPage() {
  return (
    <>
      <PageHeader
        title="Control Center"
        description="Real-time operational view of the Zequel research platform — usage, revenue, and system health."
      >
        <Button variant="outline" size="sm">
          Last 30 days
        </Button>
        <Button size="sm">Export report</Button>
      </PageHeader>

      {/* Primary stats */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Users"
          value={formatNumber(s.totalUsers)}
          delta={s.totalUsersDelta}
          icon={<Users className="size-4" />}
        />
        <StatCard
          label="Active Users"
          value={formatNumber(s.activeUsers)}
          delta={s.activeUsersDelta}
          icon={<Activity className="size-4" />}
        />
        <StatCard
          label="AI Requests"
          value={formatCompact(s.aiRequests)}
          delta={s.aiRequestsDelta}
          icon={<Cpu className="size-4" />}
        />
        <StatCard
          label="Monthly Revenue"
          value={formatCurrency(s.mrr, { compact: true })}
          delta={s.mrrDelta}
          icon={<DollarSign className="size-4" />}
        />
      </section>

      {/* Secondary stats */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Documents Indexed"
          value={formatNumber(s.documentsIndexed)}
          delta={s.documentsDelta}
          icon={<FileText className="size-4" />}
        />
        <StatCard
          label="Safety Flags"
          value={formatNumber(s.safetyFlags)}
          delta={s.safetyFlagsDelta}
          invertDelta
          icon={<ShieldAlert className="size-4" />}
        />
        <StatCard
          label="Avg Latency"
          value={`${s.avgLatencyMs}ms`}
          delta={s.avgLatencyDelta}
          invertDelta
          icon={<Gauge className="size-4" />}
        />
        <StatCard
          label="Error Rate"
          value={`${s.errorRate}%`}
          delta={s.errorRateDelta}
          invertDelta
          icon={<AlertTriangle className="size-4" />}
        />
      </section>

      {/* Charts */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Request Volume</CardTitle>
            <CardDescription>Daily AI requests across all models</CardDescription>
          </CardHeader>
          <CardContent>
            <AreaTrend data={requestVolumeSeries} label="Requests" className="aspect-[16/7] w-full" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Users by Tier</CardTitle>
            <CardDescription>Distribution across plans</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <DonutBreakdown data={tierBreakdown} className="mx-auto aspect-square max-h-[180px]" />
            <ul className="space-y-2">
              {tierBreakdown.map((t) => (
                <li key={t.tier} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="size-2.5 rounded-sm" style={{ background: t.fill }} aria-hidden />
                    <span className="text-muted-foreground">{t.tier}</span>
                  </span>
                  <span className="font-medium tabular-nums text-foreground">{formatNumber(t.users)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* Model usage + activity */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Model Usage</CardTitle>
            <CardDescription>Request share by model over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {modelUsage.map((m) => (
              <div key={m.model} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-mono text-foreground">{m.model}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {formatCompact(m.requests)} · {m.share}%
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-foreground" style={{ width: `${m.share}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <ActivityFeed items={activityFeed} />
      </section>
    </>
  )
}
