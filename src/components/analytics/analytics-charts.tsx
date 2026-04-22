"use client"

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Cell, PieChart, Pie, Legend
} from "recharts"

interface AnalyticsChartsProps {
  sopData: Array<{ name: string; progress: number; readiness: number; delayed: boolean }>
  projectHealth: Array<{ name: string; health: number; status: string }>
  automationData: Array<{ integration: string; phase: string; progress: number }>
  releaseData: Array<{ name: string; progress: number; status: string; delayed: boolean }>
  blockedCount: number
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
            <span className="font-bold text-white">{typeof entry.value === "number" && entry.value <= 100 ? `${entry.value}%` : entry.value}</span>
          </span>
        </div>
      ))}
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SimpleTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-blue-500/25 bg-[#0d1830]/95 backdrop-blur-md px-3 py-2 shadow-xl shadow-blue-900/40 text-xs">
      {label && <p className="font-semibold text-blue-300 mb-1">{label}</p>}
      <p className="text-white font-bold">{payload[0].value}{payload[0].value <= 100 ? "%" : ""}</p>
    </div>
  )
}

const axisStyle = { fill: "#6b82b0", fontSize: 11 }
const gridColor = "rgba(59,130,246,0.07)"

const cardClass =
  "rounded-xl border border-blue-200/40 dark:border-blue-900/30 bg-white/70 dark:bg-[#080e1e]/80 backdrop-blur-sm p-5 shadow-sm shadow-blue-900/10 dark:shadow-blue-900/30 stat-card-accent"

