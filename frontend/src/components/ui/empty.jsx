import * as React from "react"
import { cn } from "@/lib/utils"
import { FileQuestion, Inbox, Search, FolderOpen } from "lucide-react"

const emptyVariants = {
  default: {
    icon: Inbox,
    title: "No data",
    description: "There's nothing to show here yet.",
  },
  search: {
    icon: Search,
    title: "No results found",
    description: "Try adjusting your search or filter criteria.",
  },
  folder: {
    icon: FolderOpen,
    title: "No items",
    description: "This folder is empty.",
  },
  error: {
    icon: FileQuestion,
    title: "Something went wrong",
    description: "We couldn't load the data. Please try again.",
  },
}

const Empty = React.forwardRef(
  (
    {
      className,
      variant = "default",
      icon: CustomIcon,
      title,
      description,
      action,
      children,
      ...props
    },
    ref
  ) => {
    const variantConfig = emptyVariants[variant] || emptyVariants.default
    const Icon = CustomIcon || variantConfig.icon
    const displayTitle = title || variantConfig.title
    const displayDescription = description || variantConfig.description

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center py-12 text-center",
          className
        )}
        {...props}
      >
        <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-slate-100">
          <Icon className="size-8 text-slate-400" />
        </div>
        <h3 className="mb-1 text-lg font-semibold text-slate-900">{displayTitle}</h3>
        <p className="mb-4 max-w-sm text-sm text-slate-500">{displayDescription}</p>
        {action && <div className="mt-2">{action}</div>}
        {children}
      </div>
    )
  }
)
Empty.displayName = "Empty"

export { Empty }
