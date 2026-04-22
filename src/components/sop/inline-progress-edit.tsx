"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { ProgressBar } from "@/components/shared/progress-bar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Check, X } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface InlineProgressEditProps {
  taskId: string
  currentProgress: number
  isBlocked?: boolean
  table: "sop_subtasks" | "automation_phases"
}

export function InlineProgressEdit({ taskId, currentProgress, isBlocked, table }: InlineProgressEditProps) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(String(currentProgress))
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function save() {
    const progress = Math.max(0, Math.min(100, parseInt(value) || 0))
    if (isBlocked && progress === 100) {
      toast({ title: "Blocked", description: "Complete the dependency task first.", variant: "destructive" })
      return
    }
    setLoading(true)
    const status = progress === 0 ? "NOT_STARTED" : progress === 100 ? "COMPLETED" : "IN_PROGRESS"
    const { error } = await supabase.from(table).update({ progress, status }).eq("id", taskId)
    setLoading(false)
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return }
    setEditing(false)
    router.refresh()
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          type="number" min={0} max={100}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false) }}
          className="h-7 w-16 text-xs px-2"
          autoFocus
        />
        <Button size="icon" className="h-7 w-7" onClick={save} disabled={loading}><Check className="h-3 w-3" /></Button>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditing(false)}><X className="h-3 w-3" /></Button>
      </div>
    )
  }

  return (
    <button
      onClick={() => { if (!isBlocked) { setValue(String(currentProgress)); setEditing(true) } }}
      className={cn("w-full text-left", isBlocked ? "cursor-not-allowed opacity-70" : "cursor-pointer hover:opacity-80")}
      title={isBlocked ? "Dependency not complete" : "Click to edit progress"}
    >
      <ProgressBar value={currentProgress} />
    </button>
  )
}
