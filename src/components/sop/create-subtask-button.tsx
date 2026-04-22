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
import { AppUser, SOPSubtask } from "@/types"

export function CreateSubtaskButton({
  sopId, users, allSubtasks
}: { sopId: string; users: AppUser[]; allSubtasks: SOPSubtask[] }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState("")
  const [department, setDepartment] = useState("")
  const [assignedTo, setAssignedTo] = useState("")
  const [status, setStatus] = useState("NOT_STARTED")
  const [dependsOn, setDependsOn] = useState("__none__")
  const [remarks, setRemarks] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const router = useRouter()
  const supabase = createClient()

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.from("sop_subtasks").insert({
      sop_id: sopId,
      name: name.trim(),
      department: department.trim() || null,
      assigned_to: assignedTo || null,
      progress: 0,
      status,
      depends_on: dependsOn === "__none__" ? null : dependsOn,
      remarks: remarks.trim() || null,
      start_date: startDate || null,
      end_date: endDate || null,
    })
    setLoading(false)
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return }
    toast({ title: "Subtask added" })
    setOpen(false)
    resetForm()
    router.refresh()
  }

  function resetForm() {
    setName(""); setDepartment(""); setAssignedTo(""); setStatus("NOT_STARTED")
    setDependsOn("__none__"); setRemarks(""); setStartDate(""); setEndDate("")
  }

  return (
    <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) resetForm() }}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4" /> Add Subtask</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Add Subtask</DialogTitle></DialogHeader>
        <form onSubmit={handleCreate} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Task Name *</Label>
            <Input placeholder="e.g. Financial Analysis, AML/CFT Check…" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Department</Label>
              <Input placeholder="e.g. Legal, Finance…" value={department} onChange={e => setDepartment(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Assigned To</Label>
              <Select value={assignedTo} onValueChange={setAssignedTo}>
                <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
                <SelectContent>
                  {users.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NOT_STARTED">Not Started</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Depends On</Label>
              <Select value={dependsOn} onValueChange={setDependsOn}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {allSubtasks.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Start Date</Label><Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
            <div className="space-y-2"><Label>End Date</Label><Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></div>
          </div>
          <div className="space-y-2">
            <Label>Remarks</Label>
            <Textarea placeholder="Optional notes…" value={remarks} onChange={e => setRemarks(e.target.value)} rows={2} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Adding…</> : "Add Subtask"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
