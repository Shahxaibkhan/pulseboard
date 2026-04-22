import { cn, getProgressColor } from "@/lib/utils"

interface ProgressBarProps {
  value: number
  className?: string
  showLabel?: boolean
  size?: "sm" | "md" | "lg"
}

export function ProgressBar({ value, className, showLabel = true, size = "md" }: ProgressBarProps) {
  const clampedValue = Math.max(0, Math.min(100, value))
  const heightClass = size === "sm" ? "h-1.5" : size === "lg" ? "h-3" : "h-2"
  const glowColor = clampedValue === 100
    ? "shadow-[0_0_6px_rgba(34,197,94,0.5)]"
    : clampedValue >= 70
    ? "shadow-[0_0_6px_rgba(59,130,246,0.4)]"
    : clampedValue >= 30
    ? "shadow-[0_0_6px_rgba(234,179,8,0.4)]"
    : "shadow-[0_0_6px_rgba(239,68,68,0.3)]"

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn("flex-1 rounded-full bg-blue-100/50 dark:bg-blue-950/40 overflow-hidden", heightClass)}>
        <div
          className={cn("h-full rounded-full transition-all duration-700", getProgressColor(clampedValue), glowColor)}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-semibold text-muted-foreground w-9 text-right tabular-nums">
          {clampedValue}%
        </span>
      )}
    </div>
  )
}
