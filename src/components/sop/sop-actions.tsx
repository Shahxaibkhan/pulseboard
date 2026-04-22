"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu"
import { MoreHorizontal, Pencil, Trash2, Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { SOP } from "@/types"

export function SOPActions({ sop, projectId }: { sop: SOP; projectId: string }) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState(sop.name)
  const [readiness, setReadiness] = useState(String(sop.readiness))
  const [startDate, setStartDate] = useState(sop.start_date ?? "")
  const [endDate, setEndDate] = useState(sop.end_date ?? "")
  const router = useRouter()
  const supabase = createClient()

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.from("sops").update({
      name: name.trim(), readiness: parseInt(readiness) || 0,
      start_date: startDate || null, end_date: endDate || null,
    }).eq("id", sop.id)
    setLoading(false)
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return }
    toast({ title: "SOP updated" })
    setEditOpen(false)
    router.refresh()
  }

  async function handleDelete() {
    setLoading(true)
    const { error } = await supabase.from("sops").delete().eq("id", sop.id)
    setLoading(false)
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return }
    toast({ title: "SOP deleted", variant: "destructive" })
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
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit SOP</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4 py-2">
            <div className="space-y-2"><Label>SOP Name *</Label><Input value={name} onChange={e => setName(e.target.value)} required /></div>
            <div className="space-y-2"><Label>Readiness %</Label><Input type="number" min={0} max={100} value={readiness} onChange={e => setReadiness(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Start Date</Label><Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
              <div className="space-y-2"><Label>End Date</Label><Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={loading}>{loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : "Save"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete SOP?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground py-2">This will delete <strong>{sop.name}</strong> and all its subtasks.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
