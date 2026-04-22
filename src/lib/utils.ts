import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, isAfter, parseISO } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date?: string | null): string {
  if (!date) return '—'
  try {
    return format(parseISO(date), 'dd MMM yyyy')
  } catch {
    return '—'
  }
}

export function isDelayed(endDate?: string | null, progress?: number): boolean {
  if (!endDate || progress === 100) return false
  return isAfter(new Date(), parseISO(endDate))
}

export function computeSOPProgress(subtasks: { progress: number }[]): number {
  if (!subtasks || subtasks.length === 0) return 0
  const total = subtasks.reduce((sum, t) => sum + (t.progress ?? 0), 0)
  return Math.round(total / subtasks.length)
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'ACTIVE':
    case 'IN_PROGRESS':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300 border border-blue-200/60 dark:border-blue-500/25'
    case 'COMPLETED':
    case 'DONE':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-500/25'
    case 'ON_HOLD':
    case 'PLANNED':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 border border-amber-200/60 dark:border-amber-500/25'
    case 'NOT_STARTED':
    case 'PENDING':
      return 'bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400 border border-slate-200/60 dark:border-slate-500/20'
    default:
      return 'bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400 border border-slate-200/60 dark:border-slate-500/20'
  }
}

export function getStatusLabel(status: string): string {
  return status.replace(/_/g, ' ')
}

export function getProgressColor(progress: number): string {
  if (progress >= 100) return 'bg-green-500'
  if (progress >= 60) return 'bg-blue-500'
  if (progress >= 30) return 'bg-yellow-500'
  return 'bg-red-500'
}

export function phaseLabel(phase: string): string {
  const map: Record<string, string> = {
    VENDOR: 'Vendor Finalization',
    DEVELOPMENT: 'Development',
    SIT: 'SIT',
    UAT: 'UAT',
    GO_LIVE: 'Go-Live',
  }
  return map[phase] ?? phase
}
