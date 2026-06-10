"use client"

import { Users, Activity, Cpu, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@zequel/ui/components/card"
import { PageHeader } from "@/components/admin/page-header"
import { StatCard } from "@/components/admin/stat-card"
import { ActivityFeed } from "@/components/admin/activity-feed"
import { DonutBreakdown } from "@/components/admin/charts"
import { OverviewActions } from "@/components/admin/overview-actions"
import { useStats, useAuditLog } from "@/lib/admin-dashboard/api"
import { useAdminSession } from "@/components/admin/admin-session"
import { TIER_LABELS, type SubscriptionTier } from "@/lib/admin-dashboard/types"
import { formatCompact, formatNumber } from "@/lib/admin-dashboard/format"

const TIER_FILL: Record<SubscriptionTier, string> = {
  free: "var(--confidence-low)",
  premium_lite: "var(--confidence-medium)",
  premium_pro: "var(--primary)",
}

export default function OverviewPage() {
  const { session } = useAdminSession()
  const { stats, isLoading, error } = useStats()
  // The audit log feed is superadmin-only; gate the request so admins don't 403.
  const { entries } = useAuditLog(session.role === "superadmin" ? { limit: 8 } : {})

  const tierBreakdown = (Object.keys(TIER_LABELS) as SubscriptionTier[]).map((tier) => ({
    tier: TIER_LABELS[tier],
    users: stats?.subscriptions?.[tier] ?? 0,
    fill: TIER_FILL[tier],
  }))

  const activityItems = entries.map((e) => ({
    id: e.id,
    actor: e.actor,
    action: `${e.action} · ${e.target}`,
    time: e.createdAt,
  }))

  return (
    <>
      <PageHeader
        title="Control Center"
        description="Real-time operational view of the Zequel research platform — usage and system health."
      >
        <OverviewActions />
      </PageHeader>

      {error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Failed to load metrics: {error.message}
        </p>
      )}

      {/* Primary stats */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Users"
          value={isLoading ? "—" : formatNumber(stats?.totalUsers ?? 0)}
          icon={<Users className="size-4" />}
        />
        <StatCard
          label="Active Today"
          value={isLoading ? "—" : formatNumber(stats?.activeUsersToday ?? 0)}
          icon={<Activity className="size-4" />}
        />
        <StatCard
          label="AI Requests"
          value={isLoading ? "—" : formatCompact(stats?.totalRequests ?? 0)}
          hint={`${formatNumber(stats?.requestsToday ?? 0)} today`}
          icon={<Cpu className="size-4" />}
        />
        <StatCard
          label="Errors Today"
          value={isLoading ? "—" : formatNumber(stats?.errorsToday ?? 0)}
          icon={<AlertTriangle className="size-4" />}
        />
      </section>

      {/* Tier breakdown + activity */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
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

        <div className="lg:col-span-2">
          {session.role === "superadmin" ? (
            <ActivityFeed items={activityItems} />
          ) : (
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-base">Recent Activity</CardTitle>
                <CardDescription>Audit activity is visible to superadmins only.</CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>
      </section>
    </>
  )
}
