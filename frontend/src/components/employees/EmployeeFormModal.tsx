import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import clsx from 'clsx'
import { employeeSchema, EmployeeFormValues } from '@/lib/schemas'
import { useCreateEmployee, useEmployees, useUpdateEmployee } from '@/hooks/use-employees'
import { useDepartments } from '@/hooks/use-departments'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { getErrorMessage, getFieldErrors } from '@/lib/format'
import type { Employee } from '@/types/api'

const sections = [
  { key: 'basic', label: 'Basic Information' },
  { key: 'employment', label: 'Employment' },
  { key: 'emergency', label: 'Emergency Contact' },
  { key: 'address', label: 'Address' },
  { key: 'notes', label: 'Notes' },
] as const

type SectionKey = (typeof sections)[number]['key']

export function EmployeeFormModal({
  isOpen,
  onClose,
  employee,
  readOnly = false,
}: {
  isOpen: boolean
  onClose: () => void
  employee?: Employee
  readOnly?: boolean
}) {
  const isEdit = !!employee
  const { data: departments } = useDepartments()
  const { data: managerOptions } = useEmployees({ size: 100 })
  const createMutation = useCreateEmployee()
  const updateMutation = useUpdateEmployee(employee?.id ?? '')
  const [serverError, setServerError] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<SectionKey>('basic')

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeFormValues>({ resolver: zodResolver(employeeSchema) })

  useEffect(() => {
    if (isOpen) {
      reset(
        employee
          ? {
              fullName: employee.fullName,
              email: employee.email,
              phone: employee.phone ?? '',
              gender: employee.gender,
              dateOfBirth: employee.dateOfBirth ?? '',
              departmentId: employee.department?.id ?? '',
              designation: employee.designation ?? '',
              joiningDate: employee.joiningDate ?? '',
              salary: employee.salary,
              status: employee.status,
              managerId: employee.manager?.id ?? '',
              emergencyContactName: employee.emergencyContactName ?? '',
              emergencyContactPhone: employee.emergencyContactPhone ?? '',
              addressLine: employee.addressLine ?? '',
              city: employee.city ?? '',
              country: employee.country ?? '',
              notes: employee.notes ?? '',
            }
          : { salary: 0, status: 'ACTIVE' },
      )
      setServerError(null)
      setActiveSection('basic')
    }
  }, [isOpen, employee, reset])

  async function onSubmit(values: EmployeeFormValues) {
    setServerError(null)
    const payload = {
      ...values,
      phone: values.phone || undefined,
      departmentId: values.departmentId || undefined,
      managerId: values.managerId || undefined,
    }
    try {
      if (isEdit) {
        await updateMutation.mutateAsync(payload)
      } else {
        await createMutation.mutateAsync(payload)
      }
      onClose()
    } catch (err) {
      const fieldErrors = getFieldErrors(err)
      if (fieldErrors) {
        Object.entries(fieldErrors).forEach(([field, message]) =>
          setError(field as keyof EmployeeFormValues, { message }),
        )
      } else {
        setServerError(getErrorMessage(err))
      }
    }
  }

  const title = readOnly ? 'Employee details' : isEdit ? 'Edit employee' : 'Add employee'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {serverError && (
          <div className="rounded-lg bg-signal-rose/10 px-3.5 py-2.5 text-sm text-signal-rose">{serverError}</div>
        )}

        <div className="flex flex-wrap gap-1 border-b border-paper-200 pb-3 dark:border-ink-700">
          {sections.map((section) => (
            <button
              key={section.key}
              type="button"
              onClick={() => setActiveSection(section.key)}
              className={clsx(
                'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                activeSection === section.key
                  ? 'bg-ink-900 text-white dark:bg-brass-400 dark:text-ink-950'
                  : 'text-ink-600 hover:bg-paper-200 dark:text-paper-300/70 dark:hover:bg-ink-800',
              )}
            >
              {section.label}
            </button>
          ))}
        </div>

        <fieldset disabled={readOnly} className="contents">
          {activeSection === 'basic' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Full name" error={errors.fullName?.message} {...register('fullName')} />
              <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
              <Input label="Phone" error={errors.phone?.message} {...register('phone')} />
              <Select label="Gender" error={errors.gender?.message} {...register('gender')}>
                <option value="">Prefer not to say</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
                <option value="UNDISCLOSED">Undisclosed</option>
              </Select>
              <Input label="Date of birth" type="date" error={errors.dateOfBirth?.message} {...register('dateOfBirth')} />
              <div />
            </div>
          )}

          {activeSection === 'employment' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Joining date" type="date" error={errors.joiningDate?.message} {...register('joiningDate')} />
              <Select label="Department" error={errors.departmentId?.message} {...register('departmentId')}>
                <option value="">Unassigned</option>
                {departments?.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </Select>
              <Input label="Designation" error={errors.designation?.message} {...register('designation')} />
              <Input
                label="Salary (annual)"
                type="number"
                step="0.01"
                error={errors.salary?.message}
                {...register('salary')}
              />
              <Select label="Status" error={errors.status?.message} {...register('status')}>
                <option value="ACTIVE">Active</option>
                <option value="ON_LEAVE">On leave</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="TERMINATED">Terminated</option>
              </Select>
              <Select label="Manager" error={errors.managerId?.message} {...register('managerId')}>
                <option value="">No manager</option>
                {managerOptions?.content
                  .filter((m) => m.id !== employee?.id)
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.fullName} ({m.employeeCode})
                    </option>
                  ))}
              </Select>
            </div>
          )}

          {activeSection === 'emergency' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Emergency contact name" {...register('emergencyContactName')} />
              <Input label="Emergency contact phone" {...register('emergencyContactPhone')} />
            </div>
          )}

          {activeSection === 'address' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Address" className="sm:col-span-2" {...register('addressLine')} />
              <Input label="City" {...register('city')} />
              <Input label="Country" {...register('country')} />
            </div>
          )}

          {activeSection === 'notes' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink-800 dark:text-paper-200">Notes</label>
              <textarea
                className="min-h-32 w-full rounded-lg border border-paper-300 bg-white px-3.5 py-2.5 text-sm text-ink-900 focus:border-brass-500 focus:outline-none focus:ring-2 focus:ring-brass-400/50 dark:border-ink-600 dark:bg-ink-800 dark:text-paper-50"
                {...register('notes')}
              />
            </div>
          )}
        </fieldset>

        <div className="mt-2 flex justify-end gap-3">
          {readOnly ? (
            <Button type="button" variant="secondary" onClick={onClose}>
              Close
            </Button>
          ) : (
            <>
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isSubmitting}>
                {isEdit ? 'Save changes' : 'Add employee'}
              </Button>
            </>
          )}
        </div>
      </form>
    </Modal>
  )
}
