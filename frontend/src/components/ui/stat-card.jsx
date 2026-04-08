import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "./card"

// Animated counter hook
function useAnimatedCounter(end, duration = 1000, start = 0) {
  const [count, setCount] = React.useState(start)
  const countRef = React.useRef(start)
  const startTimeRef = React.useRef(null)

  React.useEffect(() => {
    if (end === undefined || end === null) return
    
    const animate = (timestamp) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp
      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1)
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      const currentCount = Math.floor(start + (end - start) * easeOutQuart)
      
      if (countRef.current !== currentCount) {
        countRef.current = currentCount
        setCount(currentCount)
      }
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    
    startTimeRef.current = null
    requestAnimationFrame(animate)
  }, [end, duration, start])

  return count
}

// Stat Card with animated counter
const StatCard = React.forwardRef(
  ({ 
    title, 
    value, 
    icon: Icon, 
    description, 
    trend, 
    trendValue,
    className,
    iconClassName,
    animate = true,
    ...props 
  }, ref) => {
    const animatedValue = useAnimatedCounter(animate ? value : 0, 1000, 0)
    const displayValue = animate ? animatedValue : value

    return (
      <Card 
        ref={ref} 
        className={cn(
          "overflow-hidden transition-all duration-300 hover:shadow-md",
          className
        )} 
        {...props}
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-500">{title}</p>
              <p className="text-3xl font-bold text-slate-900 tabular-nums">
                {typeof displayValue === "number" ? displayValue.toLocaleString() : displayValue}
              </p>
              {description && (
                <p className="text-sm text-slate-500">{description}</p>
              )}
              {trend && (
                <p className={cn(
                  "text-sm font-medium",
                  trend === "up" ? "text-emerald-600" : "text-red-600"
                )}>
                  {trend === "up" ? "↑" : "↓"} {trendValue}
                </p>
              )}
            </div>
            {Icon && (
              <div className={cn(
                "flex size-12 items-center justify-center rounded-full",
                iconClassName || "bg-primary/10 text-primary"
              )}>
                <Icon className="size-6" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }
)
StatCard.displayName = "StatCard"

// Simple animated number component
const AnimatedNumber = ({ value, duration = 1000, className }) => {
  const animatedValue = useAnimatedCounter(value, duration, 0)
  
  return (
    <span className={cn("tabular-nums", className)}>
      {animatedValue.toLocaleString()}
    </span>
  )
}

export { StatCard, AnimatedNumber, useAnimatedCounter }
