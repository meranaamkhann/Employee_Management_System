import { AxiosError } from 'axios'
import { motion } from 'framer-motion'
import { Building2, Calendar, Mail, Phone, MapPin, UserCog } from 'lucide-react'
import { useMyProfile } from '@/hooks/use-my-profile'
import { useAuth } from '@/lib/auth-context'
import { Card, CardBody } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatusBadge } from '@/components/ui/Badge'
import { formatCurrency, formatDate, initials } from '@/lib/format'

export default function ProfilePage() {
  const { user } = useAuth()
  const { data: employee, isLoading, isError, error } = useMyProfile()

  const notLinked = isError && error instanceof AxiosError && error.response?.status === 404

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl text-ink-900 dark:text-paper-50">Profile</h1>
        <p className="mt-1 text-sm text-ink-600 dark:text-paper-300/60">Your account and employee details.</p>
      </div>

      {isLoading ? (
        <Card>
          <CardBody className="pt-6">
            <Skeleton className="h-24 w-full" />
          </CardBody>
        </Card>
      ) : notLinked ? (
        <Card>
          <EmptyState
            icon={<UserCog size={40} />}
            title="No employee record linked"
            description={`Your account (${user?.email}) isn't linked to an employee profile. Ask an admin or HR to link one if you need your HR details shown here.`}
          />
        </Card>
      ) : employee ? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Card>
            <CardBody className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-paper-200 font-display text-xl text-ink-800 dark:bg-ink-800 dark:text-paper-100">
                  {initials(employee.fullName)}
                </div>
                <div>
                  <h2 className="font-display text-xl text-ink-900 dark:text-paper-50">{employee.fullName}</h2>
                  <p className="font-mono text-xs text-ink-600 dark:text-paper-300/50">{employee.employeeCode}</p>
                  <div className="mt-1.5">
                    <StatusBadge status={employee.status} />
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 border-t border-paper-200 pt-6 dark:border-ink-700 sm:grid-cols-2">
                <InfoRow icon={Mail} label="Email" value={employee.email} />
                <InfoRow icon={Phone} label="Phone" value={employee.phone ?? '—'} />
                <InfoRow icon={Building2} label="Department" value={employee.department?.name ?? 'Unassigned'} />
                <InfoRow icon={UserCog} label="Designation" value={employee.designation ?? '—'} />
                <InfoRow icon={Calendar} label="Joined" value={formatDate(employee.joiningDate)} />
                <InfoRow
                  icon={MapPin}
                  label="Location"
                  value={[employee.city, employee.country].filter(Boolean).join(', ') || '—'}
                />
              </div>

              {employee.manager && (
                <div className="mt-6 border-t border-paper-200 pt-6 dark:border-ink-700">
                  <p className="text-sm text-ink-600 dark:text-paper-300/60">
                    Reports to <span className="font-medium text-ink-900 dark:text-paper-50">{employee.manager.fullName}</span>
                  </p>
                </div>
              )}

              {(user?.role === 'ADMIN' || user?.role === 'HR') && (
                <div className="mt-6 border-t border-paper-200 pt-6 dark:border-ink-700">
                  <p className="text-sm text-ink-600 dark:text-paper-300/60">
                    Annual salary:{' '}
                    <span className="font-medium text-ink-900 dark:text-paper-50">{formatCurrency(employee.salary)}</span>
                  </p>
                </div>
              )}
            </CardBody>
          </Card>
        </motion.div>
      ) : null}
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 rounded-lg bg-paper-200 p-1.5 text-ink-700 dark:bg-ink-800 dark:text-paper-200">
        <Icon size={14} />
      </div>
      <div>
        <p className="text-xs text-ink-600 dark:text-paper-300/50">{label}</p>
        <p className="text-sm font-medium text-ink-900 dark:text-paper-50">{value}</p>
      </div>
    </div>
  )
}
