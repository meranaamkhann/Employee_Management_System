import { InputHTMLAttributes, forwardRef } from 'react'
import clsx from 'clsx'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id ?? props.name
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-ink-800">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={clsx(
            'w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-600/50',
            'transition-colors focus:outline-none focus:ring-2 focus:ring-brass-400/50',
            error ? 'border-signal-rose' : 'border-paper-300 focus:border-brass-500',
            className,
          )}
          aria-invalid={!!error}
          {...props}
        />
        {error && <span className="text-xs text-signal-rose">{error}</span>}
        {hint && !error && <span className="text-xs text-ink-600">{hint}</span>}
      </div>
    )
  },
)
Input.displayName = 'Input'
