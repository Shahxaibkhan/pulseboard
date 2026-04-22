"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu"
import { MoreHorizontal, Pencil, Trash2, Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { SOPSubtask, AppUser } from "@/types"

export function SubtaskActions({ task, users, allSubtasks }: {
  task: SOPSubtask; users: AppUser[]; allSubtasks: SOPSubtask[]
}) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState(task.name)
  const [department, setDepartment] = useState(task.department ?? "")
  const [assignedTo, setAssignedTo] = useState(task.assigned_to ?? "__none__")
  const [status, setStatus] = useState<string>(task.status)
  const [dependsOn, setDependsOn] = useState(task.depends_on ?? "__none__")
  const [remarks, setRemarks] = useState(task.remarks ?? "")
  const [startDate, setStartDate] = useState(task.start_date ?? "")
  const [endDate, setEndDate] = useState(task.end_date ?? "")
  const router = useRouter()
  const supabase = createClient()

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.from("sop_subtasks").update({
      name: name.trim(), department: department.trim() || null,
      assigned_to: assignedTo === "__none__" ? null : assignedTo, status,
      depends_on: dependsOn === "__none__" ? null : dependsOn, remarks: remarks.trim() || null,
      start_date: startDate || null, end_date: endDate || null,
    }).eq("id", task.id)
    setLoading(false)
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return }
    toast({ title: "Subtask updated" })
    setEditOpen(false)
    router.refresh()
  }

  async function handleDelete() {
    setLoading(true)
    const { error } = await supabase.from("sop_subtasks").delete().eq("id", task.id)
    setLoading(false)
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return }
    toast({ title: "Subtask deleted", variant: "destructive" })
    setDeleteOpen(false)
    router.refresh()
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => e.stopPropagation()}><MoreHorizontal className="h-3.5 w-3.5" /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36 z-50 rounded-lg border bg-popover p-1 shadow-lg" onClick={e => e.stopPropagation()}>
          <DropdownMenuItem className="flex items-center gap-2 rounded-md px-3 py-2 text-sm cursor-pointer hover:bg-accent" onSelect={() => setTimeout(() => setEditOpen(true), 0)}>
            <Pencil className="h-3.5 w-3.5" /> Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator className="my-1 border-t" />
          <DropdownMenuItem className="flex items-center gap-2 rounded-md px-3 py-2 text-sm cursor-pointer text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onSelect={() => setTimeout(() => setDeleteOpen(true), 0)}>
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Subtask</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4 py-2">
            <div className="space-y-2"><Label>Task Name *</Label><Input value={name} onChange={e => setName(e.target.value)} required /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Department</Label><Input value={department} onChange={e => setDepartment(e.target.value)} /></div>
              <div className="space-y-2">
                <Label>Assigned To</Label>
                <Select value={assignedTo} onValueChange={setAssignedTo}>
                  <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Unassigned</SelectItem>
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
                    {allSubtasks.filter(t => t.id !== task.id).map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Start Date</Label><Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
              <div className="space-y-2"><Label>End Date</Label><Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></div>
            </div>
            <div className="space-y-2"><Label>Remarks</Label><Textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={2} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={loading}>{loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : "Save"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Subtask?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground py-2">This will permanently delete <strong>{task.name}</strong>.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
