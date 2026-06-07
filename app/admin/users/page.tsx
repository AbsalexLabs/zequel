"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { PageHeader } from "@/components/admin/page-header"
import { StatCard } from "@/components/admin/stat-card"
import { StatusPill } from "@/components/admin/status-pill"
import { DataTable, DataTableCard, TableToolbar } from "@/components/admin/data-table"
import { Button } from "@/components/ui/button"
import { UserRowActions, InviteUserDialog, type UserPatch } from "@/components/admin/user-manager"
import { useAdminSession } from "@/components/admin/admin-session"
import { users as seedUsers } from "@/lib/admin-dashboard/mock-data"
import { formatNumber, relativeTime } from "@/lib/admin-dashboard/format"
import type { AdminUser } from "@/lib/admin-dashboard/types"

const TIER_LABEL: Record<string, string> = { free: "Free", pro: "Pro", team: "Team", enterprise: "Enterprise" }

export default function UsersPage() {
  const { session } = useAdminSession()
  const canManageRoles = session.role === "superadmin"

  const [rows, setRows] = useState<AdminUser[]>(seedUsers)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [tier, setTier] = useState("all")
  const [status, setStatus] = useState("all")
  const [role, setRole] = useState("all")

  const filtered = useMemo(() => {
    return rows.filter((u) => {
      const q = search.trim().toLowerCase()
      const matchesSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      const matchesTier = tier === "all" || u.tier === tier
      const matchesStatus = status === "all" || u.status === status
      const matchesRole = role === "all" || u.role === role
      return matchesSearch && matchesTier && matchesStatus && matchesRole
    })
  }, [rows, search, tier, status, role])

  const activeCount = rows.filter((u) => u.status === "active").length
  const adminCount = rows.filter((u) => u.role !== "user").length
  const suspendedCount = rows.filter((u) => u.status === "suspended").length

  function patchUser(id: string, patch: UserPatch, message: string) {
    setRows((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)))
    toast.success(message)
  }

  function addUser(user: AdminUser, message: string) {
    setRows((prev) => [user, ...prev])
    toast.success(message)
  }

  return (
    <>
      <PageHeader title="Users" description="Manage accounts, roles, access, and platform activity.">
        <Button size="sm" onClick={() => setInviteOpen(true)}>
          Invite user
        </Button>
      </PageHeader>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Users" value={formatNumber(rows.length)} hint="in view" />
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
                { label: "Suspended", value: "suspended" },
                { label: "Invited", value: "invited" },
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
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary font-mono text-[11px] font-semibold text-foreground">
                      {u.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                    </span>
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
              {
                key: "actions",
                header: "",
                className: "w-10 text-right",
                cell: (u) => (
                  <UserRowActions user={u} canManageRoles={canManageRoles} onPatch={patchUser} />
                ),
              },
            ]}
          />
        </DataTableCard>

        <p className="text-xs text-muted-foreground">
          Showing {filtered.length} of {rows.length} users
        </p>
      </div>

      <InviteUserDialog open={inviteOpen} onOpenChange={setInviteOpen} onInvite={addUser} />
    </>
  )
}
