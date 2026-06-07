"use client"

import { useState } from "react"
import { MoreHorizontal, Cpu, Hash, Gauge, DollarSign, Clock, User } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { StatusPill } from "@/components/admin/status-pill"
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/admin-dashboard/format"
import type { AiUsageRecord } from "@/lib/admin-dashboard/types"

export function AiUsageRowActions({
  record,
  onCopy,
}: {
  record: AiUsageRecord
  onCopy: (id: string, message: string) => void
}) {
  const [open, setOpen] = useState(false)

  const stats = [
    { label: "Tokens", value: formatNumber(record.tokens), icon: Hash },
    { label: "Latency", value: `${record.latencyMs}ms`, icon: Gauge },
    { label: "Cost", value: formatCurrency(record.cost), icon: DollarSign },
  ]

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8" aria-label="Request actions">
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setOpen(true)}>View request</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onCopy(record.id, "Request ID copied")}>
            Copy request ID
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cpu className="size-4" />
              Request detail
            </DialogTitle>
            <DialogDescription className="font-mono text-[11px]">{record.id}</DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-1">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill status={record.status} />
              <span className="rounded-md border border-border bg-secondary px-2 py-0.5 font-mono text-[11px] font-medium text-secondary-foreground">
                {record.model}
              </span>
              <span className="rounded-md border border-border bg-secondary px-2 py-0.5 text-xs font-medium capitalize text-secondary-foreground">
                {record.type}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {stats.map((s) => {
                const Icon = s.icon
                return (
                  <div key={s.label} className="rounded-lg border border-border bg-secondary/40 p-3">
                    <Icon className="size-4 text-muted-foreground" />
                    <p className="mt-2 text-sm font-semibold tabular-nums text-foreground">{s.value}</p>
                    <p className="text-[11px] text-muted-foreground">{s.label}</p>
                  </div>
                )
              })}
            </div>

            <dl className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-1.5 text-muted-foreground">
                  <User className="size-3.5" /> User
                </dt>
                <dd className="text-foreground">{record.user}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="size-3.5" /> Timestamp
                </dt>
                <dd className="text-foreground">{formatDateTime(record.createdAt)}</dd>
              </div>
            </dl>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
