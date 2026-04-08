import * as React from "react"
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { cn } from "@/lib/utils"
import { ChartContainer } from "./chart-bar"

const COLORS = [
  "#1459c7", // primary blue
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#f97316", // orange
  "#ec4899", // pink
]

const PieChartTooltipContent = ({ active, payload }) => {
  if (!active || !payload?.length) return null

  const data = payload[0]
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
      <p className="text-sm font-medium text-slate-900">{data.name}</p>
      <p className="text-sm text-slate-600">
        Value: {data.value} ({((data.percent || 0) * 100).toFixed(1)}%)
      </p>
    </div>
  )
}

const PieChart = React.forwardRef(
  (
    {
      data,
      dataKey = "value",
      nameKey = "name",
      className,
      colors = COLORS,
      showLegend = true,
      innerRadius = 0,
      outerRadius = 80,
      showLabels = false,
      ...props
    },
    ref
  ) => (
    <ChartContainer ref={ref} className={cn("h-[300px]", className)} {...props}>
      <RechartsPieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={showLabels}
          label={showLabels ? ({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)` : undefined}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          fill="#8884d8"
          dataKey={dataKey}
          nameKey={nameKey}
          animationBegin={0}
          animationDuration={800}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip content={<PieChartTooltipContent />} />
        {showLegend && (
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => <span className="text-sm text-slate-600">{value}</span>}
          />
        )}
      </RechartsPieChart>
    </ChartContainer>
  )
)
PieChart.displayName = "PieChart"

// Donut chart is a pie chart with inner radius
const DonutChart = React.forwardRef((props, ref) => (
  <PieChart ref={ref} innerRadius={50} outerRadius={80} {...props} />
))
DonutChart.displayName = "DonutChart"

export { PieChart, DonutChart, COLORS }
