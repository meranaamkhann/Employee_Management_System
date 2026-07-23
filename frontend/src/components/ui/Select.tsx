import { SelectHTMLAttributes, forwardRef } from 'react'
import clsx from 'clsx'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, id, children, ...props }, ref) => {
    const selectId = id ?? props.name
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-ink-800">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={clsx(
            'w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-ink-900',
            'transition-colors focus:outline-none focus:ring-2 focus:ring-brass-400/50',
            error ? 'border-signal-rose' : 'border-paper-300 focus:border-brass-500',
            className,
          )}
          {...props}
        >
          {children}
        </select>
        {error && <span className="text-xs text-signal-rose">{error}</span>}
      </div>
    )
  },
)
Select.displayName = 'Select'
