import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import {
  downloadPayslipPdf, useFinalizePayslip, useGeneratePayroll,
  useMarkPayslipPaid, useMyPayslips, usePayrollSearch,
} from '@/hooks/use-payroll'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { StatusBadge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { NoEmployeeLinkedState } from '@/components/ui/NoEmployeeLinkedState'
import { getErrorMessage } from '@/lib/format'
import { Wallet, Download } from 'lucide-react'

export default function PayrollPage() {
  const { user } = useAuth()
  const isPayrollAdmin = user?.role === 'ADMIN' || user?.role === 'HR'
  return isPayrollAdmin ? <PayrollAdminView /> : <MyPayslipsView />
}

function MyPayslipsView() {
  const { user } = useAuth()
  const hasEmployee = !!user?.employeeId
  const { data } = useMyPayslips(undefined, hasEmployee)

  if (!hasEmployee) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="font-display text-2xl text-ink-900 dark:text-paper-50">My Payslips</h1>
          <p className="mt-1 text-sm text-ink-600 dark:text-paper-300/60">Download or review your monthly payslips.</p>
        </div>
        <NoEmployeeLinkedState
          icon={Wallet}
          feature="payslips"
          adminHint="Payslips are generated per employee from the Payroll admin view."
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl text-ink-900 dark:text-paper-50">My Payslips</h1>
        <p className="mt-1 text-sm text-ink-600 dark:text-paper-300/60">Download or review your monthly payslips.</p>
      </div>
      <Card>
        {!data?.content.length ? (
          <EmptyState icon={<Wallet size={40} />} title="No payslips yet" description="Payslips appear here once HR generates them." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-paper-200 text-left text-xs uppercase text-ink-600/70 dark:border-ink-700 dark:text-paper-300/50">
                <th className="px-4 py-3">Month</th>
                <th className="px-4 py-3">Net Pay</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {data.content.map((p) => (
                <tr key={p.id} className="border-b border-paper-100 last:border-0 dark:border-ink-800">
                  <td className="px-4 py-3">{p.payMonth}</td>
                  <td className="px-4 py-3">₹{(p.netSalary ?? 0).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                  <td className="px-4 py-3">
                    <Button variant="secondary" onClick={() => downloadPayslipPdf(p.id, p.payMonth)}>
                      <Download size={14} /> PDF
                    </Button>
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

function PayrollAdminView() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
  const [error, setError] = useState<string | null>(null)
  const { data } = usePayrollSearch({ month })
  const generateMutation = useGeneratePayroll()
  const finalizeMutation = useFinalizePayslip()
  const markPaidMutation = useMarkPayslipPaid()

  async function handleGenerate() {
    setError(null)
    try {
      await generateMutation.mutateAsync({ month })
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-ink-900 dark:text-paper-50">Payroll</h1>
          <p className="mt-1 text-sm text-ink-600 dark:text-paper-300/60">Generate and manage monthly payslips.</p>
        </div>
        <div className="flex items-center gap-2">
          <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
          <Button onClick={handleGenerate} disabled={generateMutation.isPending}>
            {generateMutation.isPending ? 'Generating…' : 'Generate for month'}
          </Button>
        </div>
      </div>

      {error && <div className="rounded-lg bg-signal-rose/10 px-3.5 py-2.5 text-sm text-signal-rose">{error}</div>}

      <Card>
        {!data?.content.length ? (
          <EmptyState icon={<Wallet size={40} />} title="No payslips for this month" description="Click 'Generate for month' to create them." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-paper-200 text-left text-xs uppercase text-ink-600/70 dark:border-ink-700 dark:text-paper-300/50">
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Gross</th>
                <th className="px-4 py-3">Deductions</th>
                <th className="px-4 py-3">Net Pay</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {data.content.map((p) => (
                <tr key={p.id} className="border-b border-paper-100 last:border-0 dark:border-ink-800">
                  <td className="px-4 py-3">{p.employee?.fullName ?? '—'}</td>
                  <td className="px-4 py-3">₹{(p.grossEarnings ?? 0).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3">
                    ₹{((p.providentFund ?? 0) + (p.professionalTax ?? 0) + (p.unpaidLeaveDeduction ?? 0)).toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3 font-medium">₹{(p.netSalary ?? 0).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                  <td className="flex gap-2 px-4 py-3">
                    {p.status === 'DRAFT' && (
                      <Button variant="secondary" onClick={() => finalizeMutation.mutate(p.id)}>Finalize</Button>
                    )}
                    {p.status === 'FINALIZED' && (
                      <Button variant="secondary" onClick={() => markPaidMutation.mutate(p.id)}>Mark Paid</Button>
                    )}
                    <Button variant="secondary" onClick={() => downloadPayslipPdf(p.id, p.payMonth)}>
                      <Download size={14} />
                    </Button>
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