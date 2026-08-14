import clsx from 'clsx'
import type { AttendanceStatus, EmploymentStatus, LeaveStatus, PayslipStatus } from '@/types/api'

type AnyStatus = EmploymentStatus | AttendanceStatus | LeaveStatus | PayslipStatus

const statusStyles: Record<AnyStatus, string> = {
  // Employment
  ACTIVE: 'bg-signal-green/10 text-signal-green ring-1 ring-signal-green/25',
  ON_LEAVE: 'bg-signal-amber/10 text-signal-amber ring-1 ring-signal-amber/25',
  SUSPENDED: 'bg-slate-450/10 text-slate-450 ring-1 ring-slate-450/25',
  TERMINATED: 'bg-signal-rose/10 text-signal-rose ring-1 ring-signal-rose/25',

  // Attendance (ON_LEAVE shared with Employment above)
  PRESENT: 'bg-signal-green/10 text-signal-green ring-1 ring-signal-green/25',
  LATE: 'bg-signal-amber/10 text-signal-amber ring-1 ring-signal-amber/25',
  HALF_DAY: 'bg-sky-500/10 text-sky-600 ring-1 ring-sky-500/25',
  ABSENT: 'bg-signal-rose/10 text-signal-rose ring-1 ring-signal-rose/25',

  // Leave
  PENDING: 'bg-signal-amber/10 text-signal-amber ring-1 ring-signal-amber/25',
  APPROVED: 'bg-signal-green/10 text-signal-green ring-1 ring-signal-green/25',
  REJECTED: 'bg-signal-rose/10 text-signal-rose ring-1 ring-signal-rose/25',
  CANCELLED: 'bg-slate-450/10 text-slate-450 ring-1 ring-slate-450/25',

  // Payroll
  DRAFT: 'bg-slate-450/10 text-slate-450 ring-1 ring-slate-450/25',
  FINALIZED: 'bg-sky-500/10 text-sky-600 ring-1 ring-sky-500/25',
  PAID: 'bg-signal-green/10 text-signal-green ring-1 ring-signal-green/25',
}

const statusLabels: Record<AnyStatus, string> = {
  ACTIVE: 'Active',
  ON_LEAVE: 'On leave',
  SUSPENDED: 'Suspended',
  TERMINATED: 'Terminated',
  PRESENT: 'Present',
  LATE: 'Late',
  HALF_DAY: 'Half day',
  ABSENT: 'Absent',
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
  DRAFT: 'Draft',
  FINALIZED: 'Finalized',
  PAID: 'Paid',
}

export function StatusBadge({ status }: { status: AnyStatus }) {
  return (
    <span className={clsx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium', statusStyles[status])}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {statusLabels[status]}
    </span>
  )
}

export function RoleBadge({ role }: { role: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-ink-900/5 px-2.5 py-1 text-xs font-medium text-ink-800 ring-1 ring-ink-900/10 dark:bg-white/5 dark:text-paper-200 dark:ring-white/10">
      {role}
    </span>
  )
}