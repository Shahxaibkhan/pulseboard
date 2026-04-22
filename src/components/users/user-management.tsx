"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { AppUser, UserRole } from "@/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import { formatDate } from "@/lib/utils"
import { Loader2, Users } from "lucide-react"

export function UserManagement({ users }: { users: AppUser[] }) {
  const [updating, setUpdating] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  async function updateRole(userId: string, role: UserRole) {
    setUpdating(userId)
    const { error } = await supabase.from("app_users").update({ role }).eq("id", userId)
    setUpdating(null)
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return }
    toast({ title: "Role updated" })
    router.refresh()
  }

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-20 text-center">
        <Users className="h-10 w-10 text-muted-foreground/40 mb-3" />
        <p className="text-muted-foreground">No users found.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left px-6 py-3 font-medium text-muted-foreground">User</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Joined</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-700 dark:text-blue-300 text-sm font-bold">
                      {user.name?.[0]?.toUpperCase()}
                    </div>
                    <span className="font-medium">{user.name}</span>
                  </div>
                </td>
                <td className="px-4 py-4 text-muted-foreground">{user.email}</td>
                <td className="px-4 py-4 text-muted-foreground">{formatDate(user.created_at)}</td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <Select
                      value={user.role}
                      onValueChange={(role) => updateRole(user.id, role as UserRole)}
                      disabled={updating === user.id}
                    >
                      <SelectTrigger className="h-8 w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                        <SelectItem value="PM">Project Manager</SelectItem>
                        <SelectItem value="TEAM_MEMBER">Team Member</SelectItem>
                        <SelectItem value="VIEWER">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                    {updating === user.id && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
