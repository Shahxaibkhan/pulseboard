import { createClient } from "@/lib/supabase/server"
import { computeSOPProgress, isDelayed } from "@/lib/utils"
import { AnalyticsCharts } from "@/components/analytics/analytics-charts"
import { BarChart3 } from "lucide-react"

export default async function AnalyticsPage() {
  const supabase = await createClient()

  const [
    { data: projects },
    { data: sops },
    { data: subtasks },
    { data: automations },
    { data: releases },
  ] = await Promise.all([
    supabase.from("projects").select("id, name, status").order("created_at"),
    supabase.from("sops").select("id, project_id, name, readiness, end_date").order("created_at"),
    supabase.from("sop_subtasks").select("id, sop_id, progress, status, depends_on, end_date"),
    supabase.from("automations").select("id, project_id, name, phases:automation_phases(progress, phase)"),
    supabase.from("releases").select("id, project_id, name, status, progress, release_date"),
  ])

  // SOP progress per SOP
  const sopWithProgress = (sops ?? []).map(sop => {
    const tasks = (subtasks ?? []).filter(t => t.sop_id === sop.id)
    const progress = computeSOPProgress(tasks)
    const delayed = isDelayed(sop.end_date, progress)
    return { ...sop, progress, delayed }
  })

  // Blocked tasks
  const blockedTasks = (subtasks ?? []).filter(t => {
    if (!t.depends_on) return false
    const dep = (subtasks ?? []).find(d => d.id === t.depends_on)
    return dep && dep.progress < 100 && t.progress < 100
  })

  // Project health (active projects, avg progress of their SOPs)
  const projectHealth = (projects ?? []).map(p => {
    const pSops = sopWithProgress.filter(s => s.project_id === p.id)
    const health = pSops.length > 0 ? Math.round(pSops.reduce((sum, s) => sum + s.progress, 0) / pSops.length) : 0
    return { name: p.name, health, status: p.status }
  })

  // Automation phase avg per integration
  const automationData = (automations ?? []).flatMap(auto =>
    (auto.phases ?? []).map((p: { progress: number; phase: string }) => ({
      integration: auto.name, phase: p.phase, progress: p.progress
    }))
  )

  const releaseData = (releases ?? []).map(r => ({
    name: r.name, progress: r.progress, status: r.status,
    delayed: isDelayed(r.release_date, r.progress)
  }))

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics & Reporting</h1>
        <p className="text-sm text-muted-foreground">Cross-project visibility</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="Total Projects" value={projects?.length ?? 0} />
        <SummaryCard label="Total SOPs" value={sops?.length ?? 0} />
        <SummaryCard label="Delayed SOPs" value={sopWithProgress.filter(s => s.delayed).length} danger />
        <SummaryCard label="Blocked Tasks" value={blockedTasks.length} danger />
      </div>

      <AnalyticsCharts
        sopData={sopWithProgress}
        projectHealth={projectHealth}
        automationData={automationData}
        releaseData={releaseData}
        blockedCount={blockedTasks.length}
      />
    </div>
  )
}

function SummaryCard({ label, value, danger }: { label: string; value: number; danger?: boolean }) {
  return (
    <div className={`rounded-xl border bg-card p-4 ${danger && value > 0 ? "border-red-200 dark:border-red-800" : ""}`}>
      <p className={`text-2xl font-bold ${danger && value > 0 ? "text-red-600 dark:text-red-400" : ""}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}