export function AnalyticsCharts({ sopData, projectHealth, automationData, releaseData, blockedCount }: AnalyticsChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

      {/* SOP Progress Chart */}
      <div className={cardClass}>
        <h3 className="font-semibold text-sm mb-0.5">SOP Progress</h3>
        <p className="text-xs text-muted-foreground mb-4">Progress vs readiness across all SOPs</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={sopData.map(s => ({ name: s.name.slice(0, 14), progress: s.progress, readiness: s.readiness }))} margin={{ left: -20 }}>
            <defs>
              <linearGradient id="aProgressGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#60a5fa" stopOpacity={1} />
                <stop offset="100%" stopColor="#2563eb" stopOpacity={0.85} />
              </linearGradient>
              <linearGradient id="aReadinessGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a5b4fc" stopOpacity={1} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0.7} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
            <YAxis tick={axisStyle} domain={[0, 100]} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(59,130,246,0.06)" }} />
            <Bar dataKey="progress" fill="url(#aProgressGrad)" radius={[4, 4, 0, 0]} name="Progress" />
            <Bar dataKey="readiness" fill="url(#aReadinessGrad)" radius={[4, 4, 0, 0]} name="Readiness" />
            <Legend wrapperStyle={{ fontSize: 11, color: "#6b82b0" }} iconType="circle" iconSize={8} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Delay Analysis */}
      <div className={cardClass}>
        <h3 className="font-semibold text-sm mb-0.5">Delay Analysis</h3>
        <p className="text-xs text-muted-foreground mb-4">SOPs by delay status</p>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <defs>
              <filter id="aPieShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="0" stdDeviation="5" floodOpacity="0.4" />
              </filter>
            </defs>
            <Pie
              data={[
                { name: "On Track", value: sopData.filter(s => !s.delayed && s.progress < 100).length },
                { name: "Completed", value: sopData.filter(s => s.progress === 100).length },
                { name: "Delayed", value: sopData.filter(s => s.delayed).length },
              ].filter(d => d.value > 0)}
              cx="50%" cy="50%" innerRadius={58} outerRadius={88} paddingAngle={4} dataKey="value"
              strokeWidth={0} filter="url(#aPieShadow)"
            >
              {["#22c55e", "#3b82f6", "#ef4444"].map((color, i) => <Cell key={i} fill={color} />)}
            </Pie>
            <Tooltip content={
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ({ active, payload }: any) => !active || !payload?.length ? null : (
                <div className="rounded-lg border border-blue-500/25 bg-[#0d1830]/95 px-3 py-2 text-xs shadow-xl">
                  <p className="font-bold text-white">{payload[0].name}: {payload[0].value}</p>
                </div>
              )
            } />
            <Legend wrapperStyle={{ fontSize: 11, color: "#6b82b0" }} iconType="circle" iconSize={8} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Project Health */}
      <div className={cardClass}>
        <h3 className="font-semibold text-sm mb-0.5">Project Health</h3>
        <p className="text-xs text-muted-foreground mb-4">Average SOP completion per project</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={projectHealth} layout="vertical" margin={{ left: 10 }}>
            <defs>
              <linearGradient id="aHealthGreen" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.85} />
                <stop offset="100%" stopColor="#22c55e" stopOpacity={1} />
              </linearGradient>
              <linearGradient id="aHealthYellow" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#d97706" stopOpacity={0.85} />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={1} />
              </linearGradient>
              <linearGradient id="aHealthRed" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#dc2626" stopOpacity={0.85} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
            <XAxis type="number" domain={[0, 100]} tick={axisStyle} axisLine={false} tickLine={false} />
            <YAxis dataKey="name" type="category" tick={axisStyle} width={100} axisLine={false} tickLine={false} />
            <Tooltip content={<SimpleTooltip />} cursor={{ fill: "rgba(59,130,246,0.06)" }} />
            <Bar dataKey="health" radius={[0, 4, 4, 0]} name="Health">
              {projectHealth.map((p, i) => (
                <Cell key={i} fill={p.health >= 80 ? "url(#aHealthGreen)" : p.health >= 50 ? "url(#aHealthYellow)" : "url(#aHealthRed)"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Automation Phase Progress */}
      <div className={cardClass}>
        <h3 className="font-semibold text-sm mb-0.5">Automation Phase Progress</h3>
        <p className="text-xs text-muted-foreground mb-4">Progress across all phases</p>
        {automationData.length === 0 ? (
          <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">No automation data</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={automationData.slice(0, 15)} margin={{ left: -20 }}>
              <defs>
                <linearGradient id="aAutoGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a78bfa" stopOpacity={1} />
                  <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.85} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="integration" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} domain={[0, 100]} axisLine={false} tickLine={false} />
              <Tooltip content={<SimpleTooltip />} cursor={{ fill: "rgba(59,130,246,0.06)" }} />
              <Bar dataKey="progress" fill="url(#aAutoGrad)" radius={[4, 4, 0, 0]} name="Progress" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Release Tracking */}
      <div className={cardClass}>
        <h3 className="font-semibold text-sm mb-0.5">Release Progress</h3>
        <p className="text-xs text-muted-foreground mb-4">Progress across all releases</p>
        {releaseData.length === 0 ? (
          <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">No release data</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={releaseData} margin={{ left: -20 }}>
              <defs>
                <linearGradient id="aReleaseGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                </linearGradient>
                <filter id="lineGlow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} domain={[0, 100]} axisLine={false} tickLine={false} />
              <Tooltip content={<SimpleTooltip />} cursor={{ stroke: "rgba(59,130,246,0.2)", strokeWidth: 1 }} />
              <Line
                type="monotone"
                dataKey="progress"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={{ r: 5, fill: "#10b981", strokeWidth: 0 }}
                activeDot={{ r: 7, fill: "#34d399", strokeWidth: 0 }}
                name="Progress"
                filter="url(#lineGlow)"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Dependency Blocked */}
      <div className={`${cardClass} flex flex-col`}>
        <h3 className="font-semibold text-sm mb-0.5">Dependency Blocked Tasks</h3>
        <p className="text-xs text-muted-foreground mb-4">Tasks waiting on incomplete dependencies</p>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className={`relative inline-block`}>
              <p className={`text-6xl font-bold tracking-tight ${blockedCount > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                {blockedCount}
              </p>
              {blockedCount > 0 && (
                <div className="absolute inset-0 blur-2xl opacity-30 text-6xl font-bold text-amber-400 pointer-events-none select-none">
                  {blockedCount}
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {blockedCount === 0 ? "No blocked tasks" : `task${blockedCount !== 1 ? "s" : ""} blocked`}
            </p>
          </div>
        </div>
      </div>

    </div>
  )
}



