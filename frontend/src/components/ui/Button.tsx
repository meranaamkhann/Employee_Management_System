import { ButtonHTMLAttributes, forwardRef } from 'react'
import clsx from 'clsx'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

const variants = {
  primary: 'bg-ink-900 text-white hover:bg-ink-800 disabled:bg-ink-600',
  secondary: 'bg-paper-200 text-ink-900 hover:bg-paper-300 border border-paper-300',
  ghost: 'bg-transparent text-ink-700 hover:bg-paper-200',
  danger: 'bg-signal-rose text-white hover:bg-signal-rose/90',
}

const sizes = {
  sm: 'text-sm px-3 py-1.5 rounded-lg gap-1.5',
  md: 'text-sm px-4 py-2.5 rounded-lg gap-2',
  lg: 'text-base px-5 py-3 rounded-xl gap-2',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={clsx(
          'inline-flex items-center justify-center font-medium transition-all duration-150 ease-out',
          'disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]',
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      >
        {isLoading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : null}
        {children}
      </button>
    )
  },
)
Button.displayName = 'Button'
