"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu"
import { MoreHorizontal, Pencil, Trash2, Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { ReleaseItem } from "@/types"

export function ReleaseItemActions({ item }: { item: ReleaseItem }) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState(item.name)
  const [type, setType] = useState<string>(item.type)
  const [status, setStatus] = useState<string>(item.status)
  const [owner, setOwner] = useState(item.owner ?? "")
  const router = useRouter()
  const supabase = createClient()

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.from("release_items").update({
      name: name.trim(), type, status, owner: owner.trim() || null,
    }).eq("id", item.id)
    setLoading(false)
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return }
    toast({ title: "Updated" })
    setEditOpen(false)
    router.refresh()
  }

  async function handleDelete() {
    setLoading(true)
    const { error } = await supabase.from("release_items").delete().eq("id", item.id)
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
          <DialogHeader><DialogTitle>Edit Item</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4 py-2">
            <div className="space-y-2"><Label>Name *</Label><Input value={name} onChange={e => setName(e.target.value)} required /></div>
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
            <div className="space-y-2"><Label>Owner</Label><Input value={owner} onChange={e => setOwner(e.target.value)} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Item?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground py-2">This will permanently delete <strong>{item.name}</strong>.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
