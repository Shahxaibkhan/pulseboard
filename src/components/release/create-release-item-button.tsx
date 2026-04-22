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

export function CreateReleaseItemButton({ releaseId }: { releaseId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState("")
  const [type, setType] = useState("FEATURE")
  const [status, setStatus] = useState("PENDING")
  const [owner, setOwner] = useState("")
  const router = useRouter()
  const supabase = createClient()

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.from("release_items").insert({
      release_id: releaseId,
      name: name.trim(), type, status,
      owner: owner.trim() || null,
    })
    setLoading(false)
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return }
    toast({ title: "Item added" })
    setOpen(false)
    setName(""); setType("FEATURE"); setStatus("PENDING"); setOwner("")
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="h-4 w-4" /> Add Item</Button></DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Add Release Item</DialogTitle></DialogHeader>
        <form onSubmit={handleCreate} className="space-y-4 py-2">
          <div className="space-y-2"><Label>Item Name *</Label><Input placeholder="e.g. E-Sign Integration, Bug Fix #123…" value={name} onChange={e => setName(e.target.value)} required /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="FEATURE">Feature</SelectItem>
                  <SelectItem value="BUG">Bug Fix</SelectItem>
                  <SelectItem value="IMPROVEMENT">Improvement</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="DONE">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2"><Label>Owner / Team</Label><Input placeholder="e.g. Vendor, Dev, Frontend…" value={owner} onChange={e => setOwner(e.target.value)} /></div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Adding…</> : "Add Item"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
