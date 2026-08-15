import { useMemo, useState } from 'react'
import { useClockIn, useClockOut, useMonthlySummary, useMyAttendance } from '@/hooks/use-attendance'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/Badge'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate, formatTime, getErrorMessage } from '@/lib/format'
import { Clock, LogIn, LogOut, CalendarCheck } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

export default function AttendancePage() {
  const { user } = useAuth()
  const currentMonth = new Date().toISOString().slice(0, 7)
  const [actionError, setActionError] = useState<string | null>(null)

  const { data, isLoading } = useMyAttendance({ page: 0 })
  const { data: summary } = useMonthlySummary(currentMonth)
  const clockInMutation = useClockIn()
  const clockOutMutation = useClockOut()

  const todayRecord = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return data?.content.find((r) => r.workDate === today)
  }, [data])

  async function handleClockIn() {
    setActionError(null)
    try {
      await clockInMutation.mutateAsync()
    } catch (err) {
      setActionError(getErrorMessage(err))
    }
  }

  async function handleClockOut() {
    setActionError(null)
    try {
      await clockOutMutation.mutateAsync()
    } catch (err) {
      setActionError(getErrorMessage(err))
    }
  }
   if (!user?.employeeId) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="font-display text-2xl text-ink-900 dark:text-paper-50">Attendance</h1>
          <p className="mt-1 text-sm text-ink-600 dark:text-paper-300/60">Your clock-in history and this month's summary.</p>
        </div>
        <Card className="p-8 text-center">
          <Clock size={32} className="mx-auto mb-3 text-ink-600/40 dark:text-paper-300/30" />
          <p className="text-sm font-medium text-ink-900 dark:text-paper-50">No employee profile linked</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-ink-600 dark:text-paper-300/60">
            This account isn't linked to an employee record, so personal clock-in tracking isn't available here.
            {user?.role === 'ADMIN' || user?.role === 'HR'
              ? ' You can still manage attendance for your team from the Employees page.'
              : ' Contact HR to have your account linked to your employee profile.'}
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl text-ink-900 dark:text-paper-50">Attendance</h1>
        <p className="mt-1 text-sm text-ink-600 dark:text-paper-300/60">Your clock-in history and this month's summary.</p>
      </div>

      <Card className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brass-400/15 text-brass-500">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-sm font-medium text-ink-900 dark:text-paper-50">
              {todayRecord ? `Clocked in at ${formatTime(todayRecord.clockIn)}` : "You haven't clocked in today"}
            </p>
            {todayRecord?.clockOut && (
              <p className="text-xs text-ink-600 dark:text-paper-300/60">Clocked out at {formatTime(todayRecord.clockOut)}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {!todayRecord && (
            <Button onClick={handleClockIn} disabled={clockInMutation.isPending}>
              <LogIn size={16} /> {clockInMutation.isPending ? 'Clocking in…' : 'Clock in'}
            </Button>
          )}
          {todayRecord && !todayRecord.clockOut && (
            <Button onClick={handleClockOut} disabled={clockOutMutation.isPending}>
              <LogOut size={16} /> {clockOutMutation.isPending ? 'Clocking out…' : 'Clock out'}
            </Button>
          )}
        </div>
      </Card>

      {actionError && <div className="rounded-lg bg-signal-rose/10 px-3.5 py-2.5 text-sm text-signal-rose">{actionError}</div>}

      {summary && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            { label: 'Present', value: summary.presentDays },
            { label: 'Late', value: summary.lateDays },
            { label: 'Half day', value: summary.halfDays },
            { label: 'Absent', value: summary.absentDays },
            { label: 'On leave', value: summary.onLeaveDays },
          ].map((stat) => (
            <Card key={stat.label} className="p-4">
              <p className="text-xs text-ink-600 dark:text-paper-300/60">{stat.label}</p>
              <p className="mt-1 font-display text-xl text-ink-900 dark:text-paper-50">{stat.value}</p>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <div className="border-b border-paper-200 p-4 dark:border-ink-700">
          <h2 className="text-sm font-medium text-ink-900 dark:text-paper-50">Recent history</h2>
        </div>
        {isLoading ? (
          <TableSkeleton />
        ) : !data?.content.length ? (
          <EmptyState icon={<CalendarCheck size={40} />} title="No attendance records yet" description="Clock in to start your history." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-paper-200 text-left text-xs uppercase text-ink-600/70 dark:border-ink-700 dark:text-paper-300/50">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Clock in</th>
                <th className="px-4 py-3">Clock out</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.content.map((record) => (
                <tr key={record.id} className="border-b border-paper-100 last:border-0 dark:border-ink-800">
                  <td className="px-4 py-3">{formatDate(record.workDate)}</td>
                  <td className="px-4 py-3">{formatTime(record.clockIn)}</td>
                  <td className="px-4 py-3">{formatTime(record.clockOut)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={record.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}