"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Notification } from "@/types"
import { Bell, CheckCheck, BellOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface NotificationListProps { notifications: Notification[] }

const typeIcon: Record<string, string> = {
  TASK_ASSIGNED: "📋",
  TASK_DELAYED: "⏰",
  DEPENDENCY_BLOCKED: "🔒",
  RELEASE_UPCOMING: "🚀",
}

const typeLabel: Record<string, string> = {
  TASK_ASSIGNED: "Task Assigned",
  TASK_DELAYED: "Task Delayed",
  DEPENDENCY_BLOCKED: "Dependency Blocked",
  RELEASE_UPCOMING: "Release Upcoming",
}

export function NotificationList({ notifications }: NotificationListProps) {
  const [items, setItems] = useState(notifications)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  async function markAllRead() {
    setLoading(true)
    await supabase.from("notifications").update({ read: true }).eq("read", false)
    setItems(prev => prev.map(n => ({ ...n, read: true })))
    setLoading(false)
    router.refresh()
  }

  async function markRead(id: string) {
    await supabase.from("notifications").update({ read: true }).eq("id", id)
    setItems(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    router.refresh()
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-20 text-center">
        <BellOff className="h-10 w-10 text-muted-foreground/40 mb-3" />
        <p className="text-muted-foreground">No notifications yet.</p>
      </div>
    )
  }

  const unread = items.filter(n => !n.read).length

  return (
    <div className="space-y-3">
      {unread > 0 && (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={markAllRead} disabled={loading}>
            <CheckCheck className="h-4 w-4" /> Mark all as read
          </Button>
        </div>
      )}
      <div className="rounded-xl border bg-card divide-y overflow-hidden">
        {items.map(n => (
          <div
            key={n.id}
            className={cn("flex items-start gap-4 px-5 py-4 transition-colors", !n.read && "bg-blue-50/50 dark:bg-blue-950/20")}
          >
            <span className="text-xl mt-0.5">{typeIcon[n.type] ?? "🔔"}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">{typeLabel[n.type] ?? n.type}</p>
              <p className="text-sm">{n.message}</p>
              <p className="text-xs text-muted-foreground mt-1">{formatDate(n.created_at)}</p>
            </div>
            {!n.read && (
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                <button
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => markRead(n.id)}
                >
                  Mark read
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
