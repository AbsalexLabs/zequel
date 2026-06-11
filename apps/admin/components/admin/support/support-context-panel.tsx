"use client"

import {
  UserRound,
  Ticket,
  UserCog,
  ArrowUpCircle,
  CheckCircle2,
  XCircle,
  RotateCcw,
} from "lucide-react"
import { Button } from "@zequel/ui/components/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@zequel/ui/components/select"
import { StatusPill } from "@/components/admin/status-pill"
import { formatDateTime } from "@/lib/admin-dashboard/format"
import {
  ADMINS,
  ACCOUNT_STATUS_LABEL,
  PLAN_LABEL,
  SOURCE_LABEL,
  STATUS_PILL,
  SUPER_ADMIN,
  type SupportTicketDetail,
} from "@/lib/admin-dashboard/support-center"

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <dt className="shrink-0 text-xs text-muted-foreground">{label}</dt>
      <dd className={`min-w-0 truncate text-right text-xs text-foreground ${mono ? "font-mono" : ""}`}>{value}</dd>
    </div>
  )
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof UserRound
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-2">
      <h3 className="flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
        <Icon className="size-3" />
        {title}
      </h3>
      <dl className="rounded-md border border-border bg-secondary/20 px-3 py-1.5">{children}</dl>
    </section>
  )
}

export function SupportContextPanel({
  ticket,
  onAssign,
  onStatus,
  onForward,
}: {
  ticket: SupportTicketDetail | null
  onAssign: (admin: string) => void
  onStatus: (status: SupportTicketDetail["status"], label: string) => void
  onForward: () => void
}) {
  if (!ticket) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center">
        <p className="text-xs text-muted-foreground">Ticket details appear here.</p>
      </div>
    )
  }

  const isClosed = ticket.status === "closed"
  const isResolved = ticket.status === "resolved"

  return (
    <div className="flex h-full flex-col overflow-y-auto p-4">
      <div className="space-y-5">
        <Section icon={UserRound} title="User">
          <Field label="Name" value={ticket.userName} />
          <Field label="Email" value={ticket.userEmail} />
          <Field label="User ID" value={ticket.userId} mono />
          <Field label="Plan" value={PLAN_LABEL[ticket.plan]} />
          <div className="flex items-center justify-between gap-3 py-1">
            <dt className="text-xs text-muted-foreground">Account</dt>
            <dd>
              <StatusPill status={ticket.accountStatus === "active" ? "active" : ticket.accountStatus} />
            </dd>
          </div>
        </Section>

        <Section icon={Ticket} title="Ticket">
          <Field label="Ticket ID" value={ticket.id} mono />
          <Field label="Source" value={SOURCE_LABEL[ticket.source]} />
          <div className="flex items-center justify-between gap-3 py-1">
            <dt className="text-xs text-muted-foreground">Status</dt>
            <dd>
              <StatusPill status={STATUS_PILL[ticket.status]} />
            </dd>
          </div>
          <Field label="Created" value={formatDateTime(ticket.createdAt)} />
          <Field label="Last Updated" value={formatDateTime(ticket.updatedAt)} />
        </Section>

        <Section icon={UserCog} title="Assignment">
          <div className="py-1.5">
            <p className="mb-1.5 text-xs text-muted-foreground">Assigned Admin</p>
            <Select
              value={ticket.assignedAdmin ?? "unassigned"}
              onValueChange={(v) => onAssign(v === "unassigned" ? "" : v)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {ADMINS.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Section>

        <section className="space-y-2">
          <h3 className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            Actions
          </h3>
          <div className="grid gap-1.5">
            <Button variant="outline" size="sm" className="justify-start" onClick={onForward}>
              <ArrowUpCircle className="size-3.5" /> Forward to {SUPER_ADMIN.split(" ")[0]} (Super Admin)
            </Button>
            {isClosed || isResolved ? (
              <Button variant="outline" size="sm" className="justify-start" onClick={() => onStatus("open", "reopened")}>
                <RotateCcw className="size-3.5" /> Reopen Ticket
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="justify-start"
                onClick={() => onStatus("resolved", "marked resolved")}
              >
                <CheckCircle2 className="size-3.5" /> Resolve Ticket
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="justify-start text-destructive hover:text-destructive"
              onClick={() => onStatus("closed", "closed")}
              disabled={isClosed}
            >
              <XCircle className="size-3.5" /> Close Ticket
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
}
