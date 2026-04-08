import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "./card"
import { AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react"

const alertVariants = {
  default: {
    icon: Info,
    className: "border-slate-200 bg-slate-50 text-slate-900",
    iconClassName: "text-slate-500",
  },
  success: {
    icon: CheckCircle,
    className: "border-emerald-200 bg-emerald-50 text-emerald-900",
    iconClassName: "text-emerald-600",
  },
  warning: {
    icon: AlertTriangle,
    className: "border-amber-200 bg-amber-50 text-amber-900",
    iconClassName: "text-amber-600",
  },
  error: {
    icon: AlertCircle,
    className: "border-red-200 bg-red-50 text-red-900",
    iconClassName: "text-red-600",
  },
  info: {
    icon: Info,
    className: "border-blue-200 bg-blue-50 text-blue-900",
    iconClassName: "text-blue-600",
  },
}

const Alert = React.forwardRef(
  ({ className, variant = "default", title, children, icon: CustomIcon, ...props }, ref) => {
    const variantConfig = alertVariants[variant] || alertVariants.default
    const Icon = CustomIcon || variantConfig.icon

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          "relative w-full rounded-lg border p-4",
          variantConfig.className,
          className
        )}
        {...props}
      >
        <div className="flex gap-3">
          <Icon className={cn("size-5 shrink-0", variantConfig.iconClassName)} />
          <div className="flex-1">
            {title && (
              <h5 className="mb-1 font-medium leading-none tracking-tight">{title}</h5>
            )}
            <div className="text-sm [&_p]:leading-relaxed">{children}</div>
          </div>
        </div>
      </div>
    )
  }
)
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
