import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Sidebar } from "@/components/layout/sidebar"
import { Topbar } from "@/components/layout/topbar"
import { AppUser } from "@/types"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Fetch user profile
  const { data: appUser } = await supabase
    .from("app_users")
    .select("*")
    .eq("id", user.id)
    .single()

  // Count unread notifications
  const { count: unreadCount } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("read", false)

  const profile: AppUser = appUser ?? {
    id: user.id,
    email: user.email ?? "",
    name: user.email?.split("@")[0] ?? "User",
    role: "VIEWER",
    created_at: new Date().toISOString(),
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar user={profile} unreadCount={unreadCount ?? 0} />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6 relative">
          {children}
        </main>
      </div>
    </div>
  )
}
