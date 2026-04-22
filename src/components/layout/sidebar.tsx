"use client"

import Link from "next/link"
import { usePathname, useParams } from "next/navigation"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import {
  Activity, LayoutDashboard, FolderKanban, FileText,
  Zap, Package, BarChart3, Users, Bell, Upload,
  ChevronLeft, ChevronRight, LogOut, Moon, Sun, Settings
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { AppUser } from "@/types"

interface SidebarProps {
  user: AppUser
  unreadCount: number
}

const mainNav = [
  { href: "/", icon: LayoutDashboard, label: "Projects" },
  { href: "/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/notifications", icon: Bell, label: "Notifications", badge: true },
  { href: "/import", icon: Upload, label: "Import Data" },
  { href: "/users", icon: Users, label: "User Management", roles: ["ADMIN"] },
]

const projectNav = [
  { href: "", icon: FolderKanban, label: "Overview" },
  { href: "/sop", icon: FileText, label: "SOP Tracking" },
  { href: "/automation", icon: Zap, label: "Automation" },
  { href: "/release", icon: Package, label: "Release Plan" },
]

export function Sidebar({ user, unreadCount }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const params = useParams()
  const projectId = params?.id as string | undefined
  const supabase = createClient()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <aside
      className={cn(
        "relative flex flex-col h-full border-r transition-all duration-300 shrink-0",
        "bg-white/80 dark:bg-[#080e1e]/90 backdrop-blur-xl",
        "border-blue-100 dark:border-blue-900/30",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Top glow line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent" />

      {/* Logo */}
      <div className={cn("flex items-center gap-3 px-4 py-5 border-b border-blue-100 dark:border-blue-900/30", collapsed && "justify-center px-0")}>
        <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-500/30">
          <Activity className="h-5 w-5 text-white" />
          <div className="absolute inset-0 rounded-xl bg-blue-400/20 blur-sm" />
        </div>
        {!collapsed && (
          <div>
            <span className="text-base font-bold tracking-tight bg-gradient-to-r from-blue-600 to-blue-400 dark:from-blue-300 dark:to-blue-500 bg-clip-text text-transparent">PulseBoard</span>
            <div className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground font-medium">Operations Hub</div>
          </div>
        )}
      </div>

      {/* Main Nav */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-0.5 px-2">
        {mainNav.map(item => {
          if (item.roles && !item.roles.includes(user.role)) return null
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
          return (
            <NavItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              active={active}
              collapsed={collapsed}
              badge={item.badge ? unreadCount : 0}
            />
          )
        })}

        {/* Project sub-nav */}
        {projectId && (
          <>
            <div className={cn("pt-4 pb-2", !collapsed && "px-2")}>
              {!collapsed && <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Current Project</p>}
              {collapsed && <div className="border-t border-border" />}
            </div>
            {projectNav.map(item => {
              const href = `/projects/${projectId}${item.href}`
              const active = item.href === "" ? pathname === `/projects/${projectId}` : pathname.startsWith(href)
              return (
                <NavItem
                  key={href}
                  href={href}
                  icon={item.icon}
                  label={item.label}
                  active={active}
                  collapsed={collapsed}
                />
              )
            })}
          </>
        )}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-blue-100 dark:border-blue-900/30 p-2 space-y-1">
        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className={cn(
            "flex items-center gap-3 w-full rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-foreground transition-all",
            collapsed && "justify-center px-0"
          )}
        >
          {mounted && (theme === "dark" ? <Sun className="h-4 w-4 shrink-0" /> : <Moon className="h-4 w-4 shrink-0" />)}
          {mounted && !collapsed && <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>}
        </button>

        {/* User info */}
        <div className={cn("flex items-center gap-3 px-3 py-2 rounded-lg", collapsed && "justify-center px-0")}>
          <div className="relative h-7 w-7 shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold shadow shadow-blue-500/30">
            {user.name?.[0]?.toUpperCase() ?? "U"}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate">{user.name}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user.role.replace("_", " ")}</p>
            </div>
          )}
        </div>

        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-3 w-full rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-all",
            collapsed && "justify-center px-0"
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(v => !v)}
        className="absolute -right-3 top-20 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-blue-200 dark:border-blue-800/50 bg-white dark:bg-[#0d1830] shadow-md hover:shadow-blue-500/20 transition-all"
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>
    </aside>
  )
}

function NavItem({
  href, icon: Icon, label, active, collapsed, badge = 0
}: {
  href: string; icon: React.ComponentType<{ className?: string }>; label: string
  active: boolean; collapsed: boolean; badge?: number
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all relative group",
        active
          ? "bg-gradient-to-r from-blue-600/15 to-blue-400/5 dark:from-blue-500/20 dark:to-blue-400/5 text-blue-700 dark:text-blue-300 font-medium shadow-sm"
          : "text-muted-foreground hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-foreground",
        collapsed && "justify-center px-0"
      )}
    >
      {active && (
        <span className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-blue-500 shadow-sm shadow-blue-400/50" />
      )}
      <Icon className={cn("h-4 w-4 shrink-0 transition-all", active && "text-blue-500 dark:text-blue-400")} />
      {!collapsed && <span>{label}</span>}
      {badge > 0 && (
        <span className={cn(
          "absolute flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white px-1 shadow shadow-blue-500/40",
          collapsed ? "right-1 top-1" : "right-2"
        )}>
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </Link>
  )
}
