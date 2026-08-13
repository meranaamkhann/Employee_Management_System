import { useState } from 'react'
import { AxiosError } from 'axios'
import { motion } from 'framer-motion'
import {
  Building2, Calendar, Mail, Phone, MapPin, UserCog,
  ShieldCheck, KeyRound, History, Users, Check, Copy, Camera,
} from 'lucide-react'
import { useMyProfile } from '@/hooks/use-my-profile'
import { useAuth } from '@/lib/auth-context'
import { Card, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
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
      ) : notLinked && user && (user.role === 'ADMIN' || user.role === 'IT_ADMIN') ? (
        <SystemAccountCard role={user.role} email={user.email} />
      ) : notLinked ? (
        <OnboardingCard email={user?.email ?? ''} />
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

const permissionsByRole = {
  ADMIN: [
    { icon: Users, text: 'Full access to employee and department records' },
    { icon: KeyRound, text: 'Create, deactivate, and re-role any account' },
    { icon: ShieldCheck, text: 'Visibility into salary and payroll totals' },
    { icon: History, text: 'Full activity history across the platform' },
  ],
  IT_ADMIN: [
    { icon: KeyRound, text: 'Create, deactivate, and re-role accounts' },
    { icon: History, text: 'View the platform activity log' },
    { icon: ShieldCheck, text: 'No access to employee or payroll data, by design' },
  ],
} as const

function SystemAccountCard({ role, email }: { role: 'ADMIN' | 'IT_ADMIN'; email: string }) {
  const title = role === 'ADMIN' ? 'System Administrator' : 'IT Administrator'
  const description =
    role === 'ADMIN'
      ? "This account manages the platform itself rather than holding an employee record. It's not tied to a specific role or department."
      : 'This account manages sign-in access and roles. It intentionally has no visibility into HR or payroll data.'

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card>
        <CardBody className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brass-400/15 text-brass-500">
              <ShieldCheck size={28} />
            </div>
            <div>
              <h2 className="font-display text-xl text-ink-900 dark:text-paper-50">{title}</h2>
              <p className="text-sm text-ink-600 dark:text-paper-300/60">{email}</p>
            </div>
          </div>

          <p className="mt-5 text-sm text-ink-600 dark:text-paper-300/60">{description}</p>

          <div className="mt-6 border-t border-paper-200 pt-6 dark:border-ink-700">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-ink-600 dark:text-paper-300/50">
              Administrative capabilities
            </p>
            <ul className="flex flex-col gap-3">
              {permissionsByRole[role].map((perm, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-ink-800 dark:text-paper-200">
                  <perm.icon size={15} className="shrink-0 text-ink-600 dark:text-paper-300/60" />
                  {perm.text}
                </li>
              ))}
            </ul>
          </div>
        </CardBody>
      </Card>
    </motion.div>
  )
}

function OnboardingCard({ email }: { email: string }) {
  const [copied, setCopied] = useState(false)

  async function copyEmail() {
    await navigator.clipboard.writeText(email)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card>
        <CardBody className="pt-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="group relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-paper-200 text-ink-500 dark:bg-ink-800 dark:text-paper-300/60"
              title="Upload avatar (coming soon)"
            >
              <Camera size={20} className="transition-opacity group-hover:opacity-70" />
            </button>
            <div>
              <h2 className="font-display text-xl text-ink-900 dark:text-paper-50">Let's finish setting up</h2>
              <p className="text-sm text-ink-600 dark:text-paper-300/60">{email}</p>
            </div>
          </div>

          <p className="mt-5 text-sm text-ink-600 dark:text-paper-300/60">
            Your account isn't linked to an employee record yet — that's normal right after signing up.
            HR creates and links your profile, which is what unlocks your department, designation, and
            reporting details here.
          </p>

          <div className="mt-6 flex flex-col gap-3 border-t border-paper-200 pt-6 dark:border-ink-700 sm:flex-row">
            <Button variant="secondary" onClick={copyEmail} className="sm:flex-1">
              {copied ? <Check size={15} /> : <Copy size={15} />}
              {copied ? 'Copied' : 'Copy my account email for HR'}
            </Button>
            <a href="mailto:hr@rosterly.local" className="sm:flex-1">
              <Button className="w-full">Contact HR</Button>
            </a>
          </div>
        </CardBody>
      </Card>
    </motion.div>
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