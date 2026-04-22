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
import { Automation } from "@/types"

export function AutomationActions({ automation, projectId }: { automation: Automation; projectId: string }) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState(automation.name)
  const router = useRouter()
  const supabase = createClient()

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.from("automations").update({ name: name.trim() }).eq("id", automation.id)
    setLoading(false)
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return }
    toast({ title: "Updated" })
    setEditOpen(false)
    router.refresh()
  }

  async function handleDelete() {
    setLoading(true)
    const { error } = await supabase.from("automations").delete().eq("id", automation.id)
    setLoading(false)
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return }
    toast({ title: "Deleted", variant: "destructive" })
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
            <Pencil className="h-3.5 w-3.5" /> Rename
          </DropdownMenuItem>
          <DropdownMenuSeparator className="my-1 border-t" />
          <DropdownMenuItem className="flex items-center gap-2 rounded-md px-3 py-2 text-sm cursor-pointer text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onSelect={() => setTimeout(() => setDeleteOpen(true), 0)}>
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Rename Integration</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4 py-2">
            <div className="space-y-2"><Label>Name *</Label><Input value={name} onChange={e => setName(e.target.value)} required /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Integration?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground py-2">This will delete <strong>{automation.name}</strong> and all its phases.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
