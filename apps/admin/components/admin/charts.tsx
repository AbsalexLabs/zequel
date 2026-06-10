"use client"

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@zequel/ui/components/chart"
import type { TimeSeriesPoint } from "@/lib/admin-dashboard/types"

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export function AreaTrend({
  data,
  label,
  className,
}: {
  data: TimeSeriesPoint[]
  label: string
  className?: string
}) {
  const config = { value: { label, color: "var(--foreground)" } } satisfies ChartConfig
  return (
    <ChartContainer config={config} className={className}>
      <AreaChart data={data} margin={{ left: 4, right: 4, top: 8, bottom: 0 }}>
        <defs>
          <linearGradient id={`fill-${label}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--foreground)" stopOpacity={0.12} />
            <stop offset="100%" stopColor="var(--foreground)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickFormatter={shortDate}
          tickLine={false}
          axisLine={false}
          minTickGap={32}
          tickMargin={8}
        />
        <YAxis hide />
        <ChartTooltip
          content={<ChartTooltipContent labelFormatter={(_, p) => shortDate(p?.[0]?.payload?.date ?? "")} />}
        />
        <Area
          dataKey="value"
          type="monotone"
          stroke="var(--foreground)"
          strokeWidth={2}
          fill={`url(#fill-${label})`}
        />
      </AreaChart>
    </ChartContainer>
  )
}

export function LineTrend({
  data,
  label,
  className,
}: {
  data: TimeSeriesPoint[]
  label: string
  className?: string
}) {
  const config = { value: { label, color: "var(--foreground)" } } satisfies ChartConfig
  return (
    <ChartContainer config={config} className={className}>
      <LineChart data={data} margin={{ left: 4, right: 4, top: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickFormatter={shortDate}
          tickLine={false}
          axisLine={false}
          minTickGap={32}
          tickMargin={8}
        />
        <YAxis hide />
        <ChartTooltip
          content={<ChartTooltipContent labelFormatter={(_, p) => shortDate(p?.[0]?.payload?.date ?? "")} />}
        />
        <Line dataKey="value" type="monotone" stroke="var(--foreground)" strokeWidth={2} dot={false} />
      </LineChart>
    </ChartContainer>
  )
}

export function BarBreakdown({
  data,
  className,
}: {
  data: { label: string; value: number }[]
  className?: string
}) {
  const config = { value: { label: "Value", color: "var(--foreground)" } } satisfies ChartConfig
  return (
    <ChartContainer config={config} className={className}>
      <BarChart data={data} margin={{ left: 4, right: 4, top: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis hide />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="value" fill="var(--foreground)" radius={[4, 4, 0, 0]} maxBarSize={48} />
      </BarChart>
    </ChartContainer>
  )
}

export function DonutBreakdown({
  data,
  className,
}: {
  data: { tier: string; users: number; fill: string }[]
  className?: string
}) {
  const config = data.reduce((acc, d) => {
    acc[d.tier] = { label: d.tier, color: d.fill }
    return acc
  }, {} as ChartConfig)

  return (
    <ChartContainer config={config} className={className}>
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent nameKey="tier" />} />
        <Pie data={data} dataKey="users" nameKey="tier" innerRadius="58%" outerRadius="88%" strokeWidth={2}>
          {data.map((d) => (
            <Cell key={d.tier} fill={d.fill} stroke="var(--background)" />
          ))}
        </Pie>
      </PieChart>
    </ChartContainer>
  )
}
