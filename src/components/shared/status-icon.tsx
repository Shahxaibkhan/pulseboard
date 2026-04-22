import { cn } from "@/lib/utils"
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react"

interface StatusIconProps {
  progress: number
  isDelayed?: boolean
  className?: string
}

export function StatusIcon({ progress, isDelayed, className }: StatusIconProps) {
  if (progress >= 100) {
    return <CheckCircle2 className={cn("h-5 w-5 text-green-500", className)} />
  }
  if (isDelayed) {
    return <XCircle className={cn("h-5 w-5 text-red-500", className)} />
  }
  if (progress > 0) {
    return <AlertTriangle className={cn("h-5 w-5 text-yellow-500", className)} />
  }
  return <div className={cn("h-5 w-5 rounded-full border-2 border-gray-300", className)} />
}
