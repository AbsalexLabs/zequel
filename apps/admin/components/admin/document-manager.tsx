"use client"

import { useMemo, useState } from "react"
import {
  MoreHorizontal,
  Upload,
  FileText,
  Globe,
  FileType,
  RefreshCw,
  Trash2,
  Download,
  HardDrive,
  Layers,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@zequel/ui/components/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@zequel/ui/components/dropdown-menu"
import { Button } from "@zequel/ui/components/button"
import { Label } from "@zequel/ui/components/label"
import { Input } from "@zequel/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@zequel/ui/components/select"
import { StatusPill } from "@/components/admin/status-pill"
import { formatDate, formatNumber, relativeTime } from "@/lib/admin-dashboard/format"
import type { DocumentRecord } from "@/lib/admin-dashboard/types"

type DocType = DocumentRecord["type"]
type DocStatus = DocumentRecord["status"]

const DOC_TYPES: DocType[] = ["pdf", "docx", "txt", "md", "web"]
const TYPE_LABEL: Record<DocType, string> = {
  pdf: "PDF",
  docx: "DOCX",
  txt: "TXT",
  md: "Markdown",
  web: "Web",
}

export interface DocumentPatch {
  status?: DocStatus
}

export function DocIcon({ type }: { type: string }) {
  if (type === "web") return <Globe className="size-4 text-muted-foreground" />
  if (type === "md" || type === "txt") return <FileType className="size-4 text-muted-foreground" />
  return <FileText className="size-4 text-muted-foreground" />
}

type DialogKind = "view" | "delete" | null

export function DocumentRowActions({
  doc,
  onPatch,
  onDelete,
  onExport,
}: {
  doc: DocumentRecord
  onPatch: (id: string, patch: DocumentPatch, message: string) => void
  onDelete: (id: string, message: string) => void
  onExport: (id: string, message: string) => void
}) {
  const [dialog, setDialog] = useState<DialogKind>(null)
  const close = () => setDialog(null)
  const canReindex = doc.status === "failed" || doc.status === "processing"

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8" aria-label="Document actions">
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setDialog("view")}>View details</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onExport(doc.id, `${doc.name} download started`)}>
            Download
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => onPatch(doc.id, { status: "indexed" }, `${doc.name} re-indexed`)}
          >
            {canReindex ? "Retry indexing" : "Re-index"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive" onSelect={() => setDialog("delete")}>
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ViewDocumentDialog open={dialog === "view"} onClose={close} doc={doc} onPatch={onPatch} onExport={onExport} />
      <DeleteDocumentDialog open={dialog === "delete"} onClose={close} doc={doc} onDelete={onDelete} />
    </>
  )
}

function ViewDocumentDialog({
  open,
  onClose,
  doc,
  onPatch,
  onExport,
}: {
  open: boolean
  onClose: () => void
  doc: DocumentRecord
  onPatch: (id: string, patch: DocumentPatch, message: string) => void
  onExport: (id: string, message: string) => void
}) {
  const stats = [
    { label: "Pages", value: formatNumber(doc.pages), icon: Layers },
    { label: "Size", value: `${doc.sizeMb} MB`, icon: HardDrive },
  ]
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-pretty">
            <DocIcon type={doc.type} />
            {doc.name}
          </DialogTitle>
          <DialogDescription className="font-mono text-[11px]">{doc.id}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={doc.status} />
            <span className="rounded-md border border-border bg-secondary px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-secondary-foreground">
              {TYPE_LABEL[doc.type]}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
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
              <dt className="text-muted-foreground">Owner</dt>
              <dd className="text-foreground">{doc.owner}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Uploaded</dt>
              <dd className="text-foreground">{formatDate(doc.uploadedAt)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Last activity</dt>
              <dd className="text-foreground">{relativeTime(doc.uploadedAt)}</dd>
            </div>
          </dl>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          <Button variant="outline" onClick={() => (onExport(doc.id, `${doc.name} download started`), onClose())}>
            <Download className="size-4" /> Download
          </Button>
          <Button onClick={() => (onPatch(doc.id, { status: "indexed" }, `${doc.name} re-indexed`), onClose())}>
            <RefreshCw className="size-4" /> Re-index
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DeleteDocumentDialog({
  open,
  onClose,
  doc,
  onDelete,
}: {
  open: boolean
  onClose: () => void
  doc: DocumentRecord
  onDelete: (id: string, message: string) => void
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="size-4 text-destructive" />
            Delete document
          </DialogTitle>
          <DialogDescription>
            Permanently remove {doc.name} from the index. This cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => (onDelete(doc.id, `${doc.name} deleted`), onClose())}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function UploadDocumentDialog({
  open,
  onOpenChange,
  onUpload,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onUpload: (doc: DocumentRecord, message: string) => void
}) {
  const [name, setName] = useState("")
  const [type, setType] = useState<DocType>("pdf")
  const [owner, setOwner] = useState("")
  const [pages, setPages] = useState("")

  const valid = useMemo(() => name.trim().length > 2 && owner.trim().length > 1, [name, owner])

  function reset() {
    setName("")
    setType("pdf")
    setOwner("")
    setPages("")
  }

  function submit() {
    const now = new Date().toISOString()
    const parsedPages = Number.parseInt(pages, 10)
    const doc: DocumentRecord = {
      id: `doc_${Math.random().toString(36).slice(2, 7)}`,
      name: name.trim(),
      type,
      owner: owner.trim(),
      sizeMb: Math.round((Math.random() * 8 + 0.4) * 10) / 10,
      pages: Number.isFinite(parsedPages) && parsedPages > 0 ? parsedPages : Math.floor(Math.random() * 40) + 1,
      status: "processing",
      uploadedAt: now,
    }
    onUpload(doc, `${doc.name} queued for indexing`)
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset()
        onOpenChange(v)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="size-4" />
            Upload document
          </DialogTitle>
          <DialogDescription>Add a document to the indexing pipeline.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-2">
            <Label htmlFor="doc-name">Document name</Label>
            <Input
              id="doc-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Q3 Research Report.pdf"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="doc-type">Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as DocType)}>
                <SelectTrigger id="doc-type" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOC_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {TYPE_LABEL[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="doc-pages">
                Pages <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="doc-pages"
                inputMode="numeric"
                value={pages}
                onChange={(e) => setPages(e.target.value)}
                placeholder="12"
                className="tabular-nums"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="doc-owner">Owner</Label>
            <Input
              id="doc-owner"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder="Jane Doe"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!valid}>
            <Upload className="size-4" /> Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
