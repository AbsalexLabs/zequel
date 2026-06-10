"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { PageHeader } from "@/components/admin/page-header"
import { StatCard } from "@/components/admin/stat-card"
import { StatusPill } from "@/components/admin/status-pill"
import { DataTable, DataTableCard, TableToolbar } from "@/components/admin/data-table"
import {
  DocIcon,
  DocumentRowActions,
  type DocumentPatch,
} from "@/components/admin/document-manager"
import { useDocuments, deleteDocument as deleteDocumentApi } from "@/lib/admin-dashboard/api"
import { formatNumber, relativeTime } from "@/lib/admin-dashboard/format"
import type { DocumentRecord } from "@/lib/admin-dashboard/types"

export default function DocumentsPage() {
  const [search, setSearch] = useState("")
  const [type, setType] = useState("all")
  const [status, setStatus] = useState("all")

  const { documents: rows, isLoading, error, mutate } = useDocuments({ limit: 200 })

  const filtered = useMemo(() => {
    return rows.filter((d) => {
      const q = search.trim().toLowerCase()
      const matchesSearch = !q || d.name.toLowerCase().includes(q) || d.owner.toLowerCase().includes(q)
      const matchesType = type === "all" || d.type === type
      const matchesStatus = status === "all" || d.status === status
      return matchesSearch && matchesType && matchesStatus
    })
  }, [rows, search, type, status])

  const indexed = rows.filter((d) => d.status === "indexed").length
  const processing = rows.filter((d) => d.status === "processing").length
  const failed = rows.filter((d) => d.status === "failed").length
  const totalPages = rows.reduce((a, d) => a + d.pages, 0)

  function patchDocument(_id: string, _patch: DocumentPatch, message: string) {
    // Re-indexing is handled by the ingestion pipeline, not the admin API.
    toast.success(message)
  }

  async function deleteDocument(id: string, message: string) {
    try {
      await deleteDocumentApi(id)
      await mutate()
      toast.success(message)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed")
    }
  }

  function exportDocument(_id: string, message: string) {
    toast.success(message)
  }

  return (
    <>
      <PageHeader title="Documents" description="Indexed corpus, ingestion pipeline, and document health." />

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Indexed" value={formatNumber(indexed)} />
        <StatCard label="Processing" value={formatNumber(processing)} />
        <StatCard label="Failed" value={formatNumber(failed)} />
        <StatCard label="Total Pages" value={formatNumber(totalPages)} />
      </section>

      <div className="space-y-4">
        {error && (
          <p className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Failed to load documents: {error.message}
          </p>
        )}
        <TableToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search documents..."
          filters={[
            {
              id: "type",
              label: "Type",
              value: type,
              onChange: setType,
              options: [
                { label: "All types", value: "all" },
                { label: "PDF", value: "pdf" },
                { label: "DOCX", value: "docx" },
                { label: "TXT", value: "txt" },
                { label: "Markdown", value: "md" },
                { label: "Web", value: "web" },
              ],
            },
            {
              id: "status",
              label: "Status",
              value: status,
              onChange: setStatus,
              options: [
                { label: "All status", value: "all" },
                { label: "Indexed", value: "indexed" },
                { label: "Processing", value: "processing" },
                { label: "Failed", value: "failed" },
              ],
            },
          ]}
        />

        <DataTableCard>
          <DataTable<DocumentRecord>
            rows={filtered}
            rowKey={(d) => d.id}
            columns={[
              {
                key: "name",
                header: "Document",
                cell: (d) => (
                  <div className="flex items-center gap-3">
                    <DocIcon type={d.type} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{d.name}</p>
                      <p className="truncate font-mono text-[11px] uppercase text-muted-foreground">{d.type}</p>
                    </div>
                  </div>
                ),
              },
              {
                key: "owner",
                header: "Owner",
                cell: (d) => <span className="text-sm text-foreground">{d.owner}</span>,
              },
              {
                key: "pages",
                header: "Pages",
                className: "text-right",
                cell: (d) => <span className="tabular-nums text-foreground">{d.pages}</span>,
              },
              {
                key: "size",
                header: "Size",
                className: "text-right",
                cell: (d) => <span className="tabular-nums text-muted-foreground">{d.sizeMb} MB</span>,
              },
              { key: "status", header: "Status", cell: (d) => <StatusPill status={d.status} /> },
              {
                key: "uploaded",
                header: "Uploaded",
                cell: (d) => <span className="text-sm text-muted-foreground">{relativeTime(d.uploadedAt)}</span>,
              },
              {
                key: "actions",
                header: "",
                className: "w-10 text-right",
                cell: (d) => (
                  <DocumentRowActions
                    doc={d}
                    onPatch={patchDocument}
                    onDelete={deleteDocument}
                    onExport={exportDocument}
                  />
                ),
              },
            ]}
          />
        </DataTableCard>

        <p className="text-xs text-muted-foreground">
          {isLoading ? "Loading documents…" : `Showing ${filtered.length} of ${rows.length} documents`}
        </p>
      </div>
    </>
  )
}
