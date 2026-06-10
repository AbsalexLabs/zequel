"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const RANGE_LABEL: Record<string, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
}

export function OverviewActions() {
  const [range, setRange] = useState("30d")

  function exportReport() {
    const report = {
      generatedAt: new Date().toISOString(),
      range,
      label: RANGE_LABEL[range],
    }
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `zequel-overview-${range}-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success("Report exported")
  }

  return (
    <>
      <Select value={range} onValueChange={(v) => (setRange(v), toast.message(`Showing ${RANGE_LABEL[v].toLowerCase()}`))}>
        <SelectTrigger size="sm" className="w-auto min-w-[8.5rem] text-sm" aria-label="Date range">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(RANGE_LABEL).map(([v, label]) => (
            <SelectItem key={v} value={v}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button size="sm" onClick={exportReport}>
        Export report
      </Button>
    </>
  )
}
