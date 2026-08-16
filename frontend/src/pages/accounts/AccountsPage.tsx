import { useState } from 'react'
import { useUsers, useLinkEmployee } from '@/hooks/use-users'
import { useEmployees } from '@/hooks/use-employees'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { getErrorMessage } from '@/lib/format'
import { Link2, ShieldCheck } from 'lucide-react'

export default function AccountsPage() {
  const { data: users, isLoading } = useUsers()
  const { data: employeePage } = useEmployees({ page: 0, size: 200 })
  const linkMutation = useLinkEmployee()
  const [pendingUserId, setPendingUserId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleLink(userId: string, employeeId: string) {
    if (!employeeId) return
    setError(null)
    try {
      await linkMutation.mutateAsync({ id: userId, employeeId })
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setPendingUserId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl text-ink-900 dark:text-paper-50">Accounts</h1>
        <p className="mt-1 text-sm text-ink-600 dark:text-paper-300/60">
          Login accounts and which employee profile each one is linked to.
        </p>
      </div>

      {error && <div className="rounded-lg bg-signal-rose/10 px-3.5 py-2.5 text-sm text-signal-rose">{error}</div>}

      <Card>
        {isLoading ? (
          <TableSkeleton />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-paper-200 text-left text-xs uppercase text-ink-600/70 dark:border-ink-700 dark:text-paper-300/50">
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Linked employee</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {users?.map((u) => (
                <tr key={u.id} className="border-b border-paper-100 last:border-0 dark:border-ink-800">
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3">{u.role}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        u.active
                          ? 'inline-flex items-center gap-1.5 rounded-full bg-signal-green/10 px-2.5 py-1 text-xs font-medium text-signal-green ring-1 ring-signal-green/25'
                          : 'inline-flex items-center gap-1.5 rounded-full bg-slate-450/10 px-2.5 py-1 text-xs font-medium text-slate-450 ring-1 ring-slate-450/25'
                      }
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {u.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.employeeName ? (
                      <span className="inline-flex items-center gap-1.5 text-ink-900 dark:text-paper-50">
                        <ShieldCheck size={14} className="text-signal-green" /> {u.employeeName}
                      </span>
                    ) : (
                      <span className="text-ink-600/60 dark:text-paper-300/40">Not linked</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {!u.employeeId && (
                      pendingUserId === u.id ? (
                        <Select
                          autoFocus
                          onChange={(e) => handleLink(u.id, e.target.value)}
                          onBlur={() => setPendingUserId(null)}
                          defaultValue=""
                        >
                          <option value="" disabled>Select employee…</option>
                          {employeePage?.content.map((emp) => (
                            <option key={emp.id} value={emp.id}>
                              {emp.fullName} ({emp.employeeCode})
                            </option>
                          ))}
                        </Select>
                      ) : (
                        <Button variant="secondary" onClick={() => setPendingUserId(u.id)}>
                          <Link2 size={14} /> Link employee
                        </Button>
                      )
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