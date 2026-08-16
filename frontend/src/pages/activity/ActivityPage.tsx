import { useState } from 'react'
import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { History, UserCircle, Building2, KeyRound, Clock, CalendarDays, PartyPopper, Wallet } from 'lucide-react'
import { useAuditLogs } from '@/hooks/use-audit-logs'
import { Card } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { Pagination } from '@/components/ui/Pagination'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import type { AuditEntityType, AuditAction } from '@/types/api'

const entityIcons: Record<AuditEntityType, typeof UserCircle> = {
  EMPLOYEE: UserCircle,
  DEPARTMENT: Building2,
  USER_ACCOUNT: KeyRound,
  ATTENDANCE: Clock,
  LEAVE_REQUEST: CalendarDays,
  HOLIDAY: PartyPopper,
  PAYROLL: Wallet,
}

const actionStyles: Record<AuditAction, string> = {
  CREATE: 'text-signal-green bg-signal-green/10',
  UPDATE: 'text-slate-450 bg-slate-450/10',
  DELETE: 'text-signal-rose bg-signal-rose/10',
  RESTORE: 'text-signal-green bg-signal-green/10',
  DEACTIVATE: 'text-signal-rose bg-signal-rose/10',
  ROLE_CHANGE: 'text-signal-amber bg-signal-amber/10',
  LOGIN: 'text-ink-600 bg-paper-200 dark:text-paper-300/70 dark:bg-ink-800',
  APPROVE: 'text-signal-green bg-signal-green/10',
  REJECT: 'text-signal-rose bg-signal-rose/10',
}

export default function ActivityPage() {
  const [entityType, setEntityType] = useState<AuditEntityType | undefined>(undefined)
  const [page, setPage] = useState(0)
  const { data, isLoading } = useAuditLogs(entityType, page)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-ink-900 dark:text-paper-50">Activity history</h1>
          <p className="mt-1 text-sm text-ink-600 dark:text-paper-300/60">
            A record of who changed what, and when.
          </p>
        </div>
        <Select
          value={entityType ?? ''}
          onChange={(e) => {
            setEntityType((e.target.value || undefined) as AuditEntityType | undefined)
            setPage(0)
          }}
          className="sm:w-52"
        >
          <option value="">All activity</option>
          <option value="EMPLOYEE">Employees</option>
          <option value="DEPARTMENT">Departments</option>
          <option value="USER_ACCOUNT">Accounts</option>
          <option value="ATTENDANCE">Attendance</option>
          <option value="LEAVE_REQUEST">Leave</option>
          <option value="HOLIDAY">Holidays</option>
          <option value="PAYROLL">Payroll</option>
        </Select>
      </div>

      <Card>
        {isLoading ? (
          <TableSkeleton rows={8} cols={4} />
        ) : !data || data.content.length === 0 ? (
          <EmptyState icon={<History size={40} />} title="No activity yet" description="Changes will show up here as they happen." />
        ) : (
          <div className="px-6 py-2">
            {data.content.map((entry, i) => {
              const Icon = entityIcons[entry.entityType] ?? History
              const isLast = i === data.content.length - 1
              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.3) }}
                  className="relative flex gap-4 pb-6 last:pb-0"
                >
                  {!isLast && (
                    <span className="absolute left-[15px] top-8 h-full w-px bg-paper-200 dark:bg-ink-700" />
                  )}
                  <div className="relative z-10 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-paper-200 text-ink-700 ring-4 ring-white dark:bg-ink-800 dark:text-paper-200 dark:ring-ink-900">
                    <Icon size={14} />
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ${actionStyles[entry.action] ?? 'text-ink-600 bg-paper-200 dark:text-paper-300/70 dark:bg-ink-800'}`}>
                        {entry.action.replace('_', ' ')}
                      </span>
                      <p className="text-sm text-ink-900 dark:text-paper-50">{entry.summary ?? entry.entityType}</p>
                    </div>
                    <p
                      className="mt-1 text-xs text-ink-600 dark:text-paper-300/50"
                      title={new Date(entry.createdAt).toLocaleString()}
                    >
                      {entry.performedByEmail}
                      {entry.performedByRole ? ` · ${entry.performedByRole}` : ''} ·{' '}
                      {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
        {data && (
          <Pagination page={data.page} totalPages={data.totalPages} totalElements={data.totalElements} onPageChange={setPage} />
        )}
      </Card>
    </div>
  )
}