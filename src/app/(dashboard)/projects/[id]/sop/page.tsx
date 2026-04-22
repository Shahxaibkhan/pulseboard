import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { SOP } from "@/types"
import { computeSOPProgress, isDelayed } from "@/lib/utils"
import { ProgressBar } from "@/components/shared/progress-bar"
import { StatusIcon } from "@/components/shared/status-icon"
import { StatusBadge } from "@/components/shared/status-badge"
import { CreateSOPButton } from "@/components/sop/create-sop-button"
import { SOPActions } from "@/components/sop/sop-actions"
import { SOPCharts } from "@/components/sop/sop-charts"
import Link from "next/link"
import { AlertTriangle, CheckCircle2, Clock, FileText } from "lucide-react"

export default async function SOPDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: project } = await supabase.from("projects").select("name").eq("id", id).single()
  if (!project) notFound()

  const { data: sopsRaw } = await supabase
    .from("sops")
    .select("*, subtasks:sop_subtasks(id, progress, status, end_date)")
    .eq("project_id", id)
    .order("created_at")

  const { data: userAuth } = await supabase.auth.getUser()
  const { data: userProfile } = await supabase.from("app_users").select("role").eq("id", userAuth.user?.id ?? "").single()
  const canEdit = ["ADMIN", "PM", "TEAM_MEMBER"].includes(userProfile?.role ?? "")

  const sops: (SOP & { computedProgress: number; delayed: boolean })[] = (sopsRaw ?? []).map(sop => {
    const progress = computeSOPProgress(sop.subtasks ?? [])
    const delayed = isDelayed(sop.end_date, progress)
    return { ...sop, computedProgress: progress, delayed }
  })

  const totalDelayed = sops.filter(s => s.delayed).length
  const totalComplete = sops.filter(s => s.computedProgress === 100).length
  const avgProgress = sops.length > 0
    ? Math.round(sops.reduce((sum, s) => sum + s.computedProgress, 0) / sops.length)
    : 0

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">SOP Tracking</h1>
          <p className="text-sm text-muted-foreground">{project.name}</p>
        </div>
        {canEdit && <CreateSOPButton projectId={id} />}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FileText} label="Total SOPs" value={sops.length} color="blue" />
        <StatCard icon={CheckCircle2} label="Completed" value={totalComplete} color="green" />
        <StatCard icon={AlertTriangle} label="Delayed" value={totalDelayed} color="red" />
        <StatCard icon={Clock} label="Avg Progress" value={`${avgProgress}%`} color="purple" />
      </div>

      {/* Charts */}
      {sops.length > 0 && <SOPCharts sops={sops} />}

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="font-semibold">Business Processes</h2>
        </div>

        {sops.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>No SOPs yet. Add your first business process.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-blue-100/60 dark:border-blue-900/30 bg-blue-50/40 dark:bg-blue-950/20">
                  <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">SOP Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-48">Progress</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Readiness</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Delay</th>
                  {canEdit && <th className="w-12 px-4 py-3" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-100/40 dark:divide-blue-900/20">
                {sops.map(sop => (
                  <tr key={sop.id} className="hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-colors group">
                    <td className="px-6 py-4">
                      <Link
                        href={`/projects/${id}/sop/${sop.id}`}
                        className="font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        {sop.name}
                      </Link>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {(sop.subtasks ?? []).length} subtask{(sop.subtasks ?? []).length !== 1 ? "s" : ""}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <ProgressBar value={sop.computedProgress} />
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">{sop.readiness}%</td>
                    <td className="px-4 py-4 text-center">
                      <StatusIcon progress={sop.computedProgress} isDelayed={sop.delayed} />
                    </td>
                    <td className="px-4 py-4 text-center">
                      {sop.delayed ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-2.5 py-0.5 text-xs font-semibold">
                          <AlertTriangle className="h-3 w-3" /> Yes
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    {canEdit && (
                      <td className="px-4 py-4 text-right">
                        <SOPActions sop={sop} projectId={id} />
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

function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ComponentType<{ className?: string }>; label: string; value: string | number; color: string
}) {
  const colorMap: Record<string, { icon: string; glow: string; gradient: string }> = {
    blue: { icon: "text-blue-500", glow: "shadow-blue-500/20", gradient: "from-blue-500/10 to-blue-400/5" },
    green: { icon: "text-emerald-500", glow: "shadow-emerald-500/20", gradient: "from-emerald-500/10 to-emerald-400/5" },
    red: { icon: "text-red-500", glow: "shadow-red-500/20", gradient: "from-red-500/10 to-red-400/5" },
    purple: { icon: "text-purple-500", glow: "shadow-purple-500/20", gradient: "from-purple-500/10 to-purple-400/5" },
  }
  const c = colorMap[color] ?? colorMap.blue
  return (
    <div className={`relative rounded-xl border bg-card p-4 flex items-center gap-3 shadow-sm ${c.glow} stat-card-accent overflow-hidden`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${c.gradient} pointer-events-none`} />
      <div className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/50 dark:bg-white/5 border border-white/10`}>
        <Icon className={`h-5 w-5 ${c.icon}`} />
      </div>
      <div className="relative">
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}
