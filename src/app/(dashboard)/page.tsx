import { createClient } from "@/lib/supabase/server"
import { Project } from "@/types"
import { ProjectCard } from "@/components/projects/project-card"
import { CreateProjectButton } from "@/components/projects/create-project-button"
import { FolderKanban } from "lucide-react"

export default async function ProjectsPage() {
  const supabase = await createClient()

  const { data: projects } = await supabase
    .from("projects")
    .select("*, owner:app_users(id, name, email, role)")
    .order("created_at", { ascending: false })

  const { data: userData } = await supabase.auth.getUser()
  const { data: userProfile } = await supabase
    .from("app_users")
    .select("role")
    .eq("id", userData.user?.id ?? "")
    .single()

  const { data: allUsers } = await supabase
    .from("app_users")
    .select("id, name, email, role")
    .order("name")

  const canCreate = ["ADMIN", "PM"].includes(userProfile?.role ?? "")

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">Projects</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {projects?.length ?? 0} project{(projects?.length ?? 0) !== 1 ? "s" : ""} total
          </p>
        </div>
        {canCreate && <CreateProjectButton users={allUsers ?? []} currentUserId={userData.user?.id ?? ""} />}
      </div>

      {/* Status filter tabs */}
      <ProjectGrid projects={projects as Project[] ?? []} />
    </div>
  )
}

function ProjectGrid({ projects }: { projects: Project[] }) {
  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-blue-200/50 dark:border-blue-800/30 py-20 text-center bg-blue-50/20 dark:bg-blue-950/10">
        <FolderKanban className="h-12 w-12 text-blue-400/30 mb-4" />
        <h3 className="font-semibold text-lg mb-1">No projects yet</h3>
        <p className="text-sm text-muted-foreground">Create your first project to get started.</p>
      </div>
    )
  }

  const active = projects.filter(p => p.status === "ACTIVE")
  const onHold = projects.filter(p => p.status === "ON_HOLD")
  const completed = projects.filter(p => p.status === "COMPLETED")

  return (
    <div className="space-y-8">
      {active.length > 0 && (
        <Section title="Active" count={active.length}>
          {active.map(p => <ProjectCard key={p.id} project={p} />)}
        </Section>
      )}
      {onHold.length > 0 && (
        <Section title="On Hold" count={onHold.length}>
          {onHold.map(p => <ProjectCard key={p.id} project={p} />)}
        </Section>
      )}
      {completed.length > 0 && (
        <Section title="Completed" count={completed.length}>
          {completed.map(p => <ProjectCard key={p.id} project={p} />)}
        </Section>
      )}
    </div>
  )
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.12em]">{title}</h2>
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[10px] font-bold px-1.5">
          {count}
        </span>
        <div className="flex-1 h-px bg-blue-100/60 dark:bg-blue-900/20" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {children}
      </div>
    </div>
  )
}
