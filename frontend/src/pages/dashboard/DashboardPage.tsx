import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Users, UserCheck, CalendarClock, TrendingUp, Cake, UserPlus, Building2, History } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useDashboardStats } from '@/hooks/use-dashboard'
import { useEmployees } from '@/hooks/use-employees'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatCurrency, formatDate } from '@/lib/format'

const statCards = [
  { key: 'totalEmployees', label: 'Total employees', icon: Users, format: (v: number) => v.toString() },
  { key: 'activeEmployees', label: 'Active', icon: UserCheck, format: (v: number) => v.toString() },
  { key: 'onLeaveEmployees', label: 'On leave', icon: CalendarClock, format: (v: number) => v.toString() },
  { key: 'newHiresThisMonth', label: 'New hires this month', icon: TrendingUp, format: (v: number) => v.toString() },
] as const

const quickActions = [
  { to: '/app/employees', label: 'Add employee', icon: UserPlus },
  { to: '/app/departments', label: 'Manage departments', icon: Building2 },
  { to: '/app/activity', label: 'View activity', icon: History },
] as const

function daysUntilNextBirthday(dateOfBirth: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dob = new Date(dateOfBirth)
  const next = new Date(today.getFullYear(), dob.getMonth(), dob.getDate())
  if (next < today) next.setFullYear(next.getFullYear() + 1)
  return Math.round((next.getTime() - today.getTime()) / 86_400_000)
}

export default function DashboardPage() {
  const { data: stats, isLoading } = useDashboardStats()
  const { data: employeesPage } = useEmployees({ size: 100 })

  const upcomingBirthdays = (employeesPage?.content ?? [])
    .filter((e) => e.dateOfBirth)
    .map((e) => ({ ...e, daysUntil: daysUntilNextBirthday(e.dateOfBirth!) }))
    .filter((e) => e.daysUntil <= 30)
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 5)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl text-ink-900 dark:text-paper-50">Dashboard</h1>
        <p className="mt-1 text-sm text-ink-600 dark:text-paper-300/60">A snapshot of your workforce, right now.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
          >
            <Card>
              <CardBody className="flex items-start justify-between pt-6">
                <div>
                  <p className="text-sm text-ink-600 dark:text-paper-300/60">{stat.label}</p>
                  {isLoading ? (
                    <Skeleton className="mt-2 h-8 w-16" />
                  ) : (
                    <p className="mt-1 font-display text-3xl text-ink-900 dark:text-paper-50">
                      {stat.format(stats ? (stats[stat.key] as number) : 0)}
                    </p>
                  )}
                </div>
                <div className="rounded-lg bg-paper-200 p-2 text-ink-700 dark:bg-ink-800 dark:text-paper-200">
                  <stat.icon size={18} />
                </div>
              </CardBody>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <h2 className="font-display text-lg text-ink-900 dark:text-paper-50">Headcount by department</h2>
          </CardHeader>
          <CardBody className="pt-4">
            {isLoading ? (
              <Skeleton className="h-72 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={288}>
                <BarChart data={stats?.departmentDistribution ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ECEDEC" vertical={false} />
                  <XAxis dataKey="departmentName" tick={{ fontSize: 12, fill: '#5B7B9A' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#5B7B9A' }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: '1px solid #ECEDEC', fontSize: 13 }}
                    cursor={{ fill: '#F6F7F6' }}
                  />
                  <Bar dataKey="employeeCount" fill="#C9A227" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <h2 className="font-display text-lg text-ink-900 dark:text-paper-50">Recent hires</h2>
          </CardHeader>
          <CardBody className="pt-4">
            {isLoading ? (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : stats?.recentHires.length ? (
              <ul className="flex flex-col divide-y divide-paper-200 dark:divide-ink-700">
                {stats.recentHires.map((hire) => (
                  <li key={hire.employeeId} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-ink-900 dark:text-paper-50">{hire.fullName}</p>
                      <p className="text-xs text-ink-600 dark:text-paper-300/50">
                        {hire.designation ?? '—'} · {hire.departmentName ?? 'Unassigned'}
                      </p>
                    </div>
                    <span className="text-xs text-ink-600 dark:text-paper-300/50">{formatDate(hire.joiningDate)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-8 text-center text-sm text-ink-600 dark:text-paper-300/50">No hires recorded yet.</p>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <h2 className="font-display text-lg text-ink-900 dark:text-paper-50">Upcoming birthdays</h2>
          </CardHeader>
          <CardBody className="pt-4">
            {upcomingBirthdays.length > 0 ? (
              <ul className="flex flex-col divide-y divide-paper-200 dark:divide-ink-700">
                {upcomingBirthdays.map((e) => (
                  <li key={e.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-2.5">
                      <Cake size={15} className="text-brass-500" />
                      <p className="text-sm font-medium text-ink-900 dark:text-paper-50">{e.fullName}</p>
                    </div>
                    <span className="text-xs text-ink-600 dark:text-paper-300/50">
                      {e.daysUntil === 0 ? 'Today' : e.daysUntil === 1 ? 'Tomorrow' : `In ${e.daysUntil} days`}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-8 text-center text-sm text-ink-600 dark:text-paper-300/50">
                Nothing in the next 30 days.
              </p>
            )}
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <h2 className="font-display text-lg text-ink-900 dark:text-paper-50">Quick actions</h2>
          </CardHeader>
          <CardBody className="flex flex-col gap-2 pt-4">
            {quickActions.map((action) => (
              <Link
                key={action.to}
                to={action.to}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-800 transition-colors hover:bg-paper-200 dark:text-paper-200 dark:hover:bg-ink-800"
              >
                <action.icon size={16} className="text-ink-600 dark:text-paper-300/60" />
                {action.label}
              </Link>
            ))}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-display text-lg text-ink-900 dark:text-paper-50">Monthly payroll (active employees)</h2>
        </CardHeader>
        <CardBody className="pt-2">
          {isLoading ? (
            <Skeleton className="h-10 w-40" />
          ) : (
            <p className="font-display text-3xl text-ink-900 dark:text-paper-50">{formatCurrency(stats?.totalMonthlySalary)}</p>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
