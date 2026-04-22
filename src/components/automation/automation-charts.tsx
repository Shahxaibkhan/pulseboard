"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from "recharts"
import { phaseLabel } from "@/lib/utils"
import { Automation, AutomationPhaseRecord } from "@/types"

interface AutomationChartsProps {
  automations: Array<Automation & { phases: AutomationPhaseRecord[] }>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-blue-500/25 bg-[#0d1830]/95 backdrop-blur-md px-3 py-2.5 shadow-xl shadow-blue-900/40 text-xs">
      {label && <p className="font-semibold text-blue-300 mb-1.5">{label}</p>}
      {payload.map((entry: { name: string; value: number; color: string }, i: number) => (
        <div key={i} className="flex items-center gap-2 py-0.5">
          <span className="inline-block w-2 h-2 rounded-full flex-shrink-0" style={{ background: entry.color }} />
          <span className="text-slate-300">{entry.name}:{" "}
            <span className="font-bold text-white">{entry.value}%</span>
          </span>
        </div>
      ))}
    </div>
  )
}

const axisStyle = { fill: "#6b82b0", fontSize: 11 }
const gridColor = "rgba(59,130,246,0.07)"
const cardClass =
  "rounded-xl border border-blue-200/40 dark:border-blue-900/30 bg-white/70 dark:bg-[#080e1e]/80 backdrop-blur-sm p-5 shadow-sm shadow-blue-900/10 dark:shadow-blue-900/30 stat-card-accent"

export function AutomationCharts({ automations }: AutomationChartsProps) {
  const phaseData = automations.map(auto => {
    const obj: Record<string, string | number> = { name: auto.name.length > 12 ? auto.name.slice(0, 12) + "…" : auto.name }
    auto.phases.forEach(p => { obj[phaseLabel(p.phase)] = p.progress })
    return obj
  })

  const vendorData = automations.map(auto => ({
    name: auto.name,
    avg: auto.phases.length > 0
      ? Math.round(auto.phases.reduce((s, p) => s + p.progress, 0) / auto.phases.length)
      : 0
  }))

  const phaseNames = ["Vendor Finalization", "Development", "SIT", "UAT", "Go-Live"]
  const PHASE_COLORS = ["#6366f1", "#3b82f6", "#10b981", "#f59e0b", "#ef4444"]
  const GRAD_IDS = ["autoVendor", "autoDev", "autoSIT", "autoUAT", "autoLive"]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className={cardClass}>
        <h3 className="font-semibold text-sm mb-0.5">Phase Progress by Integration</h3>
        <p className="text-xs text-muted-foreground mb-4">Each phase completion per system</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={phaseData} margin={{ left: -20 }}>
            <defs>
              {PHASE_COLORS.map((color, i) => (
                <linearGradient key={i} id={GRAD_IDS[i]} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={1} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.65} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
            <YAxis tick={axisStyle} domain={[0, 100]} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(59,130,246,0.06)" }} />
            <Legend wrapperStyle={{ fontSize: 11, color: "#6b82b0" }} iconType="circle" iconSize={8} />
            {phaseNames.map((p, i) => (
              <Bar key={p} dataKey={p} fill={`url(#${GRAD_IDS[i]})`} radius={[2, 2, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className={cardClass}>
        <h3 className="font-semibold text-sm mb-0.5">Overall Progress per Integration</h3>
        <p className="text-xs text-muted-foreground mb-4">Average across all phases</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={vendorData} layout="vertical" margin={{ left: 10 }}>
            <defs>
              <linearGradient id="autoAvgGreen" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.85} />
                <stop offset="100%" stopColor="#a78bfa" stopOpacity={1} />
              </linearGradient>
              <linearGradient id="autoAvgYellow" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#d97706" stopOpacity={0.85} />
                <stop offset="100%" stopColor="#fbbf24" stopOpacity={1} />
              </linearGradient>
              <linearGradient id="autoAvgRed" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#dc2626" stopOpacity={0.85} />
                <stop offset="100%" stopColor="#f87171" stopOpacity={1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
            <XAxis type="number" domain={[0, 100]} tick={axisStyle} axisLine={false} tickLine={false} />
            <YAxis dataKey="name" type="category" tick={axisStyle} width={90} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(59,130,246,0.06)" }} />
            <Bar dataKey="avg" radius={[0, 4, 4, 0]} name="Avg Progress">
              {vendorData.map((d, i) => (
                <Cell key={i} fill={d.avg >= 70 ? "url(#autoAvgGreen)" : d.avg >= 40 ? "url(#autoAvgYellow)" : "url(#autoAvgRed)"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
