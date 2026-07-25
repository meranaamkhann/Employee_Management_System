import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { forgotPasswordSchema, ForgotPasswordFormValues } from '@/lib/schemas'
import { apiClient } from '@/lib/api-client'
import { getErrorMessage } from '@/lib/format'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { ThemeToggleButton } from '@/components/ui/ThemeToggleButton'

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({ resolver: zodResolver(forgotPasswordSchema) })

  async function onSubmit(values: ForgotPasswordFormValues) {
    setServerError(null)
    try {
      await apiClient.post('/auth/forgot-password', values)
      setSubmitted(true)
    } catch (err) {
      setServerError(getErrorMessage(err))
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

        {submitted ? (
          <div className="rounded-2xl border border-paper-300 bg-white p-6 text-center shadow-card dark:border-ink-700 dark:bg-ink-900">
            <CheckCircle2 className="mx-auto mb-3 text-signal-green" size={32} />
            <h1 className="font-display text-xl text-ink-900 dark:text-paper-50">Check your email</h1>
            <p className="mt-1.5 text-sm text-ink-600 dark:text-paper-300/60">
              If an account exists for that address, we've sent a link to reset the password.
            </p>
            <Link to="/login" className="mt-6 inline-block text-sm font-medium text-ink-900 underline dark:text-paper-50">
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <h1 className="font-display text-2xl text-ink-900 dark:text-paper-50">Reset your password</h1>
            <p className="mt-1.5 text-sm text-ink-600 dark:text-paper-300/60">
              Enter your email and we'll send you a link to reset it.
            </p>
            <form onSubmit={handleSubmit(onSubmit)} className="mt-8 flex flex-col gap-4">
              {serverError && (
                <div className="rounded-lg bg-signal-rose/10 px-3.5 py-2.5 text-sm text-signal-rose">
                  {serverError}
                </div>
              )}
              <Input
                label="Email"
                type="email"
                placeholder="you@company.com"
                error={errors.email?.message}
                {...register('email')}
              />
              <Button type="submit" size="lg" className="mt-2 w-full" isLoading={isSubmitting}>
                Send reset link
              </Button>
            </form>
            <Link to="/login" className="mt-6 inline-block text-sm text-ink-600 hover:text-ink-900 dark:text-paper-300/60 dark:hover:text-paper-50">
              ← Back to sign in
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
