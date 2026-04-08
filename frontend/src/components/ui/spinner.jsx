import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

function Spinner({ className, ...props }) {
  return (
    <Loader2
      className={cn("animate-spin text-primary", className)}
      {...props}
    />
  )
}

export { Spinner }
