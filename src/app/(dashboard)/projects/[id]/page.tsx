import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { StatusBadge } from "@/components/shared/status-badge"
import { formatDate } from "@/lib/utils"
import { ProjectActions } from "@/components/projects/project-actions"
import { Calendar, User, FileText, Zap, Package, ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: project } = await supabase
    .from("projects")
    .select("*, owner:app_users(id, name, email)")
    .eq("id", id)
    .single()

  if (!project) notFound()

  // Quick counts for each module
  const [{ count: sopCount }, { count: automationCount }, { count: releaseCount }] = await Promise.all([
    supabase.from("sops").select("id", { count: "exact", head: true }).eq("project_id", id),
    supabase.from("automations").select("id", { count: "exact", head: true }).eq("project_id", id),
    supabase.from("releases").select("id", { count: "exact", head: true }).eq("project_id", id),
  ])

  const { data: userAuth } = await supabase.auth.getUser()
  const { data: userProfile } = await supabase.from("app_users").select("role").eq("id", userAuth.user?.id ?? "").single()
  const canEdit = ["ADMIN", "PM"].includes(userProfile?.role ?? "")

  const { data: allUsers } = await supabase.from("app_users").select("id, name, email").order("name")

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
            <StatusBadge status={project.status} />
          </div>
          {project.description && (
            <p className="text-muted-foreground max-w-2xl">{project.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {project.owner && (
              <span className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                {(project.owner as { name?: string })?.name}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(project.start_date)} — {formatDate(project.end_date)}
            </span>
          </div>
        </div>
        {canEdit && <ProjectActions project={project} users={allUsers ?? []} />}
      </div>

      {/* Module Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ModuleCard
          href={`/projects/${id}/sop`}
          icon={FileText}
          title="SOP Tracking"
          description="Business processes and subtask management"
          count={sopCount ?? 0}
          countLabel="SOPs"
          color="blue"
        />
        <ModuleCard
          href={`/projects/${id}/automation`}
          icon={Zap}
          title="Automation"
          description="Technical integrations and phase tracking"
          count={automationCount ?? 0}
          countLabel="integrations"
          color="purple"
        />
        <ModuleCard
          href={`/projects/${id}/release`}
          icon={Package}
          title="Release Plan"
          description="Vendor releases and feature delivery"
          count={releaseCount ?? 0}
          countLabel="releases"
          color="green"
        />
      </div>
    </div>
  )
}

function ModuleCard({
  href, icon: Icon, title, description, count, countLabel, color
}: {
  href: string; icon: React.ComponentType<{ className?: string }>
  title: string; description: string; count: number; countLabel: string
  color: "blue" | "purple" | "green"
}) {
  const colorMap = {
    blue: "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400",
    purple: "bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400",
    green: "bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400",
  }

  return (
    <Link href={href}>
      <Card className="group hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-200 cursor-pointer h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colorMap[color]}`}>
              <Icon className="h-5 w-5" />
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
          </div>
          <CardTitle className="text-base mt-2">{title}</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground mb-3">{description}</p>
          <p className="text-2xl font-bold">{count} <span className="text-sm font-normal text-muted-foreground">{countLabel}</span></p>
        </CardContent>
      </Card>
    </Link>
  )
}
