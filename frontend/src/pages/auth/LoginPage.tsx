import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { loginSchema, LoginFormValues } from '@/lib/schemas'
import { useAuth } from '@/lib/auth-context'
import { getErrorMessage } from '@/lib/format'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) })

  async function onSubmit(values: LoginFormValues) {
    setServerError(null)
    try {
      await login(values.email, values.password)
      navigate('/app/dashboard')
    } catch (err) {
      setServerError(getErrorMessage(err, 'Email or password is incorrect.'))
    }
  }

  return (
    <div className="flex min-h-screen">
      <div className="flex w-full flex-col justify-center px-8 py-12 sm:px-16 lg:w-1/2 lg:px-24">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto w-full max-w-sm"
        >
          <Link to="/" className="mb-10 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-900">
              <span className="font-display text-sm font-semibold text-brass-400">R</span>
            </div>
            <span className="font-display text-lg font-medium text-ink-900">Rosterly</span>
          </Link>

          <h1 className="font-display text-2xl text-ink-900">Welcome back</h1>
          <p className="mt-1.5 text-sm text-ink-600">Sign in to your workspace.</p>

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
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />
            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-sm text-ink-600 hover:text-ink-900">
                Forgot password?
              </Link>
            </div>
            <Button type="submit" size="lg" className="mt-2 w-full" isLoading={isSubmitting}>
              Sign in
            </Button>
          </form>

          <p className="mt-8 text-xs text-ink-600">
            Demo credentials: <span className="font-mono">admin@hrplatform.local</span> — ask your admin
            for the seeded password.
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
