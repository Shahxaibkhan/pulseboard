import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Release } from "@/types"
import { isDelayed, formatDate } from "@/lib/utils"
import { ProgressBar } from "@/components/shared/progress-bar"
import { StatusBadge } from "@/components/shared/status-badge"
import { CreateReleaseButton } from "@/components/release/create-release-button"
import { ReleaseActions } from "@/components/release/release-actions"
import { ReleaseCharts } from "@/components/release/release-charts"
import Link from "next/link"
import { AlertTriangle, Package } from "lucide-react"

export default async function ReleasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: project } = await supabase.from("projects").select("name").eq("id", id).single()
  if (!project) notFound()

  const { data: releases } = await supabase
    .from("releases")
    .select("*, items:release_items(id)")
    .eq("project_id", id)
    .order("release_date", { ascending: true, nullsFirst: false })

  const { data: userAuth } = await supabase.auth.getUser()
  const { data: userProfile } = await supabase.from("app_users").select("role").eq("id", userAuth.user?.id ?? "").single()
  const canEdit = ["ADMIN", "PM"].includes(userProfile?.role ?? "")

  const enriched = (releases ?? []).map(r => ({
    ...r,
    is_delayed: isDelayed(r.release_date, r.progress),
    item_count: (r.items ?? []).length,
  }))

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Release Plan</h1>
          <p className="text-sm text-muted-foreground">{project.name}</p>
        </div>
        {canEdit && <CreateReleaseButton projectId={id} />}
      </div>

      {enriched.length > 0 && <ReleaseCharts releases={enriched as Release[]} />}

      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="font-semibold">Releases</h2>
        </div>

        {enriched.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>No releases yet. Create the first release.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left px-6 py-3 font-medium text-muted-foreground">Release</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Vendor</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Release Date</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground w-44">Progress</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Delay</th>
                  {canEdit && <th className="w-12 px-4 py-3" />}
                </tr>
              </thead>
              <tbody className="divide-y">
                {enriched.map(release => (
                  <tr key={release.id} className="hover:bg-muted/20 transition-colors group">
                    <td className="px-6 py-4">
                      <Link
                        href={`/projects/${id}/release/${release.id}`}
                        className="font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        {release.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">{release.item_count} items</p>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">{release.vendor_name ?? "—"}</td>
                    <td className="px-4 py-4 text-muted-foreground">{formatDate(release.release_date)}</td>
                    <td className="px-4 py-4"><StatusBadge status={release.status} /></td>
                    <td className="px-4 py-4"><ProgressBar value={release.progress} /></td>
                    <td className="px-4 py-4 text-center">
                      {release.is_delayed ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-2.5 py-0.5 text-xs font-semibold">
                          <AlertTriangle className="h-3 w-3" /> Yes
                        </span>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                    {canEdit && (
                      <td className="px-4 py-4 text-right">
                        <ReleaseActions release={release as Release} projectId={id} />
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
