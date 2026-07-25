import { useState } from 'react'
import { motion } from 'framer-motion'
import { History, UserCircle, Building2, KeyRound } from 'lucide-react'
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
}

const actionStyles: Record<AuditAction, string> = {
  CREATE: 'text-signal-green bg-signal-green/10',
  UPDATE: 'text-slate-450 bg-slate-450/10',
  DELETE: 'text-signal-rose bg-signal-rose/10',
  RESTORE: 'text-signal-green bg-signal-green/10',
  DEACTIVATE: 'text-signal-rose bg-signal-rose/10',
  ROLE_CHANGE: 'text-signal-amber bg-signal-amber/10',
  LOGIN: 'text-ink-600 bg-paper-200 dark:text-paper-300/70 dark:bg-ink-800',
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
        </Select>
      </div>

      <Card>
        {isLoading ? (
          <TableSkeleton rows={8} cols={4} />
        ) : !data || data.content.length === 0 ? (
          <EmptyState icon={<History size={40} />} title="No activity yet" description="Changes will show up here as they happen." />
        ) : (
          <div className="flex flex-col divide-y divide-paper-200 dark:divide-ink-700">
            {data.content.map((entry, i) => {
              const Icon = entityIcons[entry.entityType]
              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2, delay: Math.min(i * 0.02, 0.3) }}
                  className="flex items-start gap-3 px-6 py-4"
                >
                  <div className="mt-0.5 rounded-lg bg-paper-200 p-1.5 text-ink-700 dark:bg-ink-800 dark:text-paper-200">
                    <Icon size={15} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ${actionStyles[entry.action]}`}>
                        {entry.action.replace('_', ' ')}
                      </span>
                      <p className="text-sm text-ink-900 dark:text-paper-50">{entry.summary ?? entry.entityType}</p>
                    </div>
                    <p className="mt-1 text-xs text-ink-600 dark:text-paper-300/50">
                      {entry.performedByEmail}
                      {entry.performedByRole ? ` · ${entry.performedByRole}` : ''} ·{' '}
                      {new Date(entry.createdAt).toLocaleString()}
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
