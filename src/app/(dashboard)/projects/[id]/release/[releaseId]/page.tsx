import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { ReleaseItem } from "@/types"
import { StatusBadge } from "@/components/shared/status-badge"
import { CreateReleaseItemButton } from "@/components/release/create-release-item-button"
import { ReleaseItemActions } from "@/components/release/release-item-actions"
import { Badge } from "@/components/ui/badge"
import { ProgressBar } from "@/components/shared/progress-bar"
import { ArrowLeft, Package } from "lucide-react"
import Link from "next/link"
import { formatDate } from "@/lib/utils"

export default async function ReleaseDetailPage({ params }: { params: Promise<{ id: string; releaseId: string }> }) {
  const { id, releaseId } = await params
  const supabase = await createClient()

  const { data: release } = await supabase
    .from("releases")
    .select("*")
    .eq("id", releaseId)
    .single()

  if (!release) notFound()

  const { data: items } = await supabase
    .from("release_items")
    .select("*")
    .eq("release_id", releaseId)
    .order("created_at")

  const { data: userAuth } = await supabase.auth.getUser()
  const { data: userProfile } = await supabase.from("app_users").select("role").eq("id", userAuth.user?.id ?? "").single()
  const canEdit = ["ADMIN", "PM"].includes(userProfile?.role ?? "")

  const typeColor: Record<string, string> = {
    FEATURE: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    BUG: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    IMPROVEMENT: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  }

  return (
    <div className="space-y-6 animate-in">
      <div>
        <Link href={`/projects/${id}/release`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Release Plan
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{release.name}</h1>
              <StatusBadge status={release.status} />
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-1 text-sm text-muted-foreground">
              {release.vendor_name && <span>Vendor: <strong>{release.vendor_name}</strong></span>}
              {release.release_date && <span>Date: {formatDate(release.release_date)}</span>}
            </div>
          </div>
          {canEdit && <CreateReleaseItemButton releaseId={releaseId} />}
        </div>
        <div className="mt-4 max-w-sm">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-semibold">{release.progress}%</span>
          </div>
          <ProgressBar value={release.progress} showLabel={false} size="lg" />
        </div>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="font-semibold">Release Items <span className="text-sm font-normal text-muted-foreground ml-1">({items?.length ?? 0})</span></h2>
        </div>
        {!items || items.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>No items yet. Add features, bugs, or improvements.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left px-6 py-3 font-medium text-muted-foreground">Item Name</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Owner</th>
                  {canEdit && <th className="w-12 px-4 py-3" />}
                </tr>
              </thead>
              <tbody className="divide-y">
                {(items as ReleaseItem[]).map(item => (
                  <tr key={item.id} className="hover:bg-muted/20 transition-colors group">
                    <td className="px-6 py-4 font-medium">{item.name}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${typeColor[item.type] ?? ""}`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="px-4 py-4"><StatusBadge status={item.status} /></td>
                    <td className="px-4 py-4 text-muted-foreground">{item.owner ?? "—"}</td>
                    {canEdit && (
                      <td className="px-4 py-4 text-right">
                        <ReleaseItemActions item={item} />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
