import * as React from "react"
import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { cn } from "@/lib/utils"
import { ChartContainer, ChartTooltipContent } from "./chart-bar"

const AreaChart = React.forwardRef(
  (
    {
      data,
      dataKey,
      xAxisKey = "name",
      className,
      areaColor = "var(--color-primary)",
      fillOpacity = 0.3,
      showGrid = true,
      showLegend = false,
      curved = true,
      ...props
    },
    ref
  ) => (
    <ChartContainer ref={ref} className={cn("h-[300px]", className)} {...props}>
      <RechartsAreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={areaColor} stopOpacity={0.8} />
            <stop offset="95%" stopColor={areaColor} stopOpacity={0} />
          </linearGradient>
        </defs>
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
        <Area
          type={curved ? "monotone" : "linear"}
          dataKey={dataKey}
          stroke={areaColor}
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorGradient)"
        />
      </RechartsAreaChart>
    </ChartContainer>
  )
)
AreaChart.displayName = "AreaChart"

export { AreaChart }
