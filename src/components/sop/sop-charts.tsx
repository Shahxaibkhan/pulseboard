"use client"

import { SOP } from "@/types"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie, Legend
} from "recharts"

interface SOPChartsProps {
  sops: Array<SOP & { computedProgress: number; delayed: boolean }>
}

const PIE_COLORS = ["#22c55e", "#3b82f6", "#ef4444"]

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function PieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-blue-500/25 bg-[#0d1830]/95 backdrop-blur-md px-3 py-2 shadow-xl shadow-blue-900/40 text-xs">
      <p className="font-bold text-white">{payload[0].name}: {payload[0].value}</p>
    </div>
  )
}

const axisStyle = { fill: "#6b82b0", fontSize: 11 }
const gridStyle = { stroke: "rgba(59,130,246,0.08)" }

export function SOPCharts({ sops }: SOPChartsProps) {
  const progressData = sops.map(s => ({
    name: s.name.length > 16 ? s.name.slice(0, 16) + "…" : s.name,
    progress: s.computedProgress,
    readiness: s.readiness,
  }))

  const delayData = [
    { name: "On Track", value: sops.filter(s => !s.delayed && s.computedProgress < 100).length },
    { name: "Completed", value: sops.filter(s => s.computedProgress === 100).length },
    { name: "Delayed", value: sops.filter(s => s.delayed).length },
  ].filter(d => d.value > 0)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Progress Bar Chart */}
      <div className="rounded-xl border border-blue-200/40 dark:border-blue-900/30 bg-white/70 dark:bg-[#080e1e]/80 backdrop-blur-sm p-5 shadow-sm shadow-blue-900/10 dark:shadow-blue-900/30 stat-card-accent">
        <h3 className="font-semibold text-sm mb-0.5">SOP Progress & Readiness</h3>
        <p className="text-xs text-muted-foreground mb-4">Completion vs readiness per process</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={progressData} margin={{ left: -20 }}>
            <defs>
              <linearGradient id="sopProgressGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#60a5fa" stopOpacity={1} />
                <stop offset="100%" stopColor="#2563eb" stopOpacity={0.85} />
              </linearGradient>
              <linearGradient id="sopReadinessGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a5b4fc" stopOpacity={1} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0.7} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStyle.stroke} vertical={false} />
            <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
            <YAxis tick={axisStyle} domain={[0, 100]} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(59,130,246,0.06)" }} />
            <Bar dataKey="progress" fill="url(#sopProgressGrad)" radius={[4, 4, 0, 0]} name="Progress" />
            <Bar dataKey="readiness" fill="url(#sopReadinessGrad)" radius={[4, 4, 0, 0]} name="Readiness" />
            <Legend
              wrapperStyle={{ fontSize: 11, color: "#6b82b0" }}
              iconType="circle"
              iconSize={8}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Delay Donut Chart */}
      <div className="rounded-xl border border-blue-200/40 dark:border-blue-900/30 bg-white/70 dark:bg-[#080e1e]/80 backdrop-blur-sm p-5 shadow-sm shadow-blue-900/10 dark:shadow-blue-900/30 stat-card-accent">
        <h3 className="font-semibold text-sm mb-0.5">Delay Analysis</h3>
        <p className="text-xs text-muted-foreground mb-4">SOPs grouped by delay status</p>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <defs>
              <filter id="pieShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="0" stdDeviation="4" floodOpacity="0.4" />
              </filter>
            </defs>
            <Pie
              data={delayData}
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={88}
              paddingAngle={4}
              dataKey="value"
              strokeWidth={0}
              filter="url(#pieShadow)"
            >
              {delayData.map((_, i) => (
                <Cell
                  key={i}
                  fill={PIE_COLORS[i] ?? PIE_COLORS[0]}
                />
              ))}
            </Pie>
            <Tooltip content={<PieTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 11, color: "#6b82b0" }}
              iconType="circle"
              iconSize={8}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
