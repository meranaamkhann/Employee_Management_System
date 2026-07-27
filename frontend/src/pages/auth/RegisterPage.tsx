import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { registerSchema, RegisterFormValues } from '@/lib/schemas'
import { useAuth } from '@/lib/auth-context'
import { getDefaultRouteForRole } from '@/lib/routing'
import { getErrorMessage, getFieldErrors } from '@/lib/format'
import { Input } from '@/components/ui/Input'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { Button } from '@/components/ui/Button'
import { ThemeToggleButton } from '@/components/ui/ThemeToggleButton'

export default function RegisterPage() {
  const { register: registerAccount } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) })

  async function onSubmit(values: RegisterFormValues) {
    setServerError(null)
    try {
      const authUser = await registerAccount(values.fullName, values.email, values.password)
      navigate(getDefaultRouteForRole(authUser.role))
    } catch (err) {
      const fieldErrors = getFieldErrors(err)
      let matchedAny = false
      if (fieldErrors) {
        Object.entries(fieldErrors).forEach(([field, message]) => {
          if (field === 'fullName' || field === 'email' || field === 'password') {
            setError(field as keyof RegisterFormValues, { message })
            matchedAny = true
          }
        })
      }
      // Always fall back to a visible banner if nothing was matched onto a
      // field — a validation error must never fail completely silently.
      if (!matchedAny) {
        setServerError(getErrorMessage(err, 'Could not create your account.'))
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper-100 px-6 py-12 dark:bg-ink-950">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm"
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

        <h1 className="font-display text-2xl text-ink-900 dark:text-paper-50">Create your account</h1>
        <p className="mt-1.5 text-sm text-ink-600 dark:text-paper-300/60">
          New accounts start with employee-level access. An admin can link your HR
          profile and adjust your role afterward.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 flex flex-col gap-4">
          {serverError && (
            <div className="rounded-lg bg-signal-rose/10 px-3.5 py-2.5 text-sm text-signal-rose">
              {serverError}
            </div>
          )}
          <Input label="Full name" autoComplete="name" error={errors.fullName?.message} {...register('fullName')} />
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
            autoComplete="new-password"
            hint="At least 8 characters, with upper, lower, a number, and a symbol."
            error={errors.password?.message}
            {...register('password')}
          />
          <PasswordInput
            label="Confirm password"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
          <Button type="submit" size="lg" className="mt-2 w-full" isLoading={isSubmitting}>
            Create account
          </Button>
        </form>

        <p className="mt-8 text-center text-sm text-ink-600 dark:text-paper-300/60">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-ink-900 underline dark:text-paper-50">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
