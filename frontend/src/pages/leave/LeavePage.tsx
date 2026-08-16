import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useAuth } from '@/lib/auth-context'
import {
  useApplyLeave, useCancelLeave, useLeaveApprovalQueue,
  useMyLeaveBalances, useMyLeaveRequests, useReviewLeave,
} from '@/hooks/use-leave'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { StatusBadge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { NoEmployeeLinkedState } from '@/components/ui/NoEmployeeLinkedState'
import { formatDate, getErrorMessage } from '@/lib/format'
import { CalendarDays, Check, X } from 'lucide-react'

type Tab = 'mine' | 'approvals'

export default function LeavePage() {
  const { user } = useAuth()
  const canReview = user?.role === 'ADMIN' || user?.role === 'HR' || user?.role === 'MANAGER'
  const [tab, setTab] = useState<Tab>('mine')

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl text-ink-900 dark:text-paper-50">Leave</h1>
        <p className="mt-1 text-sm text-ink-600 dark:text-paper-300/60">Apply for leave and track your balances.</p>
      </div>

      {canReview && (
        <div className="flex gap-1 border-b border-paper-200 dark:border-ink-700">
          {(['mine', 'approvals'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium ${tab === t ? 'border-b-2 border-brass-500 text-ink-900 dark:text-paper-50' : 'text-ink-600 dark:text-paper-300/60'}`}
            >
              {t === 'mine' ? 'My Leave' : 'Approvals'}
            </button>
          ))}
        </div>
      )}

      {tab === 'mine' ? <MyLeaveTab /> : <ApprovalsTab />}
    </div>
  )
}

function MyLeaveTab() {
  const { user } = useAuth()
  const hasEmployee = !!user?.employeeId
  const { data: balances } = useMyLeaveBalances(hasEmployee)
  const { data: requests } = useMyLeaveRequests(hasEmployee)
  const applyMutation = useApplyLeave()
  const cancelMutation = useCancelLeave()
  const [formError, setFormError] = useState<string | null>(null)

  const { register, handleSubmit, reset } = useForm({
    defaultValues: { leaveType: 'CASUAL', startDate: '', endDate: '', reason: '' },
  })

  if (!hasEmployee) {
    return (
      <NoEmployeeLinkedState
        icon={CalendarDays}
        feature="applying for leave"
        adminHint="Switch to the Approvals tab to review your team's leave requests."
      />
    )
  }

  async function onSubmit(values: { leaveType: string; startDate: string; endDate: string; reason: string }) {
    setFormError(null)
    if (values.endDate < values.startDate) {
      setFormError('End date cannot be before the start date.')
      return
    }
    try {
      await applyMutation.mutateAsync(values)
      reset()
    } catch (err) {
      setFormError(getErrorMessage(err))
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {balances?.filter((b) => b.leaveType !== 'UNPAID').map((b) => (
          <Card key={b.leaveType} className="p-4">
            <p className="text-xs text-ink-600 dark:text-paper-300/60">{b.leaveType}</p>
            <p className="mt-1 font-display text-xl text-ink-900 dark:text-paper-50">{b.remainingDays}</p>
            <p className="text-xs text-ink-600/70 dark:text-paper-300/50">of {b.allocatedDays} days left</p>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <h2 className="mb-4 text-sm font-medium text-ink-900 dark:text-paper-50">Apply for leave</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-4 sm:items-end">
          <Select label="Type" {...register('leaveType')}>
            <option value="CASUAL">Casual</option>
            <option value="SICK">Sick</option>
            <option value="EARNED">Earned</option>
            <option value="UNPAID">Unpaid</option>
          </Select>
          <Input label="Start date" type="date" {...register('startDate', { required: true })} />
          <Input label="End date" type="date" {...register('endDate', { required: true })} />
          <Button type="submit" disabled={applyMutation.isPending}>
            {applyMutation.isPending ? 'Submitting…' : 'Apply'}
          </Button>
          <div className="sm:col-span-4">
            <Input label="Reason (optional)" {...register('reason')} />
          </div>
        </form>
        {formError && <p className="mt-2 text-sm text-signal-rose">{formError}</p>}
      </Card>

      <Card>
        <div className="border-b border-paper-200 p-4 dark:border-ink-700">
          <h2 className="text-sm font-medium text-ink-900 dark:text-paper-50">Your requests</h2>
        </div>
        {!requests?.content.length ? (
          <EmptyState icon={<CalendarDays size={40} />} title="No leave requests yet" description="Apply above to get started." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-paper-200 text-left text-xs uppercase text-ink-600/70 dark:border-ink-700 dark:text-paper-300/50">
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Dates</th>
                <th className="px-4 py-3">Days</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {requests.content.map((r) => (
                <tr key={r.id} className="border-b border-paper-100 last:border-0 dark:border-ink-800">
                  <td className="px-4 py-3">{r.leaveType}</td>
                  <td className="px-4 py-3">{formatDate(r.startDate)} – {formatDate(r.endDate)}</td>
                  <td className="px-4 py-3">{r.numberOfDays}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-3">
                    {r.status === 'PENDING' && (
                      <Button variant="secondary" onClick={() => cancelMutation.mutate(r.id)}>Cancel</Button>
                    )}
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

function ApprovalsTab() {
  const { data } = useLeaveApprovalQueue({ status: 'PENDING' })
  const reviewMutation = useReviewLeave()

  return (
    <Card>
      <div className="border-b border-paper-200 p-4 dark:border-ink-700">
        <h2 className="text-sm font-medium text-ink-900 dark:text-paper-50">Pending approvals</h2>
      </div>
      {!data?.content.length ? (
        <EmptyState icon={<CalendarDays size={40} />} title="Nothing pending" description="You're all caught up." />
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-paper-200 text-left text-xs uppercase text-ink-600/70 dark:border-ink-700 dark:text-paper-300/50">
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Dates</th>
              <th className="px-4 py-3">Days</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {data.content.map((r) => (
              <tr key={r.id} className="border-b border-paper-100 last:border-0 dark:border-ink-800">
                <td className="px-4 py-3">{r.employee.fullName}</td>
                <td className="px-4 py-3">{r.leaveType}</td>
                <td className="px-4 py-3">{formatDate(r.startDate)} – {formatDate(r.endDate)}</td>
                <td className="px-4 py-3">{r.numberOfDays}</td>
                <td className="flex gap-2 px-4 py-3">
                  <Button onClick={() => reviewMutation.mutate({ id: r.id, action: 'approve' })}>
                    <Check size={14} /> Approve
                  </Button>
                  <Button variant="secondary" onClick={() => reviewMutation.mutate({ id: r.id, action: 'reject' })}>
                    <X size={14} /> Reject
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  )
}