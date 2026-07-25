import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, AlertTriangle } from 'lucide-react'
import { resetPasswordSchema, ResetPasswordFormValues } from '@/lib/schemas'
import { apiClient } from '@/lib/api-client'
import { getErrorMessage } from '@/lib/format'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { Button } from '@/components/ui/Button'
import { ThemeToggleButton } from '@/components/ui/ThemeToggleButton'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({ resolver: zodResolver(resetPasswordSchema) })

  async function onSubmit(values: ResetPasswordFormValues) {
    if (!token) return
    setServerError(null)
    try {
      await apiClient.post('/auth/reset-password', { token, newPassword: values.newPassword })
      setDone(true)
    } catch (err) {
      setServerError(getErrorMessage(err, 'That reset link is invalid or has expired.'))
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper-100 px-6 dark:bg-ink-950">
      <div className="w-full max-w-sm">
        <div className="mb-10 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-900 dark:bg-brass-400">
              <span className="font-display text-sm font-semibold text-brass-400 dark:text-ink-950">R</span>
            </div>
            <span className="font-display text-lg font-medium text-ink-900 dark:text-paper-50">Rosterly</span>
          </Link>
          <ThemeToggleButton />
        </div>

        {!token ? (
          <div className="rounded-2xl border border-paper-300 bg-white p-6 text-center shadow-card dark:border-ink-700 dark:bg-ink-900">
            <AlertTriangle className="mx-auto mb-3 text-signal-amber" size={32} />
            <h1 className="font-display text-xl text-ink-900 dark:text-paper-50">Missing reset link</h1>
            <p className="mt-1.5 text-sm text-ink-600 dark:text-paper-300/60">
              This page needs a reset token from your email link.
            </p>
            <Link to="/forgot-password" className="mt-6 inline-block text-sm font-medium text-ink-900 underline dark:text-paper-50">
              Request a new link
            </Link>
          </div>
        ) : done ? (
          <div className="rounded-2xl border border-paper-300 bg-white p-6 text-center shadow-card dark:border-ink-700 dark:bg-ink-900">
            <CheckCircle2 className="mx-auto mb-3 text-signal-green" size={32} />
            <h1 className="font-display text-xl text-ink-900 dark:text-paper-50">Password updated</h1>
            <p className="mt-1.5 text-sm text-ink-600 dark:text-paper-300/60">You can now sign in with your new password.</p>
            <Button className="mt-6 w-full" onClick={() => navigate('/login')}>
              Go to sign in
            </Button>
          </div>
        ) : (
          <>
            <h1 className="font-display text-2xl text-ink-900 dark:text-paper-50">Set a new password</h1>
            <p className="mt-1.5 text-sm text-ink-600 dark:text-paper-300/60">Choose a new password for your account.</p>
            <form onSubmit={handleSubmit(onSubmit)} className="mt-8 flex flex-col gap-4">
              {serverError && (
                <div className="rounded-lg bg-signal-rose/10 px-3.5 py-2.5 text-sm text-signal-rose">
                  {serverError}
                </div>
              )}
              <PasswordInput
                label="New password"
                autoComplete="new-password"
                hint="At least 8 characters, with upper, lower, a number, and a symbol."
                error={errors.newPassword?.message}
                {...register('newPassword')}
              />
              <PasswordInput
                label="Confirm new password"
                autoComplete="new-password"
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />
              <Button type="submit" size="lg" className="mt-2 w-full" isLoading={isSubmitting}>
                Update password
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
