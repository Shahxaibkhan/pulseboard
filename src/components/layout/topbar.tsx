"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"

interface Crumb { label: string; href: string }

export function Topbar({ title }: { title?: string }) {
  const pathname = usePathname()
  const crumbs = buildCrumbs(pathname)

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-blue-100 dark:border-blue-900/30 bg-white/70 dark:bg-[#080e1e]/80 backdrop-blur-xl px-6">
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/40 to-transparent" />
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground flex-1 min-w-0">
        <Link href="/" className="hover:text-blue-500 transition-colors shrink-0">
          <Home className="h-3.5 w-3.5" />
        </Link>
        {crumbs.map((crumb, i) => (
          <span key={crumb.href} className="flex items-center gap-1 min-w-0">
            <ChevronRight className="h-3 w-3 shrink-0 text-blue-400/50" />
            {i === crumbs.length - 1 ? (
              <span className="font-semibold text-foreground truncate">{title ?? crumb.label}</span>
            ) : (
              <Link href={crumb.href} className="hover:text-blue-500 transition-colors truncate">
                {crumb.label}
              </Link>
            )}
          </span>
        ))}
      </nav>
    </header>
  )
}

function buildCrumbs(pathname: string): Crumb[] {
  const parts = pathname.split("/").filter(Boolean)
  const crumbs: Crumb[] = []
  let path = ""

  for (const part of parts) {
    path += `/${part}`
    const label = labelFor(part)
    crumbs.push({ label, href: path })
  }

  return crumbs
}

function labelFor(segment: string): string {
  const map: Record<string, string> = {
    projects: "Projects",
    sop: "SOP Tracking",
    automation: "Automation",
    release: "Release Plan",
    analytics: "Analytics",
    users: "Users",
    import: "Import",
    notifications: "Notifications",
  }
  return map[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1)
}
