import clsx from 'clsx'
import type { EmploymentStatus } from '@/types/api'

const statusStyles: Record<EmploymentStatus, string> = {
  ACTIVE: 'bg-signal-green/10 text-signal-green ring-1 ring-signal-green/25',
  ON_LEAVE: 'bg-signal-amber/10 text-signal-amber ring-1 ring-signal-amber/25',
  SUSPENDED: 'bg-slate-450/10 text-slate-450 ring-1 ring-slate-450/25',
  TERMINATED: 'bg-signal-rose/10 text-signal-rose ring-1 ring-signal-rose/25',
}

const statusLabels: Record<EmploymentStatus, string> = {
  ACTIVE: 'Active',
  ON_LEAVE: 'On leave',
  SUSPENDED: 'Suspended',
  TERMINATED: 'Terminated',
}

export function StatusBadge({ status }: { status: EmploymentStatus }) {
  return (
    <span className={clsx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium', statusStyles[status])}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {statusLabels[status]}
    </span>
  )
}

export function RoleBadge({ role }: { role: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-ink-900/5 px-2.5 py-1 text-xs font-medium text-ink-800 ring-1 ring-ink-900/10">
      {role}
    </span>
  )
}
