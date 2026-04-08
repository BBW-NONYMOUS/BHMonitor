import * as React from "react"
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { cn } from "@/lib/utils"

const ChartContainer = React.forwardRef(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("w-full", className)} {...props}>
    <ResponsiveContainer width="100%" height="100%">
      {children}
    </ResponsiveContainer>
  </div>
))
ChartContainer.displayName = "ChartContainer"

const ChartTooltipContent = ({ active, payload, label, labelFormatter, formatter }) => {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
      <p className="mb-1 text-sm font-medium text-slate-900">
        {labelFormatter ? labelFormatter(label) : label}
      </p>
      {payload.map((entry, index) => (
        <p key={index} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: {formatter ? formatter(entry.value) : entry.value}
        </p>
      ))}
    </div>
  )
}

const BarChart = React.forwardRef(
  (
    {
      data,
      dataKey,
      xAxisKey = "name",
      className,
      barColor = "var(--color-primary)",
      showGrid = true,
      showLegend = false,
      ...props
    },
    ref
  ) => (
    <ChartContainer ref={ref} className={cn("h-[300px]", className)} {...props}>
      <RechartsBarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />}
        <XAxis
          dataKey={xAxisKey}
          tickLine={false}
          axisLine={false}
          className="text-xs text-slate-500"
        />
        <YAxis tickLine={false} axisLine={false} className="text-xs text-slate-500" />
        <Tooltip content={<ChartTooltipContent />} />
        {showLegend && <Legend />}
        <Bar dataKey={dataKey} fill={barColor} radius={[4, 4, 0, 0]} />
      </RechartsBarChart>
    </ChartContainer>
  )
)
BarChart.displayName = "BarChart"

export { ChartContainer, ChartTooltipContent, BarChart }
