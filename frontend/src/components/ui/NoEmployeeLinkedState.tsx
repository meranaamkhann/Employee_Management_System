import { Card } from '@/components/ui/Card'
import { useAuth } from '@/lib/auth-context'
import type { LucideIcon } from 'lucide-react'

interface Props {
  icon: LucideIcon
  feature: string
  adminHint: string
}

export function NoEmployeeLinkedState({ icon: Icon, feature, adminHint }: Props) {
  const { user } = useAuth()
  const isAdminOrHr = user?.role === 'ADMIN' || user?.role === 'HR'

  return (
    <Card className="p-8 text-center">
      <Icon size={32} className="mx-auto mb-3 text-ink-600/40 dark:text-paper-300/30" />
      <p className="text-sm font-medium text-ink-900 dark:text-paper-50">No employee profile linked</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-ink-600 dark:text-paper-300/60">
        This account isn't linked to an employee record, so {feature} isn't available here.{' '}
        {isAdminOrHr ? adminHint : 'Contact HR to have your account linked to your employee profile.'}
      </p>
    </Card>
  )
}