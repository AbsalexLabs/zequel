"use client"

import { useMemo, useState } from "react"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { useIsMobile } from "@zequel/ui/hooks/use-mobile"
import { Button } from "@zequel/ui/components/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@zequel/ui/components/sheet"
import { StatCard } from "@/components/admin/stat-card"
import { formatNumber } from "@/lib/admin-dashboard/format"
import { cn } from "@/lib/utils"
import { SupportCategorySidebar } from "./support-category-sidebar"
import { SupportTicketList, type SortKey } from "./support-ticket-list"
import { SupportConversation } from "./support-conversation"
import { SupportContextPanel } from "./support-context-panel"
import {
  CATEGORIES,
  CURRENT_ADMIN,
  MOCK_TICKETS,
  STATUS_LABEL,
  SUPER_ADMIN,
  matchesCategory,
  type CategoryId,
  type SupportTicketDetail,
  type TicketSource,
  type TicketStatus,
  type TimelineItem,
} from "@/lib/admin-dashboard/support-center"

function makeItem(
  kind: TimelineItem["kind"],
  author: string,
  body: string,
  event?: string,
): TimelineItem {
  return {
    id: `t_${Math.random().toString(36).slice(2, 8)}`,
    kind,
    author,
    body,
    event,
    createdAt: new Date().toISOString(),
  }
}

