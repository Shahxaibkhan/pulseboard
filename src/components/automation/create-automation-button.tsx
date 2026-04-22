"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Loader2, Zap } from "lucide-react"
import { toast } from "@/hooks/use-toast"

const PHASES = ["VENDOR", "DEVELOPMENT", "SIT", "UAT", "GO_LIVE"]
const PHASE_LABELS: Record<string, string> = {
  VENDOR: "Vendor Finalization", DEVELOPMENT: "Development",
  SIT: "SIT", UAT: "UAT", GO_LIVE: "Go-Live"
}

export function CreateAutomationButton({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState("")
  const [phases, setPhases] = useState<Array<{
    phase: string; owner: string; startDate: string; endDate: string
  }>>(PHASES.map(p => ({ phase: p, owner: "", startDate: "", endDate: "" })))
  const router = useRouter()
  const supabase = createClient()

  function updatePhase(i: number, field: string, value: string) {
    setPhases(prev => prev.map((p, idx) => idx === i ? { ...p, [field]: value } : p))
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)

    const { data: auto, error: autoErr } = await supabase
      .from("automations").insert({ project_id: projectId, name: name.trim() }).select().single()

    if (autoErr || !auto) {
      toast({ title: "Error", description: autoErr?.message, variant: "destructive" })
      setLoading(false)
      return
    }

    const phasesToInsert = phases.filter(p => p.owner || p.startDate || p.endDate).map(p => ({
      automation_id: auto.id,
      phase: p.phase,
      owner: p.owner.trim() || null,
      progress: 0,
      start_date: p.startDate || null,
      end_date: p.endDate || null,
    }))

    if (phasesToInsert.length > 0) {
      await supabase.from("automation_phases").insert(phasesToInsert)
    }

    setLoading(false)
    toast({ title: "Integration added" })
    setOpen(false)
    setName("")
    setPhases(PHASES.map(p => ({ phase: p, owner: "", startDate: "", endDate: "" })))
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4" /> Add Integration</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Add Integration</DialogTitle></DialogHeader>
        <form onSubmit={handleCreate} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Integration Name *</Label>
            <Input placeholder="e.g. E-Sign, OCR, Payment Gateway…" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div>
            <Label className="mb-2 block">Phases</Label>
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/30 border-b">
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Phase</th>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Owner</th>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Start</th>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">End</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {phases.map((p, i) => (
                    <tr key={p.phase}>
                      <td className="px-4 py-2 font-medium">{PHASE_LABELS[p.phase]}</td>
                      <td className="px-4 py-2">
                        <Input placeholder="Owner/Team" className="h-8 text-xs" value={p.owner} onChange={e => updatePhase(i, "owner", e.target.value)} />
                      </td>
                      <td className="px-4 py-2">
                        <Input type="date" className="h-8 text-xs" value={p.startDate} onChange={e => updatePhase(i, "startDate", e.target.value)} />
                      </td>
                      <td className="px-4 py-2">
                        <Input type="date" className="h-8 text-xs" value={p.endDate} onChange={e => updatePhase(i, "endDate", e.target.value)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Fill in only the phases that apply. Empty rows will be skipped.</p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Adding…</> : "Add Integration"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
