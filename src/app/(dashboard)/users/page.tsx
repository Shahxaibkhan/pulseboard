import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AppUser } from "@/types"
import { UserManagement } from "@/components/users/user-management"

export default async function UsersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: userProfile } = await supabase.from("app_users").select("role").eq("id", user?.id ?? "").single()
  if (userProfile?.role !== "ADMIN") redirect("/")

  const { data: users } = await supabase.from("app_users").select("*").order("created_at")

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
        <p className="text-sm text-muted-foreground">{users?.length ?? 0} users</p>
      </div>
      <UserManagement users={users as AppUser[] ?? []} />
    </div>
  )
}
