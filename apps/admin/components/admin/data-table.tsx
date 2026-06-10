"use client"

import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from "@/components/ui/table"
import { cn } from "@/lib/utils"

export interface FilterConfig {
  id: string
  label: string
  value: string
  options: { label: string; value: string }[]
  onChange: (value: string) => void
}

export function TableToolbar({
  search,
  onSearchChange,
  searchPlaceholder = "Search...",
  filters = [],
  children,
}: {
  search: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  filters?: FilterConfig[]
  children?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative w-full sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="h-9 pl-9 text-sm"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {filters.map((f) => (
          <Select key={f.id} value={f.value} onValueChange={f.onChange}>
            <SelectTrigger className="h-9 w-auto min-w-[8rem] text-sm">
              <SelectValue placeholder={f.label} />
            </SelectTrigger>
            <SelectContent>
              {f.options.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}
        {children}
      </div>
    </div>
  )
}

export function DataTableCard({ children }: { children: React.ReactNode }) {
  return <Card className="overflow-hidden p-0">{children}</Card>
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  empty = "No records found.",
  onRowClick,
}: {
  columns: {
    key: string
    header: string
    className?: string
    cell: (row: T) => React.ReactNode
  }[]
  rows: T[]
  rowKey: (row: T) => string
  empty?: string
  onRowClick?: (row: T) => void
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="border-border hover:bg-transparent">
          {columns.map((c) => (
            <TableHead
              key={c.key}
              className={cn(
                "h-11 bg-secondary/40 px-4 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground",
                c.className,
              )}
            >
              {c.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={columns.length} className="h-32 text-center text-sm text-muted-foreground">
              {empty}
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row) => (
            <TableRow
              key={rowKey(row)}
              className={cn("border-border", onRowClick && "cursor-pointer")}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {columns.map((c) => (
                <TableCell key={c.key} className={cn("px-4 py-3", c.className)}>
                  {c.cell(row)}
                </TableCell>
              ))}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}
