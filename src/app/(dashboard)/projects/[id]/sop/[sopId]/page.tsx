import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { SOPSubtask, AppUser } from "@/types"
import { computeSOPProgress, isDelayed, formatDate } from "@/lib/utils"
import { ProgressBar } from "@/components/shared/progress-bar"
import { StatusBadge } from "@/components/shared/status-badge"
import { CreateSubtaskButton } from "@/components/sop/create-subtask-button"
import { SubtaskActions } from "@/components/sop/subtask-actions"
import { InlineProgressEdit } from "@/components/sop/inline-progress-edit"
import { AlertTriangle, Lock, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function SOPDetailPage({
  params
}: { params: Promise<{ id: string; sopId: string }> }) {
  const { id, sopId } = await params
  const supabase = await createClient()

  const { data: sop } = await supabase
    .from("sops")
    .select("*")
    .eq("id", sopId)
    .single()

  if (!sop) notFound()

  const { data: subtasks } = await supabase
    .from("sop_subtasks")
    .select("*, assigned_user:app_users(id, name, email), dependency:sop_subtasks!depends_on(id, name, progress)")
    .eq("sop_id", sopId)
    .order("created_at")

  const { data: allUsers } = await supabase.from("app_users").select("id, name, email, role")

  const { data: userAuth } = await supabase.auth.getUser()
  const { data: userProfile } = await supabase.from("app_users").select("role").eq("id", userAuth.user?.id ?? "").single()
  const canEdit = ["ADMIN", "PM", "TEAM_MEMBER"].includes(userProfile?.role ?? "")

  const enrichedSubtasks = (subtasks ?? []).map(task => {
    const raw = task.dependency
    const dep = (Array.isArray(raw) ? raw[0] : raw) as { id?: string; name?: string; progress?: number } | null
    const isBlocked = dep != null && (dep.progress ?? 0) < 100
    const delayed = isDelayed(task.end_date, task.progress)
    return { ...task, dependency: dep, isBlocked, is_delayed: delayed }
  })

  const sopProgress = computeSOPProgress(enrichedSubtasks)

  return (
    <div className="space-y-6 animate-in">
      {/* Back + Header */}
      <div>
        <Link href={`/projects/${id}/sop`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to SOP Dashboard
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{sop.name}</h1>
            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
              <span>Readiness: <strong>{sop.readiness}%</strong></span>
              {sop.end_date && <span>Due: {formatDate(sop.end_date)}</span>}
            </div>
          </div>
          {canEdit && <CreateSubtaskButton sopId={sopId} users={allUsers as AppUser[] ?? []} allSubtasks={enrichedSubtasks as SOPSubtask[]} />}
        </div>

        {/* Progress bar */}
        <div className="mt-4 max-w-sm">
          <div className="flex items-center justify-between mb-1 text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-semibold">{sopProgress}%</span>
          </div>
          <ProgressBar value={sopProgress} showLabel={false} size="lg" />
        </div>
      </div>

      {/* Dependencies note */}
      {enrichedSubtasks.some(t => t.isBlocked) && (
        <div className="flex items-center gap-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          <Lock className="h-4 w-4 shrink-0" />
          Some tasks are blocked by incomplete dependencies. They cannot be marked as completed until their dependency is done.
        </div>
      )}

      {/* Subtask Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="font-semibold">Subtasks</h2>
        </div>
        {enrichedSubtasks.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <p>No subtasks yet. Add the first task for this SOP.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left px-6 py-3 font-medium text-muted-foreground">Task Name</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Department</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Assigned To</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground w-44">Progress</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Dependency</th>
                  {canEdit && <th className="w-12 px-4 py-3" />}
                </tr>
              </thead>
              <tbody className="divide-y">
                {enrichedSubtasks.map(task => (
                  <tr
                    key={task.id}
                    className={`hover:bg-muted/20 transition-colors group ${task.isBlocked ? "opacity-80" : ""}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {task.isBlocked && <Lock className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                        <div>
                          <p className="font-medium">{task.name}</p>
                          {task.remarks && <p className="text-xs text-muted-foreground">{task.remarks}</p>}
                          {task.is_delayed && (
                            <span className="inline-flex items-center gap-0.5 text-xs text-red-600 dark:text-red-400">
                              <AlertTriangle className="h-3 w-3" /> Delayed
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">{task.department ?? "—"}</td>
                    <td className="px-4 py-4">
                      {task.assigned_user ? (
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-700 dark:text-blue-300 text-xs font-bold">
                            {(task.assigned_user as { name?: string })?.name?.[0]?.toUpperCase()}
                          </div>
                          <span>{(task.assigned_user as { name?: string })?.name}</span>
                        </div>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-4">
                      {canEdit ? (
                        <InlineProgressEdit taskId={task.id} currentProgress={task.progress} isBlocked={task.isBlocked} table="sop_subtasks" />
                      ) : (
                        <ProgressBar value={task.progress} />
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={task.status} />
                    </td>
                    <td className="px-4 py-4 text-xs">
                      {task.dependency ? (
                        <span className={`font-medium ${ (task.dependency as { progress?: number }).progress === 100 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                          Depends on:{" "}
                          <span className="text-foreground">{(task.dependency as { name?: string }).name ?? "—"}</span>
                        </span>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    {canEdit && (
                      <td className="px-4 py-4 text-right">
                        <SubtaskActions
                          task={task as SOPSubtask}
                          users={allUsers as AppUser[] ?? []}
                          allSubtasks={enrichedSubtasks as SOPSubtask[]}
                        />
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
