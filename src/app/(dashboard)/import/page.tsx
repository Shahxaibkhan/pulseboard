"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import * as XLSX from "xlsx"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Upload, FileSpreadsheet, CheckCircle2, Loader2, Download, AlertCircle } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

type ImportMode = "sops" | "subtasks" | "automations" | "releases" | "project-tracker"

type Project = { id: string; name: string }
type SOP = { id: string; name: string }

// Helper: pick first truthy value from row using multiple possible column names
function col(row: Record<string, string>, ...keys: string[]): string {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== "") return row[k]
  }
  return ""
}

function parseDate(val: string): string | null {
  if (!val) return null
  // Excel serial number
  if (/^\d{4,6}$/.test(val.trim())) {
    const d = XLSX.SSF.parse_date_code(Number(val))
    if (d) return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`
  }
  // Already ISO or slash format
  const d = new Date(val)
  if (!isNaN(d.getTime())) return d.toISOString().split("T")[0]
  return null
}

function parseProgress(val: string): number {
  const n = parseFloat(val)
  if (isNaN(n)) return 0
  // If value looks like 0.XX, treat as percentage
  if (n > 0 && n <= 1) return Math.round(n * 100)
  return Math.min(100, Math.max(0, Math.round(n)))
}

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [mode, setMode] = useState<ImportMode>("sops")
  const [projectId, setProjectId] = useState("")
  const [sopId, setSopId] = useState("")
  const [projects, setProjects] = useState<Project[]>([])
  const [sops, setSOPs] = useState<SOP[]>([])
  const [preview, setPreview] = useState<Record<string, string>[]>([])
  const [sheetNames, setSheetNames] = useState<string[]>([])
  const [activeSheet, setActiveSheet] = useState("")
  const [rawSheetRows, setRawSheetRows] = useState<Record<string, string[][]>>({}) // raw rows per sheet
  const [headerRow, setHeaderRow] = useState(1) // 1-based
  const [allSheetData, setAllSheetData] = useState<Record<string, Record<string, string>[]>>({})
  const [loading, setLoading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Load projects on mount
  useEffect(() => {
    supabase.from("projects").select("id, name").order("name").then(({ data }) => {
      if (data) setProjects(data)
    })
  }, [])

  // Load SOPs when project changes (for subtasks mode)
  useEffect(() => {
    if (!projectId || mode !== "subtasks") return
    supabase.from("sops").select("id, name").eq("project_id", projectId).order("name").then(({ data }) => {
      if (data) setSOPs(data)
    })
  }, [projectId, mode])

  function parseSheetWithHeaderRow(
    rawRows: Record<string, string[][]>,
    sheet: string,
    hRow: number
  ): Record<string, string>[] {
    const rows = rawRows[sheet] ?? []
    if (rows.length < hRow) return []
    const headers = rows[hRow - 1].map(h => String(h ?? "").trim())
    return rows.slice(hRow).map(row =>
      Object.fromEntries(headers.map((h, i) => [h || `col_${i}`, String(row[i] ?? "").trim()]))
    ).filter(r => Object.values(r).some(v => v !== ""))
  }

  const handleFile = useCallback((f: File) => {
    setFile(f)
    setHeaderRow(1)
    const reader = new FileReader()
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer)
      const wb = XLSX.read(data, { type: "array" })
      const names = wb.SheetNames
      setSheetNames(names)

      // Store raw rows (array of arrays) per sheet
      const raw: Record<string, string[][]> = {}
      names.forEach(name => {
        const ws = wb.Sheets[name]
        raw[name] = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, defval: "", raw: false })
      })
      setRawSheetRows(raw)

      const first = names[0]
      setActiveSheet(first)

      // Auto-detect header row: first row with >= 3 non-empty cells
      const rows = raw[first] ?? []
      let detectedHeader = 1
      for (let i = 0; i < Math.min(rows.length, 10); i++) {
        const nonEmpty = rows[i].filter(c => String(c).trim() !== "").length
        if (nonEmpty >= 3) { detectedHeader = i + 1; break }
      }
      setHeaderRow(detectedHeader)

      const parsed = parseSheetWithHeaderRow(raw, first, detectedHeader)
      const allData: Record<string, Record<string, string>[]> = { [first]: parsed }
      names.slice(1).forEach(name => {
        allData[name] = parseSheetWithHeaderRow(raw, name, detectedHeader)
      })
      setAllSheetData(allData)
      setPreview(parsed.slice(0, 5))
    }
    reader.readAsArrayBuffer(f)
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f && (f.name.endsWith(".xlsx") || f.name.endsWith(".xls"))) handleFile(f)
    else toast({ title: "Please upload an .xlsx file", variant: "destructive" })
  }, [handleFile])

  function selectSheet(name: string) {
    setActiveSheet(name)
    const parsed = parseSheetWithHeaderRow(rawSheetRows, name, headerRow)
    setAllSheetData(prev => ({ ...prev, [name]: parsed }))
    setPreview(parsed.slice(0, 5))
  }

  function applyHeaderRow(hRow: number) {
    setHeaderRow(hRow)
    const updated: Record<string, Record<string, string>[]> = {}
    sheetNames.forEach(name => {
      updated[name] = parseSheetWithHeaderRow(rawSheetRows, name, hRow)
    })
    setAllSheetData(updated)
    setPreview((updated[activeSheet] ?? []).slice(0, 5))
  }

  async function handleImport() {
    if (!file || !projectId) {
      toast({ title: "Please select a project and file", variant: "destructive" })
      return
    }
    if (mode === "subtasks" && !sopId) {
      toast({ title: "Please select a SOP for subtask import", variant: "destructive" })
      return
    }
    setLoading(true)

    const rows = allSheetData[activeSheet] ?? []
    if (rows.length === 0) {
      toast({ title: "No data found in sheet", variant: "destructive" })
      setLoading(false)
      return
    }

    let error: { message: string } | null = null
    let importedCount = 0

    if (mode === "sops") {
      const sops = rows.map(r => ({
        project_id: projectId,
        name: col(r, "SOP Name", "Name", "name", "SOP", "Task"),
        readiness: parseProgress(col(r, "Readiness", "readiness", "Progress", "progress", "% Complete", "Completion")),
        start_date: parseDate(col(r, "Start Date", "start_date", "StartDate", "Start")),
        end_date: parseDate(col(r, "End Date", "end_date", "EndDate", "End", "Due Date")),
      })).filter(s => s.name)
      importedCount = sops.length
      const res = await supabase.from("sops").insert(sops)
      error = res.error

    } else if (mode === "subtasks") {
      const subtasks = rows.map(r => ({
        sop_id: sopId,
        name: col(r, "Task Name", "name", "Name", "Subtask", "Task", "SOP Subtask"),
        department: col(r, "Department", "department", "Dept") || null,
        progress: parseProgress(col(r, "Progress", "progress", "% Complete", "Completion", "Readiness")),
        status: col(r, "Status", "status") || "NOT_STARTED",
        remarks: col(r, "Remarks", "remarks", "Notes", "Comment") || null,
        start_date: parseDate(col(r, "Start Date", "start_date", "Start")),
        end_date: parseDate(col(r, "End Date", "end_date", "End", "Due Date")),
      })).filter(s => s.name)
      importedCount = subtasks.length
      const res = await supabase.from("sop_subtasks").insert(subtasks)
      error = res.error

    } else if (mode === "automations") {
      // Insert automation + phases per row
      let failed = false
      for (const r of rows) {
        const name = col(r, "Integration Name", "Automation", "Name", "name")
        if (!name) continue
        // Upsert automation by name+project
        const { data: existing } = await supabase
          .from("automations")
          .select("id")
          .eq("project_id", projectId)
          .eq("name", name)
          .maybeSingle()

        let automationId = existing?.id
        if (!automationId) {
          const { data: newAuto, error: ae } = await supabase
            .from("automations")
            .insert({ project_id: projectId, name })
            .select("id")
            .single()
          if (ae) { error = ae; failed = true; break }
          automationId = newAuto.id
        }

        const phase = col(r, "Phase", "phase")
        const validPhases = ["VENDOR", "DEVELOPMENT", "SIT", "UAT", "GO_LIVE"]
        const phaseVal = validPhases.includes(phase?.toUpperCase()) ? phase.toUpperCase() : "VENDOR"

        const { error: pe } = await supabase.from("automation_phases").insert({
          automation_id: automationId,
          phase: phaseVal,
          owner: col(r, "Owner", "owner") || null,
          progress: parseProgress(col(r, "Progress", "progress", "% Complete")),
          start_date: parseDate(col(r, "Start Date", "start_date", "Start")),
          end_date: parseDate(col(r, "End Date", "end_date", "End")),
        })
        if (pe) { error = pe; failed = true; break }
        importedCount++
      }

    } else if (mode === "project-tracker") {
      // ── Liugong Finance Project Tracker format ──────────────────────────────
      // Sheet: "Overall planning" → SOPs (rows 4+ until second table)
      // Sheet: "Project schedule" → subtasks (rows 8+, parents identified by name match)

      const overallRaw = rawSheetRows["Overall planning"] ?? []
      const scheduleRaw = rawSheetRows["Project schedule"] ?? []

      if (overallRaw.length === 0 || scheduleRaw.length === 0) {
        toast({ title: "Could not find required sheets", description: "Need 'Overall planning' and 'Project schedule' sheets", variant: "destructive" })
        setLoading(false)
        return
      }

      // ── Step 1: Parse Overall planning → build SOP list ──────────────────
      // Row 1 (index 0) = headers, row 2 (index 1) = sub-headers, data from row 4 (index 3)
      // Stop when we hit the second table (row with "Phase" in col 0 again, after row 10)
      type SOPEntry = { name: string; start_date: string | null; end_date: string | null; readiness: number }
      const sopEntries: SOPEntry[] = []

      for (let i = 3; i < overallRaw.length; i++) {
        const row = overallRaw[i]
        const name = String(row[1] ?? "").trim()
        if (!name) continue
        // Stop at second table header
        if (i > 10 && (String(row[0]).trim() === "Phase" || String(row[1]).trim() === "System Process flow")) break
        // Skip rows that are clearly second-table data (Iteration rows)
        if (name.startsWith("Iteration")) continue

        const readinessPct = String(row[5] ?? "0").replace("%", "").trim()
        sopEntries.push({
          name,
          start_date: parseDate(String(row[2] ?? "")),
          end_date: parseDate(String(row[3] ?? "")),
          readiness: Math.min(100, Math.max(0, Math.round(parseFloat(readinessPct) || 0))),
        })
      }

      if (sopEntries.length === 0) {
        toast({ title: "No SOPs found in Overall planning sheet", variant: "destructive" })
        setLoading(false)
        return
      }

      // ── Step 2: Insert SOPs ────────────────────────────────────────────────
      const { data: insertedSOPs, error: sopError } = await supabase
        .from("sops")
        .insert(sopEntries.map(s => ({ project_id: projectId, name: s.name, readiness: s.readiness, start_date: s.start_date, end_date: s.end_date })))
        .select("id, name")

      if (sopError) { error = sopError }
      else {
        // Build name → id map (with normalised key for fuzzy matching)
        const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "")
        const sopMap = new Map<string, string>() // normalised name → id
        insertedSOPs?.forEach(s => sopMap.set(normalize(s.name), s.id))

        function findSopId(taskName: string): string | undefined {
          const n = normalize(taskName)
          if (sopMap.has(n)) return sopMap.get(n)
          // Partial match: task name starts with SOP name or vice versa
          for (const [key, id] of sopMap.entries()) {
            if (n.startsWith(key) || key.startsWith(n)) return id
          }
          return undefined
        }

        // ── Step 3: Parse Project schedule → subtasks ────────────────────────
        // Header row 5 (index 4): col[1]=TASK, col[2]=Dept, col[3]=ASSIGNED TO,
        // col[5]=PROGRESS, col[6]=SYSTEM READINESS, col[7]=LINKED CRs, col[8]=DELIVERY,
        // col[9]=STATUS, col[10]=START, col[11]=END
        const subtaskBatch: object[] = []
        let currentSopId: string | null = null

        for (let i = 7; i < scheduleRaw.length; i++) {
          const row = scheduleRaw[i]
          const taskName = String(row[1] ?? "").trim().replace(/\r\n/g, " / ")
          if (!taskName || taskName === "Insert new rows ABOVE this one") continue

          // Identify parent row: task name matches an SOP
          const matchedId = findSopId(taskName)
          if (matchedId) {
            currentSopId = matchedId
            continue
          }

          if (!currentSopId) continue

          const progressPct = String(row[5] ?? "0").replace("%", "").trim()
          const statusRaw = String(row[9] ?? "").trim().toLowerCase()
          let status = "NOT_STARTED"
          if (statusRaw === "pass" || statusRaw === "completed") status = "COMPLETED"
          else if (statusRaw.includes("progress") || statusRaw.includes("development")) status = "IN_PROGRESS"
          else if (parseFloat(progressPct) > 0) status = "IN_PROGRESS"

          const linkedCR = String(row[7] ?? "").trim()
          const delivery = String(row[8] ?? "").trim()
          const remarks = [linkedCR && `CR: ${linkedCR}`, delivery && `Delivery: ${delivery}`].filter(Boolean).join(" | ") || null

          subtaskBatch.push({
            sop_id: currentSopId,
            name: taskName.slice(0, 500),
            department: String(row[2] ?? "").trim() || null,
            progress: Math.min(100, Math.max(0, Math.round(parseFloat(progressPct) || 0))),
            status,
            remarks,
            start_date: parseDate(String(row[10] ?? "")),
            end_date: parseDate(String(row[11] ?? "")),
          })
        }

        // Insert subtasks in chunks of 50
        for (let i = 0; i < subtaskBatch.length; i += 50) {
          const chunk = subtaskBatch.slice(i, i + 50)
          const { error: stErr } = await supabase.from("sop_subtasks").insert(chunk)
          if (stErr) { error = stErr; break }
          importedCount += chunk.length
        }

        if (!error) importedCount += sopEntries.length
      }

    } else if (mode === "releases") {
      const releases = rows.map(r => ({
        project_id: projectId,
        name: col(r, "Release Name", "Name", "name", "Release"),
        release_date: parseDate(col(r, "Release Date", "release_date", "Date")),
        status: col(r, "Status", "status") || "PLANNED",
        vendor_name: col(r, "Vendor", "vendor_name", "Vendor Name") || null,
        progress: parseProgress(col(r, "Progress", "progress", "% Complete")),
      })).filter(s => s.name)
      importedCount = releases.length
      const res = await supabase.from("releases").insert(releases)
      error = res.error
    }

    setLoading(false)
    if (error) {
      toast({ title: "Import failed", description: error.message, variant: "destructive" })
      return
    }
    toast({ title: `✓ Imported ${importedCount} rows successfully` })
    router.refresh()
  }

  function downloadTemplate() {
    const templates: Record<ImportMode, Record<string, string>[]> = {
      sops: [
        { "SOP Name": "Application Intake", "Readiness": "90", "Start Date": "2026-01-01", "End Date": "2026-06-30" },
        { "SOP Name": "Document Review", "Readiness": "50", "Start Date": "2026-02-01", "End Date": "2026-07-31" },
      ],
      subtasks: [
        { "Task Name": "Financial Analysis", "Department": "Finance", "Status": "IN_PROGRESS", "Progress": "60", "Remarks": "", "Start Date": "2026-01-01", "End Date": "2026-03-31" },
        { "Task Name": "Legal Review", "Department": "Legal", "Status": "NOT_STARTED", "Progress": "0", "Remarks": "", "Start Date": "2026-02-01", "End Date": "2026-04-30" },
      ],
      automations: [
        { "Integration Name": "E-Sign", "Phase": "VENDOR", "Owner": "Legal", "Progress": "40", "Start Date": "2026-01-01", "End Date": "2026-03-31" },
        { "Integration Name": "E-Sign", "Phase": "DEVELOPMENT", "Owner": "IT", "Progress": "10", "Start Date": "2026-03-01", "End Date": "2026-05-31" },
      ],
      releases: [
        { "Release Name": "Release 1.0", "Release Date": "2026-03-01", "Vendor": "XYZ Vendor", "Status": "PLANNED", "Progress": "0" },
        { "Release Name": "Release 1.1", "Release Date": "2026-06-01", "Vendor": "XYZ Vendor", "Status": "PLANNED", "Progress": "0" },
      ],
    }
    const ws = XLSX.utils.json_to_sheet(templates[mode])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Template")
    XLSX.writeFile(wb, `pulseboard-${mode}-template.xlsx`)
  }

  const detectedColumns = preview.length > 0 ? Object.keys(preview[0]) : []

  return (
    <div className="space-y-6 animate-in max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Import Data</h1>
        <p className="text-sm text-muted-foreground">Bulk import from Excel (.xlsx) — all sheets supported</p>
      </div>

      <div className="grid gap-4">
        {/* Config */}
        <Card>
          <CardHeader><CardTitle className="text-base">Import Settings</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Import Type</Label>
                <Select value={mode} onValueChange={v => { setMode(v as ImportMode); setPreview([]) }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="project-tracker">⚡ Project Tracker (Liugong format) — auto-imports both sheets</SelectItem>
                    <SelectItem value="sops">SOPs</SelectItem>
                    <SelectItem value="subtasks">SOP Subtasks / Tasks</SelectItem>
                    <SelectItem value="automations">Automations / Integrations</SelectItem>
                    <SelectItem value="releases">Releases</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Project</Label>
                <Select value={projectId} onValueChange={setProjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder={projects.length === 0 ? "No projects yet…" : "Select project"} />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {mode === "subtasks" && (
              <div className="space-y-2">
                <Label>SOP (parent)</Label>
                <Select value={sopId} onValueChange={setSopId} disabled={!projectId}>
                  <SelectTrigger>
                    <SelectValue placeholder={!projectId ? "Select a project first" : sops.length === 0 ? "No SOPs in this project" : "Select SOP"} />
                  </SelectTrigger>
                  <SelectContent>
                    {sops.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-end gap-4">
              <div className="space-y-2">
                <Label>Header row number</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={headerRow}
                    onChange={e => applyHeaderRow(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  />
                  <span className="text-xs text-muted-foreground">Increase if you see __EMPTY columns</span>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <Download className="h-4 w-4" /> Download Template
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Project tracker info */}
        {mode === "project-tracker" && (
          <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800 p-3 text-sm">
            <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
            <div className="text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">Liugong Finance format detected</p>
              <ul className="text-xs space-y-0.5 text-blue-700 dark:text-blue-300">
                <li>• <b>Overall planning</b> sheet → creates all SOPs with readiness % and dates</li>
                <li>• <b>Project schedule</b> sheet → creates all subtasks linked to their parent SOP</li>
                <li>• Linked CRs and Delivery dates are saved in task Remarks</li>
              </ul>
            </div>
          </div>
        )}

        {/* Upload Zone */}
        <Card>
          <CardContent className="pt-6">
            <div
              className={cn(
                "flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-14 transition-colors cursor-pointer",
                dragging ? "border-blue-400 bg-blue-50 dark:bg-blue-950/20" : "border-border hover:border-blue-300"
              )}
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => document.getElementById("file-input")?.click()}
            >
              {file ? (
                <>
                  <CheckCircle2 className="h-10 w-10 text-green-500 mb-3" />
                  <p className="font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">Click to replace</p>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="h-10 w-10 text-muted-foreground/40 mb-3" />
                  <p className="font-medium">Drop your .xlsx file here</p>
                  <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
                </>
              )}
              <input
                id="file-input" type="file" accept=".xlsx,.xls" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Sheet selector — hidden for project-tracker which handles both sheets */}
        {sheetNames.length > 1 && mode !== "project-tracker" && (
          <Card>
            <CardHeader><CardTitle className="text-base">Select Sheet</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {sheetNames.map(name => (
                  <button
                    key={name}
                    onClick={() => selectSheet(name)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm border transition-colors",
                      activeSheet === name
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-background border-border hover:border-blue-400"
                    )}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Detected columns hint */}
        {detectedColumns.length > 0 && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-3 text-sm">
            <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <span className="font-medium text-amber-800 dark:text-amber-200">Detected columns: </span>
              <span className="text-amber-700 dark:text-amber-300">{detectedColumns.join(", ")}</span>
            </div>
          </div>
        )}

        {/* Preview */}
        {preview.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Preview — {activeSheet} (first 5 rows)</CardTitle>
              <CardDescription>Review before importing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-lg border text-xs">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      {Object.keys(preview[0]).map(k => (
                        <th key={k} className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">{k}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {preview.map((row, i) => (
                      <tr key={i}>
                        {Object.values(row).map((v, j) => (
                          <td key={j} className="px-3 py-2 text-muted-foreground truncate max-w-40">{String(v)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        <Button
          onClick={handleImport}
          disabled={!file || !projectId || loading || (mode === "subtasks" && !sopId)}
          className="self-start"
        >
          {loading
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Importing…</>
            : <><Upload className="h-4 w-4" /> Import {activeSheet ? `"${activeSheet}"` : ""}</>}
        </Button>
      </div>
    </div>
  )
}
