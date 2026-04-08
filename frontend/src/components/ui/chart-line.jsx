import * as React from "react"
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { cn } from "@/lib/utils"
import { ChartContainer, ChartTooltipContent } from "./chart-bar"

const LineChart = React.forwardRef(
  (
    {
      data,
      dataKey,
      xAxisKey = "name",
      className,
      lineColor = "var(--color-primary)",
      showGrid = true,
      showLegend = false,
      showDots = true,
      curved = true,
      ...props
    },
    ref
  ) => (
    <ChartContainer ref={ref} className={cn("h-[300px]", className)} {...props}>
      <RechartsLineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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
        <Line
          type={curved ? "monotone" : "linear"}
          dataKey={dataKey}
          stroke={lineColor}
          strokeWidth={2}
          dot={showDots}
          activeDot={{ r: 6 }}
        />
      </RechartsLineChart>
    </ChartContainer>
  )
)
LineChart.displayName = "LineChart"

export { LineChart }
