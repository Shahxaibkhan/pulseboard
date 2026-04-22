"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"

export function CreateSOPButton({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState("")
  const [readiness, setReadiness] = useState("0")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const router = useRouter()
  const supabase = createClient()

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.from("sops").insert({
      project_id: projectId,
      name: name.trim(),
      readiness: parseInt(readiness) || 0,
      start_date: startDate || null,
      end_date: endDate || null,
    })
    setLoading(false)
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return }
    toast({ title: "SOP created" })
    setOpen(false)
    setName(""); setReadiness("0"); setStartDate(""); setEndDate("")
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4" /> Add SOP</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Add SOP</DialogTitle></DialogHeader>
        <form onSubmit={handleCreate} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>SOP Name *</Label>
            <Input placeholder="e.g. Application In, CAFA, Disbursement…" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Readiness % (business sign-off)</Label>
            <Input type="number" min={0} max={100} value={readiness} onChange={e => setReadiness(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Adding…</> : "Add SOP"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