export function SupportCenter() {
  const isMobile = useIsMobile()
  const [tickets, setTickets] = useState<SupportTicketDetail[]>(MOCK_TICKETS)
  const [category, setCategory] = useState<CategoryId>("all")
  const [source, setSource] = useState<TicketSource | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sourceFilter, setSourceFilter] = useState("all")
  const [sort, setSort] = useState<SortKey>("newest")
  const [selectedId, setSelectedId] = useState<string | null>(MOCK_TICKETS[0]?.id ?? null)
  const [mobileView, setMobileView] = useState<"list" | "detail">("list")

  // Metrics
  const metrics = useMemo(() => {
    return {
      total: tickets.length,
      open: tickets.filter((t) => t.status === "open").length,
      waiting: tickets.filter((t) => t.status === "waiting_for_user").length,
      resolved: tickets.filter((t) => t.status === "resolved").length,
      closed: tickets.filter((t) => t.status === "closed").length,
    }
  }, [tickets])

  // Filtered + sorted list
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = tickets.filter((t) => {
      const inCategory = source === null ? matchesCategory(t, category) : t.source === source
      const inStatus = statusFilter === "all" || t.status === statusFilter
      const inSource = sourceFilter === "all" || t.source === sourceFilter
      const inSearch =
        q.length === 0 ||
        t.subject.toLowerCase().includes(q) ||
        t.userName.toLowerCase().includes(q) ||
        t.userEmail.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q)
      return inCategory && inStatus && inSource && inSearch
    })
    return list.sort((a, b) => {
      const key = sort === "newest" ? "createdAt" : "lastActivityAt"
      return new Date(b[key]).getTime() - new Date(a[key]).getTime()
    })
  }, [tickets, category, source, statusFilter, sourceFilter, search, sort])

  const selected = useMemo(
    () => tickets.find((t) => t.id === selectedId) ?? null,
    [tickets, selectedId],
  )

  const listTitle = source === null ? CATEGORIES.find((c) => c.id === category)?.label ?? "Tickets" : "Tickets"

  function selectTicket(id: string) {
    setSelectedId(id)
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, unread: false } : t)))
    if (isMobile) setMobileView("detail")
  }

  function patch(id: string, updater: (t: SupportTicketDetail) => SupportTicketDetail) {
    setTickets((prev) => prev.map((t) => (t.id === id ? updater(t) : t)))
  }

  function handleSend(kind: "reply" | "email" | "note", body: string) {
    if (!selected) return
    const id = selected.id
    const now = new Date().toISOString()
    if (kind === "note") {
      patch(id, (t) => ({ ...t, timeline: [...t.timeline, makeItem("note", CURRENT_ADMIN, body)], updatedAt: now }))
      toast.success("Internal note added")
      return
    }
    const itemKind = kind === "email" ? "email" : "admin"
    patch(id, (t) => ({
      ...t,
      timeline: [...t.timeline, makeItem(itemKind, CURRENT_ADMIN, body)],
      updatedAt: now,
      lastActivityAt: now,
    }))
    toast.success(kind === "email" ? `Email sent to ${selected.userEmail}` : `Reply sent — emailed ${selected.userEmail}`)
  }

  function handleStatus(status: TicketStatus, label: string) {
    if (!selected) return
    const id = selected.id
    const now = new Date().toISOString()
    const eventName =
      status === "resolved" ? "Resolved" : status === "closed" ? "Closed" : status === "open" ? "Reopened" : "Updated"
    patch(id, (t) => ({
      ...t,
      status,
      updatedAt: now,
      lastActivityAt: now,
      timeline: [...t.timeline, makeItem("system", "System", `Ticket ${label} by ${CURRENT_ADMIN}`, eventName)],
    }))
    toast.success(`${id} ${label}`)
  }

  function handleAssign(admin: string) {
    if (!selected) return
    const id = selected.id
    const now = new Date().toISOString()
    patch(id, (t) => ({
      ...t,
      assignedAdmin: admin || null,
      updatedAt: now,
      timeline: admin
        ? [...t.timeline, makeItem("system", "System", `Assigned to ${admin}`, "Assigned to Admin")]
        : t.timeline,
    }))
    toast.success(admin ? `Assigned to ${admin}` : "Ticket unassigned")
  }

  function handleForward() {
    if (!selected) return
    handleAssign(SUPER_ADMIN)
    toast.success(`Forwarded to ${SUPER_ADMIN} for review`)
  }

  const listPanel = (
    <SupportTicketList
      tickets={filtered}
      selectedId={selectedId}
      onSelect={selectTicket}
      search={search}
      onSearchChange={setSearch}
      statusFilter={statusFilter}
      onStatusChange={setStatusFilter}
      sourceFilter={sourceFilter}
      onSourceChange={setSourceFilter}
      sort={sort}
      onSortChange={setSort}
      title={listTitle}
    />
  )

  const categorySidebar = (
    <SupportCategorySidebar
      tickets={tickets}
      category={category}
      source={source}
      onSelectCategory={setCategory}
      onSelectSource={setSource}
    />
  )

  // ---- Mobile ----
  if (isMobile) {
    return (
      <div className="flex h-[calc(100dvh-9rem)] flex-col">
        {mobileView === "list" ? (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-card">
            <div className="flex shrink-0 items-center gap-2 border-b border-border p-3">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm">
                    Categories
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0">
                  <SheetTitle className="sr-only">Support categories</SheetTitle>
                  {categorySidebar}
                </SheetContent>
              </Sheet>
              <span className="font-mono text-[11px] text-muted-foreground">{filtered.length} tickets</span>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden">{listPanel}</div>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-card">
            <div className="flex shrink-0 items-center gap-2 border-b border-border p-2">
              <Button variant="ghost" size="sm" onClick={() => setMobileView("list")}>
                <ArrowLeft className="size-4" /> Back
              </Button>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="ml-auto">
                    Details
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 p-0">
                  <SheetTitle className="sr-only">Ticket details</SheetTitle>
                  <SupportContextPanel
                    ticket={selected}
                    onAssign={handleAssign}
                    onStatus={handleStatus}
                    onForward={handleForward}
                  />
                </SheetContent>
              </Sheet>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden">
              <SupportConversation ticket={selected} onSend={handleSend} onStatus={handleStatus} />
            </div>
          </div>
        )}
      </div>
    )
  }

  // ---- Tablet & Desktop ----
  return (
    <div className="space-y-4">
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Total Tickets" value={formatNumber(metrics.total)} />
        <StatCard label="Open" value={formatNumber(metrics.open)} />
        <StatCard label="Waiting For User" value={formatNumber(metrics.waiting)} />
        <StatCard label="Resolved" value={formatNumber(metrics.resolved)} />
        <StatCard label="Closed" value={formatNumber(metrics.closed)} />
      </section>

      <div className="flex h-[calc(100dvh-15rem)] min-h-[32rem] overflow-hidden rounded-lg border border-border bg-card">
        {/* Left — categories */}
        <div className="hidden w-56 shrink-0 border-r border-border xl:block">{categorySidebar}</div>

        {/* Middle — ticket list */}
        <div className="w-full max-w-sm shrink-0 border-r border-border md:w-80 lg:w-96">{listPanel}</div>

        {/* Main — conversation */}
        <div className="min-w-0 flex-1">
          <SupportConversation ticket={selected} onSend={handleSend} onStatus={handleStatus} />
        </div>

        {/* Right — context (desktop only) */}
        <div className="hidden w-80 shrink-0 border-l border-border lg:block">
          <SupportContextPanel
            ticket={selected}
            onAssign={handleAssign}
            onStatus={handleStatus}
            onForward={handleForward}
          />
        </div>
      </div>

      {/* Tablet: categories + context move into a toolbar of sheets */}
      <div className="flex items-center gap-2 lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm">
              Categories &amp; Sources
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetTitle className="sr-only">Support categories</SheetTitle>
            {categorySidebar}
          </SheetContent>
        </Sheet>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" disabled={!selected}>
              Ticket Details
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80 p-0">
            <SheetTitle className="sr-only">Ticket details</SheetTitle>
            <SupportContextPanel
              ticket={selected}
              onAssign={handleAssign}
              onStatus={handleStatus}
              onForward={handleForward}
            />
          </SheetContent>
        </Sheet>
        <span className="ml-auto font-mono text-[11px] text-muted-foreground">
          {selected ? STATUS_LABEL[selected.status] : "No ticket selected"}
        </span>
      </div>
    </div>
  )
}
