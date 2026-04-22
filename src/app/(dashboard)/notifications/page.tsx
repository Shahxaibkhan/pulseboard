import { createClient } from "@/lib/supabase/server"
import { Notification } from "@/types"
import { NotificationList } from "@/components/notifications/notification-list"
import { Bell } from "lucide-react"

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user?.id ?? "")
    .order("created_at", { ascending: false })
    .limit(50)

  return (
    <div className="space-y-6 animate-in max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground">{(notifications ?? []).filter(n => !n.read).length} unread</p>
        </div>
      </div>
      <NotificationList notifications={notifications as Notification[] ?? []} />
    </div>
  )
}
