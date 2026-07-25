import { InputHTMLAttributes, forwardRef, useState } from 'react'
import clsx from 'clsx'
import { Eye, EyeOff } from 'lucide-react'

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  error?: string
  hint?: string
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const [visible, setVisible] = useState(false)
    const inputId = id ?? props.name

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-ink-800 dark:text-paper-200">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={visible ? 'text' : 'password'}
            className={clsx(
              'w-full rounded-lg border bg-white px-3.5 py-2.5 pr-10 text-sm text-ink-900 placeholder:text-ink-600/50',
              'dark:bg-ink-800 dark:text-paper-50 dark:placeholder:text-paper-300/40',
              'transition-colors focus:outline-none focus:ring-2 focus:ring-brass-400/50',
              error ? 'border-signal-rose' : 'border-paper-300 focus:border-brass-500 dark:border-ink-600',
              className,
            )}
            aria-invalid={!!error}
            {...props}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            tabIndex={-1}
            aria-label={visible ? 'Hide password' : 'Show password'}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-ink-600/60 transition-colors hover:text-ink-900 dark:text-paper-300/50 dark:hover:text-paper-50"
          >
            {visible ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {error && <span className="text-xs text-signal-rose">{error}</span>}
        {hint && !error && <span className="text-xs text-ink-600 dark:text-paper-300/50">{hint}</span>}
      </div>
    )
  },
)
PasswordInput.displayName = 'PasswordInput'
