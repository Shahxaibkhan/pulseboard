import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { isDelayed, phaseLabel, formatDate } from "@/lib/utils"
import { ProgressBar } from "@/components/shared/progress-bar"
import { CreateAutomationButton } from "@/components/automation/create-automation-button"
import { AutomationActions } from "@/components/automation/automation-actions"
import { AutomationCharts } from "@/components/automation/automation-charts"
import { InlineProgressEdit } from "@/components/sop/inline-progress-edit"
import { AlertTriangle, Zap } from "lucide-react"
import { Automation, AutomationPhaseRecord } from "@/types"

export default async function AutomationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: project } = await supabase.from("projects").select("name").eq("id", id).single()
  if (!project) notFound()

  const { data: automations } = await supabase
    .from("automations")
    .select("*, phases:automation_phases(*)")
    .eq("project_id", id)
    .order("created_at")

  const { data: userAuth } = await supabase.auth.getUser()
  const { data: userProfile } = await supabase.from("app_users").select("role").eq("id", userAuth.user?.id ?? "").single()
  const canEdit = ["ADMIN", "PM", "TEAM_MEMBER"].includes(userProfile?.role ?? "")

  const enriched = (automations ?? []).map(auto => ({
    ...auto,
    phases: (auto.phases ?? []).map((p: AutomationPhaseRecord) => ({
      ...p,
      is_delayed: isDelayed(p.end_date, p.progress),
    }))
  }))

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Automation Tracking</h1>
          <p className="text-sm text-muted-foreground">{project.name}</p>
        </div>
        {canEdit && <CreateAutomationButton projectId={id} />}
      </div>

      {enriched.length > 0 && <AutomationCharts automations={enriched} />}

      {enriched.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-20 text-center text-muted-foreground">
          <Zap className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>No automations yet. Add your first integration.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {enriched.map(auto => (
            <div key={auto.id} className="rounded-xl border bg-card overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b bg-muted/20">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-purple-500" />
                  <h3 className="font-semibold">{auto.name}</h3>
                  <span className="text-xs text-muted-foreground">({auto.phases.length} phases)</span>
                </div>
                {canEdit && <AutomationActions automation={auto as Automation} projectId={id} />}
              </div>

              {auto.phases.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">No phases added yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/10">
                        <th className="text-left px-6 py-3 font-medium text-muted-foreground">Phase</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground w-48">Progress</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Owner</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Dates</th>
                        <th className="text-center px-4 py-3 font-medium text-muted-foreground">Delay</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {auto.phases.map((phase: AutomationPhaseRecord & { is_delayed: boolean }) => (
                        <tr key={phase.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-6 py-3 font-medium">{phaseLabel(phase.phase)}</td>
                          <td className="px-4 py-3">
                            {canEdit
                              ? <InlineProgressEdit taskId={phase.id} currentProgress={phase.progress} table="automation_phases" />
                              : <ProgressBar value={phase.progress} />}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{phase.owner ?? "—"}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {formatDate(phase.start_date)} → {formatDate(phase.end_date)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {phase.is_delayed ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-2.5 py-0.5 text-xs font-semibold">
                                <AlertTriangle className="h-3 w-3" /> Yes
                              </span>
                            ) : <span className="text-xs text-muted-foreground">—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
