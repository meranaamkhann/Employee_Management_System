import { ReactNode } from 'react'

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      {icon && <div className="text-ink-600/40">{icon}</div>}
      <div className="space-y-1">
        <p className="font-medium text-ink-900">{title}</p>
        {description && <p className="text-sm text-ink-600">{description}</p>}
      </div>
      {action}
    </div>
  )
}
