import Link from "next/link"
import { Project } from "@/types"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { StatusBadge } from "@/components/shared/status-badge"
import { formatDate, isDelayed } from "@/lib/utils"
import { Calendar, User, ArrowRight, AlertTriangle } from "lucide-react"

interface ProjectCardProps {
  project: Project
}

export function ProjectCard({ project }: ProjectCardProps) {
  const delayed = isDelayed(project.end_date, 50) // rough check

  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="group relative hover:shadow-lg hover:shadow-blue-500/10 hover:border-blue-400/30 dark:hover:border-blue-500/30 transition-all duration-300 cursor-pointer h-full overflow-hidden">
        {/* Hover glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-400/0 group-hover:from-blue-500/5 group-hover:to-blue-400/3 transition-all duration-300 pointer-events-none rounded-xl" />
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-base leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors truncate">
                  {project.name}
                </h3>
                {delayed && project.status !== "COMPLETED" && (
                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                )}
              </div>
              {project.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
              )}
            </div>
            <StatusBadge status={project.status} />
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          {/* Owner */}
          {project.owner && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{(project.owner as { name?: string })?.name ?? "—"}</span>
            </div>
          )}

          {/* Dates */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span>{formatDate(project.start_date)} → {formatDate(project.end_date)}</span>
          </div>

          {/* Arrow */}
          <div className="flex justify-end">
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-blue-500 group-hover:translate-x-1 transition-all duration-200" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
