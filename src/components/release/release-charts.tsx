"use client"

import { Release } from "@/types"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell, Legend
} from "recharts"
import { formatDate } from "@/lib/utils"

interface ReleaseChartsProps { releases: Release[] }

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
            <span className="font-bold text-white">{entry.value}{entry.value <= 100 && typeof entry.value === "number" ? "%" : ""}</span>
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

export function ReleaseCharts({ releases }: ReleaseChartsProps) {
  const trendData = releases.map(r => ({
    name: r.name,
    progress: r.progress,
    date: r.release_date ? formatDate(r.release_date) : "—",
  }))

  const statusData = [
    { name: "Planned", value: releases.filter(r => r.status === "PLANNED").length, color: "#f59e0b" },
    { name: "In Progress", value: releases.filter(r => r.status === "IN_PROGRESS").length, color: "#3b82f6" },
    { name: "Completed", value: releases.filter(r => r.status === "COMPLETED").length, color: "#22c55e" },
  ].filter(d => d.value > 0)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Release Progress Trend */}
      <div className={cardClass}>
        <h3 className="font-semibold text-sm mb-0.5">Release Progress Trend</h3>
        <p className="text-xs text-muted-foreground mb-4">Completion curve across releases</p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={trendData} margin={{ left: -20 }}>
            <defs>
              <filter id="releaseLineGlow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <linearGradient id="releaseFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
            <YAxis tick={axisStyle} domain={[0, 100]} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: "rgba(59,130,246,0.2)", strokeWidth: 1 }} />
            <Line
              type="monotone"
              dataKey="progress"
              stroke="#3b82f6"
              strokeWidth={2.5}
              dot={{ r: 5, fill: "#3b82f6", strokeWidth: 0 }}
              activeDot={{ r: 7, fill: "#60a5fa", strokeWidth: 0 }}
              name="Progress"
              filter="url(#releaseLineGlow)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Release by Status */}
      <div className={cardClass}>
        <h3 className="font-semibold text-sm mb-0.5">Release by Status</h3>
        <p className="text-xs text-muted-foreground mb-4">Count by current status</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={statusData} margin={{ left: -20 }}>
            <defs>
              {statusData.map((s, i) => (
                <linearGradient key={i} id={`releaseBar${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={s.color} stopOpacity={1} />
                  <stop offset="100%" stopColor={s.color} stopOpacity={0.65} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
            <YAxis tick={axisStyle} allowDecimals={false} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(59,130,246,0.06)" }} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} name="Count">
              {statusData.map((_, i) => <Cell key={i} fill={`url(#releaseBar${i})`} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
