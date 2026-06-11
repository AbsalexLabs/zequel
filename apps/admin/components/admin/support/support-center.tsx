"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { useIsMobile } from "@zequel/ui/hooks/use-mobile"
import { Button } from "@zequel/ui/components/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@zequel/ui/components/sheet"
import { cn } from "@/lib/utils"
import { SupportCategorySidebar } from "./support-category-sidebar"
import { SupportTicketList, type SortKey } from "./support-ticket-list"
import { SupportConversation } from "./support-conversation"
import { SupportContextPanel } from "./support-context-panel"
import {
  CATEGORIES,
  STATUS_LABEL,
  type CategoryId,
  type TicketSource,
  type TicketStatus,
} from "@/lib/admin-dashboard/support-center"
import {
  useSupportTickets,
  useSupportTicket,
  postMessage,
  patchTicket,
  type MessageKind,
} from "@/lib/admin-dashboard/use-support"

export function SupportCenter() {
  const isMobile = useIsMobile()
  const [category, setCategory] = useState<CategoryId>("all")
  const [source, setSource] = useState<TicketSource | null>(null)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sourceFilter, setSourceFilter] = useState("all")
  const [sort, setSort] = useState<SortKey>("newest")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mobileView, setMobileView] = useState<"list" | "detail">("list")
  const [busy, setBusy] = useState(false)

  // Debounce the search box so we don't refetch on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  // The sidebar source filter takes precedence over the category source filter.
  const effectiveSource = source ?? (sourceFilter !== "all" ? (sourceFilter as TicketSource) : undefined)

  const {
    data,
    error: listError,
    isLoading: listLoading,
    mutate: mutateList,
  } = useSupportTickets({
    category: source === null ? category : "all",
    source: effectiveSource,
    status: statusFilter !== "all" ? (statusFilter as TicketStatus) : undefined,
    search: debouncedSearch,
    sort,
  })

  const tickets = data?.tickets ?? []
  const admins = data?.admins ?? []

  // Keep a valid selection as the list changes.
  useEffect(() => {
    if (tickets.length === 0) {
      setSelectedId(null)
      return
    }
    if (!selectedId || !tickets.some((t) => t.id === selectedId)) {
      if (!isMobile) setSelectedId(tickets[0].id)
    }
  }, [tickets, selectedId, isMobile])

  const {
    ticket: selected,
    isLoading: detailLoading,
    mutate: mutateDetail,
  } = useSupportTicket(selectedId)

  const listTitle =
    source === null ? CATEGORIES.find((c) => c.id === category)?.label ?? "Tickets" : "Tickets"

  function selectTicket(id: string) {
    setSelectedId(id)
    if (isMobile) setMobileView("detail")
  }

  async function refresh() {
    await Promise.all([mutateList(), mutateDetail()])
  }

  async function handleSend(kind: MessageKind, body: string) {
    if (!selectedId) return
    setBusy(true)
    try {
      const res = (await postMessage(selectedId, { kind, body })) as { emailed?: boolean }
      await refresh()
      if (kind === "note") toast.success("Internal note added")
      else if (res.emailed) toast.success(`Sent — emailed ${selected?.userEmail ?? "the user"}`)
      else toast.success("Message saved (email not sent — check email config)")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send message")
    } finally {
      setBusy(false)
    }
  }

  async function handleStatus(status: TicketStatus, label: string) {
    if (!selectedId) return
    setBusy(true)
    try {
      await patchTicket(selectedId, { status })
      await refresh()
      toast.success(`Ticket ${label}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status")
    } finally {
      setBusy(false)
    }
  }

  async function handleAssign(adminId: string) {
    if (!selectedId) return
    setBusy(true)
    try {
      await patchTicket(selectedId, { assignedAdminId: adminId || null })
      await refresh()
      const name = admins.find((a) => a.id === adminId)?.name
      toast.success(name ? `Assigned to ${name}` : "Ticket unassigned")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to assign ticket")
    } finally {
      setBusy(false)
    }
  }

  async function handleForward() {
    if (!selectedId || !data?.superAdminId) {
      toast.error("No Super Admin is configured")
      return
    }
    setBusy(true)
    try {
      await patchTicket(selectedId, {
        assignedAdminId: data.superAdminId,
        forwardToSuperAdmin: true,
      })
      await refresh()
      toast.success("Forwarded to Super Admin for review")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to forward ticket")
    } finally {
      setBusy(false)
    }
  }

  const listPanel = (
    <SupportTicketList
      tickets={tickets}
      loading={listLoading}
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
      categoryCounts={data?.categoryCounts}
      sourceCounts={data?.sourceCounts}
      category={category}
      source={source}
      onSelectCategory={setCategory}
      onSelectSource={setSource}
    />
  )

  const contextPanel = (
    <SupportContextPanel
      ticket={selected ?? null}
      admins={admins}
      superAdminId={data?.superAdminId ?? null}
      busy={busy}
      onAssign={handleAssign}
      onStatus={handleStatus}
      onForward={handleForward}
    />
  )

  const conversation = (
    <SupportConversation
      ticket={selected ?? null}
      loading={detailLoading && !!selectedId}
      busy={busy}
      onSend={handleSend}
      onStatus={handleStatus}
    />
  )

  if (listError) {
    return (
      <div className="flex h-[calc(100dvh-12rem)] flex-col items-center justify-center gap-2 rounded-lg border border-border bg-card text-center">
        <AlertCircle className="size-7 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">Could not load tickets</p>
        <p className="max-w-sm text-xs text-muted-foreground">{listError.message}</p>
        <Button variant="outline" size="sm" className="mt-2" onClick={() => mutateList()}>
          Retry
        </Button>
      </div>
    )
  }

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
              <span className="font-mono text-[11px] text-muted-foreground">{tickets.length} tickets</span>
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
                  <Button variant="outline" size="sm" className="ml-auto" disabled={!selected}>
                    Details
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 p-0">
                  <SheetTitle className="sr-only">Ticket details</SheetTitle>
                  {contextPanel}
                </SheetContent>
              </Sheet>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden">{conversation}</div>
          </div>
        )}
      </div>
    )
  }

  // ---- Tablet & Desktop ----
  return (
    <div className="space-y-4">
      <div className="flex h-[calc(100dvh-11rem)] min-h-[32rem] overflow-hidden rounded-lg border border-border bg-card">
        {/* Left — categories */}
        <div className="hidden w-56 shrink-0 border-r border-border xl:block">{categorySidebar}</div>

        {/* Middle — ticket list */}
        <div className="w-full max-w-sm shrink-0 border-r border-border md:w-80 lg:w-96">{listPanel}</div>

        {/* Main — conversation */}
        <div className="min-w-0 flex-1">{conversation}</div>

        {/* Right — context (desktop only) */}
        <div className="hidden w-80 shrink-0 border-l border-border lg:block">{contextPanel}</div>
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
            {contextPanel}
          </SheetContent>
        </Sheet>
        <span className="ml-auto font-mono text-[11px] text-muted-foreground">
          {selected ? STATUS_LABEL[selected.status] : "No ticket selected"}
        </span>
      </div>
    </div>
  )
}
