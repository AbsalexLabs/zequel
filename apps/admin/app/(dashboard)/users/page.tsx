"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { PageHeader } from "@/components/admin/page-header"
import { StatCard } from "@/components/admin/stat-card"
import { StatusPill } from "@/components/admin/status-pill"
import { DataTable, DataTableCard, TableToolbar } from "@/components/admin/data-table"
import { UserDetailDialog, type UserPatch } from "@/components/admin/user-manager"
import { useAdminSession } from "@/components/admin/admin-session"
import { useUsers, patchUser as apiPatchUser } from "@/lib/admin-dashboard/api"
import { formatNumber, relativeTime } from "@/lib/admin-dashboard/format"
import { Avatar, AvatarFallback, AvatarImage } from "@zequel/ui/components/avatar"
import type { AdminUser } from "@/lib/admin-dashboard/types"

const TIER_LABEL: Record<string, string> = { free: "Free", premium_lite: "Premium Lite", premium_pro: "Premium Pro" }

export default function UsersPage() {
  const { session } = useAdminSession()
  const canManageRoles = session.role === "superadmin"

  const [search, setSearch] = useState("")
  const [tier, setTier] = useState("all")
  const [status, setStatus] = useState("all")
  const [role, setRole] = useState("all")
  const [selected, setSelected] = useState<AdminUser | null>(null)

  const { users: rows, isLoading, error, mutate } = useUsers({ search })

  const filtered = useMemo(() => {
    return rows.filter((u) => {
      const matchesTier = tier === "all" || u.tier === tier
      const matchesStatus = status === "all" || u.status === status
      const matchesRole = role === "all" || u.role === role
      return matchesTier && matchesStatus && matchesRole
    })
  }, [rows, tier, status, role])

  const activeCount = rows.filter((u) => u.status === "active").length
  const adminCount = rows.filter((u) => u.role !== "user").length
  const suspendedCount = rows.filter((u) => u.status === "suspended").length

  async function patchUser(id: string, patch: UserPatch, message: string) {
    try {
      if (patch.role) {
        await apiPatchUser(id, "update_role", { role: patch.role })
      } else if (patch.tier) {
        await apiPatchUser(id, "update_subscription", { plan: patch.tier })
      } else if (patch.status === "suspended") {
        await apiPatchUser(id, "suspend")
      } else if (patch.status === "active") {
        await apiPatchUser(id, "unsuspend")
      }
      await mutate()
      toast.success(message)
      setSelected(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed")
    }
  }

  return (
    <>
      <PageHeader title="Users" description="Manage accounts, roles, access, and platform activity." />

      {error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Failed to load users: {error.message}
        </p>
      )}

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Users" value={isLoading ? "—" : formatNumber(rows.length)} hint="in view" />
        <StatCard label="Active" value={formatNumber(activeCount)} />
        <StatCard label="Privileged" value={formatNumber(adminCount)} hint="admin + superadmin" />
        <StatCard label="Suspended" value={formatNumber(suspendedCount)} />
      </section>

      <div className="space-y-4">
        <TableToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by name or email..."
          filters={[
            {
              id: "tier",
              label: "Tier",
              value: tier,
              onChange: setTier,
              options: [
                { label: "All tiers", value: "all" },
                { label: "Free", value: "free" },
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
                { label: "Suspended", value: "suspended" },
              ],
            },
            {
              id: "role",
              label: "Role",
              value: role,
              onChange: setRole,
              options: [
                { label: "All roles", value: "all" },
                { label: "User", value: "user" },
                { label: "Admin", value: "admin" },
                { label: "Superadmin", value: "superadmin" },
              ],
            },
          ]}
        />

        <DataTableCard>
          <DataTable<AdminUser>
            rows={filtered}
            rowKey={(u) => u.id}
            columns={[
              {
                key: "name",
                header: "User",
                cell: (u) => (
                  <div className="flex items-center gap-3">
                    <Avatar className="size-8 shrink-0">
                      {u.avatarUrl ? <AvatarImage src={u.avatarUrl} alt={u.name} /> : null}
                      <AvatarFallback className="bg-secondary font-mono text-[11px] font-semibold text-foreground">
                        {u.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{u.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                ),
              },
              {
                key: "role",
                header: "Role",
                cell: (u) =>
                  u.role === "user" ? (
                    <span className="text-sm text-muted-foreground">User</span>
                  ) : (
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-foreground">
                      {u.role}
                    </span>
                  ),
              },
              {
                key: "tier",
                header: "Tier",
                cell: (u) => <span className="text-sm text-foreground">{TIER_LABEL[u.tier]}</span>,
              },
              { key: "status", header: "Status", cell: (u) => <StatusPill status={u.status} /> },
              {
                key: "requests",
                header: "AI Requests",
                className: "text-right",
                cell: (u) => <span className="tabular-nums text-foreground">{formatNumber(u.aiRequests)}</span>,
              },
              {
                key: "active",
                header: "Last Active",
                cell: (u) => <span className="text-sm text-muted-foreground">{relativeTime(u.lastActiveAt)}</span>,
              },
            ]}
            onRowClick={(u) => setSelected(u)}
          />
        </DataTableCard>

        <p className="text-xs text-muted-foreground">
          {isLoading ? "Loading users…" : `Showing ${filtered.length} of ${rows.length} users`}
        </p>
      </div>

      <UserDetailDialog
        user={selected}
        open={selected !== null}
        onOpenChange={(v) => !v && setSelected(null)}
        canManageRoles={canManageRoles}
        onPatch={patchUser}
      />
    </>
  )
}
