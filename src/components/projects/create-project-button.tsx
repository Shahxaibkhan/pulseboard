"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface AppUserBasic { id: string; name: string; email: string }

export function CreateProjectButton({ users = [], currentUserId = "" }: { users?: AppUserBasic[]; currentUserId?: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [status, setStatus] = useState("ACTIVE")
  const [ownerId, setOwnerId] = useState(currentUserId)
  const router = useRouter()
  const supabase = createClient()

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)

    const { error } = await supabase.from("projects").insert({
      name: name.trim(),
      description: description.trim() || null,
      start_date: startDate || null,
      end_date: endDate || null,
      status,
      owner_id: ownerId || null,
    })

    setLoading(false)
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
      return
    }

    toast({ title: "Project created", description: `"${name}" has been created.`, variant: "default" })
    setOpen(false)
    resetForm()
    router.refresh()
  }

  function resetForm() {
    setName(""); setDescription(""); setStartDate(""); setEndDate(""); setStatus("ACTIVE"); setOwnerId(currentUserId)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleCreate} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="proj-name">Project Name *</Label>
            <Input id="proj-name" placeholder="e.g. ABC Base System" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="proj-desc">Description</Label>
            <Textarea id="proj-desc" placeholder="Brief description of the project…" value={description} onChange={e => setDescription(e.target.value)} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="proj-start">Start Date</Label>
              <Input id="proj-start" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="proj-end">End Date</Label>
              <Input id="proj-end" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="ON_HOLD">On Hold</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Owner / PM</Label>
              <Select value={ownerId} onValueChange={setOwnerId}>
                <SelectTrigger><SelectValue placeholder="Select owner" /></SelectTrigger>
                <SelectContent>
                  {users.map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.name || u.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating…</> : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
