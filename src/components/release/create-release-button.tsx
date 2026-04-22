"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"

export function CreateReleaseButton({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState("")
  const [releaseDate, setReleaseDate] = useState("")
  const [status, setStatus] = useState("PLANNED")
  const [vendorName, setVendorName] = useState("")
  const [progress, setProgress] = useState("0")
  const router = useRouter()
  const supabase = createClient()

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.from("releases").insert({
      project_id: projectId,
      name: name.trim(),
      release_date: releaseDate || null,
      status,
      vendor_name: vendorName.trim() || null,
      progress: parseInt(progress) || 0,
    })
    setLoading(false)
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return }
    toast({ title: "Release created" })
    setOpen(false)
    setName(""); setReleaseDate(""); setStatus("PLANNED"); setVendorName(""); setProgress("0")
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="h-4 w-4" /> New Release</Button></DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Create Release</DialogTitle></DialogHeader>
        <form onSubmit={handleCreate} className="space-y-4 py-2">
          <div className="space-y-2"><Label>Release Name *</Label><Input placeholder="e.g. Release 1, April Release…" value={name} onChange={e => setName(e.target.value)} required /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Release Date</Label><Input type="date" value={releaseDate} onChange={e => setReleaseDate(e.target.value)} /></div>
            <div className="space-y-2"><Label>Progress %</Label><Input type="number" min={0} max={100} value={progress} onChange={e => setProgress(e.target.value)} /></div>
          </div>
          <div className="space-y-2"><Label>Vendor / Team</Label><Input placeholder="e.g. XYZ Vendor" value={vendorName} onChange={e => setVendorName(e.target.value)} /></div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="PLANNED">Planned</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating…</> : "Create"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
