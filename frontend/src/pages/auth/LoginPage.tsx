import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { loginSchema, LoginFormValues } from '@/lib/schemas'
import { useAuth } from '@/lib/auth-context'
import { getDefaultRouteForRole } from '@/lib/routing'
import { getErrorMessage, getFieldErrors } from '@/lib/format'
import { Input } from '@/components/ui/Input'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { Button } from '@/components/ui/Button'
import { ThemeToggleButton } from '@/components/ui/ThemeToggleButton'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) })

  async function onSubmit(values: LoginFormValues) {
    setServerError(null)
    try {
      const authUser = await login(values.email, values.password)
      navigate(getDefaultRouteForRole(authUser.role))
    } catch (err) {
      // Surface the SPECIFIC field reason from the backend (e.g. "Email must
      // be a valid address") instead of only the generic top-level message —
      // otherwise a validation failure looks identical to a typo with no clue
      // which field caused it.
      const fieldErrors = getFieldErrors(err)
      let matchedAny = false
      if (fieldErrors) {
        Object.entries(fieldErrors).forEach(([field, message]) => {
          if (field === 'email' || field === 'password') {
            setError(field as keyof LoginFormValues, { message })
            matchedAny = true
          }
        })
      }
      // Always fall back to a visible banner if nothing was matched onto a
      // field — a validation error must never fail completely silently.
      if (!matchedAny) {
        setServerError(getErrorMessage(err, 'Email or password is incorrect.'))
      }
    }
  }

  return (
    <div className="flex min-h-screen bg-paper-100 dark:bg-ink-950">
      <div className="flex w-full flex-col justify-center px-8 py-12 sm:px-16 lg:w-1/2 lg:px-24">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto w-full max-w-sm"
        >
          <div className="mb-10 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-900 dark:bg-brass-400">
                <span className="font-display text-sm font-semibold text-brass-400 dark:text-ink-950">R</span>
              </div>
              <span className="font-display text-lg font-medium text-ink-900 dark:text-paper-50">Rosterly</span>
            </Link>
            <ThemeToggleButton />
          </div>

          <h1 className="font-display text-2xl text-ink-900 dark:text-paper-50">Welcome back</h1>
          <p className="mt-1.5 text-sm text-ink-600 dark:text-paper-300/60">Sign in to your workspace.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 flex flex-col gap-4">
            {serverError && (
              <div className="rounded-lg bg-signal-rose/10 px-3.5 py-2.5 text-sm text-signal-rose">
                {serverError}
              </div>
            )}
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              error={errors.email?.message}
              {...register('email')}
            />
            <PasswordInput
              label="Password"
              autoComplete="current-password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />
            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-sm text-ink-600 hover:text-ink-900 dark:text-paper-300/60 dark:hover:text-paper-50">
                Forgot password?
              </Link>
            </div>
            <Button type="submit" size="lg" className="mt-2 w-full" isLoading={isSubmitting}>
              Sign in
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-600 dark:text-paper-300/60">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-ink-900 underline dark:text-paper-50">
              Create account
            </Link>
          </p>

          <p className="mt-6 text-center text-xs text-ink-600 dark:text-paper-300/50">
            By signing in you agree to Rosterly's Terms and Privacy Policy.
          </p>
        </motion.div>
      </div>

      <div className="relative hidden overflow-hidden bg-ink-950 lg:block lg:w-1/2">
        <div className="noise absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-br from-ink-900 via-ink-950 to-ink-950" />
        <div className="relative flex h-full flex-col items-center justify-center px-12 text-center">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="font-display text-3xl leading-snug text-paper-100"
          >
            "Switching to Rosterly gave our HR team back an entire day every week."
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-6 text-sm text-paper-300/70"
          >
            Head of People, mid-size logistics company
          </motion.p>
        </div>
      </div>
    </div>
  )
}
