import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Moon, Sun, ShieldCheck, UserPlus, Trash2, KeyRound } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useTheme } from '@/lib/theme-context'
import { apiClient } from '@/lib/api-client'
import { changePasswordSchema, ChangePasswordFormValues } from '@/lib/schemas'
import { useChangeUserRole, useCreateUser, useDeactivateUser, useUsers } from '@/hooks/use-users'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { getErrorMessage, getFieldErrors } from '@/lib/format'
import type { Role } from '@/types/api'

const roleOptions: { value: Role; label: string }[] = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'IT_ADMIN', label: 'IT Admin' },
  { value: 'HR', label: 'HR' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'EMPLOYEE', label: 'Employee' },
]

export default function SettingsPage() {
  const { user } = useAuth()
  const canManageAccounts = user?.role === 'ADMIN' || user?.role === 'IT_ADMIN'

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl text-ink-900 dark:text-paper-50">Settings</h1>
        <p className="mt-1 text-sm text-ink-600 dark:text-paper-300/60">Manage your preferences and account.</p>
      </div>

      <AccountSection />
      <AppearanceSection />
      <ChangePasswordSection />
      <SecuritySection />
      {canManageAccounts && <TeamAccountsSection />}
    </div>
  )
}

function AccountSection() {
  const { user } = useAuth()
  return (
    <Card>
      <CardHeader>
        <h2 className="font-display text-lg text-ink-900 dark:text-paper-50">Account</h2>
      </CardHeader>
      <CardBody className="pt-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-ink-600 dark:text-paper-300/50">Email</p>
            <p className="text-sm font-medium text-ink-900 dark:text-paper-50">{user?.email}</p>
          </div>
          <div>
            <p className="text-xs text-ink-600 dark:text-paper-300/50">Role</p>
            <p className="text-sm font-medium text-ink-900 dark:text-paper-50">{user?.role}</p>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}

function AppearanceSection() {
  const { theme, toggleTheme } = useTheme()
  return (
    <Card>
      <CardHeader>
        <h2 className="font-display text-lg text-ink-900 dark:text-paper-50">Appearance</h2>
      </CardHeader>
      <CardBody className="pt-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-ink-900 dark:text-paper-50">Theme</p>
            <p className="text-sm text-ink-600 dark:text-paper-300/60">
              Currently using {theme === 'dark' ? 'dark' : 'light'} mode.
            </p>
          </div>
          <Button variant="secondary" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            Switch to {theme === 'dark' ? 'light' : 'dark'}
          </Button>
        </div>
      </CardBody>
    </Card>
  )
}

function ChangePasswordSection() {
  const [serverError, setServerError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormValues>({ resolver: zodResolver(changePasswordSchema) })

  async function onSubmit(values: ChangePasswordFormValues) {
    setServerError(null)
    setSuccess(false)
    try {
      await apiClient.post('/auth/change-password', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })
      reset()
      setSuccess(true)
    } catch (err) {
      const fieldErrors = getFieldErrors(err)
      if (fieldErrors?.currentPassword || fieldErrors?.newPassword) {
        Object.entries(fieldErrors).forEach(([field, message]) =>
          setError(field as keyof ChangePasswordFormValues, { message }),
        )
      } else {
        setServerError(getErrorMessage(err, 'Current password is incorrect.'))
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="font-display text-lg text-ink-900 dark:text-paper-50">Change password</h2>
      </CardHeader>
      <CardBody className="pt-4">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {serverError && (
            <div className="rounded-lg bg-signal-rose/10 px-3.5 py-2.5 text-sm text-signal-rose">{serverError}</div>
          )}
          {success && (
            <div className="rounded-lg bg-signal-green/10 px-3.5 py-2.5 text-sm text-signal-green">
              Password updated.
            </div>
          )}
          <PasswordInput
            label="Current password"
            autoComplete="current-password"
            error={errors.currentPassword?.message}
            {...register('currentPassword')}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <PasswordInput
              label="New password"
              autoComplete="new-password"
              hint="8+ chars, upper, lower, number, symbol."
              error={errors.newPassword?.message}
              {...register('newPassword')}
            />
            <PasswordInput
              label="Confirm new password"
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" isLoading={isSubmitting}>
              <KeyRound size={15} /> Update password
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  )
}

function SecuritySection() {
  const { user } = useAuth()
  const [status, setStatus] = useState<'idle' | 'sent' | 'error'>('idle')

  async function sendResetLink() {
    if (!user?.email) return
    setStatus('idle')
    try {
      await apiClient.post('/auth/forgot-password', { email: user.email })
      setStatus('sent')
    } catch {
      setStatus('error')
    }
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="font-display text-lg text-ink-900 dark:text-paper-50">Account recovery</h2>
      </CardHeader>
      <CardBody className="pt-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-ink-900 dark:text-paper-50">Forgot your password?</p>
            <p className="text-sm text-ink-600 dark:text-paper-300/60">
              Send a reset link to {user?.email} — useful if you're signed out elsewhere.
            </p>
          </div>
          <Button variant="secondary" onClick={sendResetLink}>
            <ShieldCheck size={16} /> Send reset link
          </Button>
        </div>
        {status === 'sent' && (
          <p className="mt-3 text-sm text-signal-green">Reset link sent — check your email.</p>
        )}
        {status === 'error' && (
          <p className="mt-3 text-sm text-signal-rose">Couldn't send the reset link. Try again shortly.</p>
        )}
      </CardBody>
    </Card>
  )
}

const createUserSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z
    .string()
    .min(8, 'Must be at least 8 characters')
    .regex(/[a-z]/, 'Needs a lowercase letter')
    .regex(/[A-Z]/, 'Needs an uppercase letter')
    .regex(/[0-9]/, 'Needs a number')
    .regex(/[@$!%*?&#^()_\-+=]/, 'Needs a symbol'),
  role: z.enum(['ADMIN', 'IT_ADMIN', 'HR', 'MANAGER', 'EMPLOYEE']),
})
type CreateUserValues = z.infer<typeof createUserSchema>

function TeamAccountsSection() {
  const { data: users, isLoading } = useUsers()
  const createMutation = useCreateUser()
  const deactivateMutation = useDeactivateUser()
  const changeRoleMutation = useChangeUserRole()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserValues>({ resolver: zodResolver(createUserSchema), defaultValues: { role: 'EMPLOYEE' } })

  async function onSubmit(values: CreateUserValues) {
    setServerError(null)
    try {
      await createMutation.mutateAsync(values)
      reset()
      setIsModalOpen(false)
    } catch (err) {
      const fieldErrors = getFieldErrors(err)
      let matchedAny = false
      if (fieldErrors) {
        Object.entries(fieldErrors).forEach(([field, message]) => {
          if (field === 'email' || field === 'password' || field === 'role') {
            setError(field as keyof CreateUserValues, { message })
            matchedAny = true
          }
        })
      }
      if (!matchedAny) {
        setServerError(getErrorMessage(err))
      }
    }
  }

  async function handleDeactivate(id: string, email: string) {
    if (!confirm(`Deactivate ${email}? They will no longer be able to sign in.`)) return
    try {
      await deactivateMutation.mutateAsync(id)
    } catch (err) {
      alert(getErrorMessage(err))
    }
  }

  async function handleRoleChange(id: string, role: Role) {
    try {
      await changeRoleMutation.mutateAsync({ id, role })
    } catch (err) {
      alert(getErrorMessage(err))
    }
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="font-display text-lg text-ink-900 dark:text-paper-50">Team accounts</h2>
        <Button size="sm" onClick={() => setIsModalOpen(true)}>
          <UserPlus size={15} /> Add account
        </Button>
      </CardHeader>
      <CardBody className="pt-4">
        {isLoading ? (
          <TableSkeleton rows={4} cols={3} />
        ) : (
          <div className="flex flex-col divide-y divide-paper-200 dark:divide-ink-700">
            {users?.map((account) => (
              <motion.div
                key={account.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-between py-3"
              >
                <div>
                  <p className="text-sm font-medium text-ink-900 dark:text-paper-50">
                    {account.employeeName ?? account.displayName ?? account.email}
                  </p>
                  <p className="text-xs text-ink-600 dark:text-paper-300/50">
                    {account.email} · {account.active ? 'Active' : 'Deactivated'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={account.role}
                    onChange={(e) => handleRoleChange(account.id, e.target.value as Role)}
                    className="!py-1.5 text-xs"
                  >
                    {roleOptions.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </Select>
                  <button
                    onClick={() => handleDeactivate(account.id, account.email)}
                    disabled={!account.active}
                    className="rounded-lg p-2 text-ink-600 hover:bg-signal-rose/10 hover:text-signal-rose disabled:cursor-not-allowed disabled:opacity-40 dark:text-paper-300/60"
                    aria-label={`Deactivate ${account.email}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardBody>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add team account">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {serverError && (
            <div className="rounded-lg bg-signal-rose/10 px-3.5 py-2.5 text-sm text-signal-rose">{serverError}</div>
          )}
          <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
          <PasswordInput
            label="Temporary password"
            hint="At least 8 characters, with upper, lower, a number, and a symbol."
            error={errors.password?.message}
            {...register('password')}
          />
          <Select label="Role" error={errors.role?.message} {...register('role')}>
            {roleOptions.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </Select>
          <div className="mt-2 flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Create account
            </Button>
          </div>
        </form>
      </Modal>
    </Card>
  )
}
