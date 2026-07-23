import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Building2, Plus, Trash2, Pencil, Users } from 'lucide-react'
import { departmentSchema, DepartmentFormValues } from '@/lib/schemas'
import {
  useCreateDepartment,
  useDeleteDepartment,
  useDepartments,
  useUpdateDepartment,
} from '@/hooks/use-departments'
import { useEmployees } from '@/hooks/use-employees'
import { useAuth } from '@/lib/auth-context'
import { Card, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { getErrorMessage } from '@/lib/format'
import type { Department } from '@/types/api'

export default function DepartmentsPage() {
  const { user } = useAuth()
  const canEdit = user?.role === 'ADMIN' || user?.role === 'HR'

  const { data: departments, isLoading } = useDepartments()
  const deleteMutation = useDeleteDepartment()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingDept, setEditingDept] = useState<Department | undefined>(undefined)

  function openCreate() {
    setEditingDept(undefined)
    setIsModalOpen(true)
  }

  function openEdit(dept: Department) {
    setEditingDept(dept)
    setIsModalOpen(true)
  }

  async function handleDelete(dept: Department) {
    if (!confirm(`Delete ${dept.name}? This only works if it has no employees assigned.`)) return
    try {
      await deleteMutation.mutateAsync(dept.id)
    } catch (err) {
      alert(getErrorMessage(err))
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-ink-900">Departments</h1>
          <p className="mt-1 text-sm text-ink-600">Organize your workforce into teams.</p>
        </div>
        {canEdit && (
          <Button onClick={openCreate}>
            <Plus size={16} /> Add department
          </Button>
        )}
      </div>

      {isLoading ? (
        <Card>
          <TableSkeleton rows={3} cols={4} />
        </Card>
      ) : !departments || departments.length === 0 ? (
        <Card>
          <EmptyState icon={<Building2 size={40} />} title="No departments yet" />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map((dept) => (
            <Card key={dept.id}>
              <CardBody className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-paper-200 text-ink-800">
                    <Building2 size={18} />
                  </div>
                  {canEdit && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEdit(dept)}
                        className="rounded-lg p-1.5 text-ink-600 hover:bg-paper-200 hover:text-ink-900"
                        aria-label={`Edit ${dept.name}`}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(dept)}
                        className="rounded-lg p-1.5 text-ink-600 hover:bg-signal-rose/10 hover:text-signal-rose"
                        aria-label={`Delete ${dept.name}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
                <h3 className="mt-4 font-display text-lg text-ink-900">{dept.name}</h3>
                {dept.description && <p className="mt-1 text-sm text-ink-600">{dept.description}</p>}
                <div className="mt-4 flex items-center gap-1.5 text-sm text-ink-700">
                  <Users size={14} />
                  {dept.employeeCount} employee{dept.employeeCount === 1 ? '' : 's'}
                </div>
                {dept.headEmployeeName && (
                  <p className="mt-1 text-sm text-ink-600">Head: {dept.headEmployeeName}</p>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {canEdit && (
        <DepartmentFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} department={editingDept} />
      )}
    </div>
  )
}

function DepartmentFormModal({
  isOpen,
  onClose,
  department,
}: {
  isOpen: boolean
  onClose: () => void
  department?: Department
}) {
  const isEdit = !!department
  const { data: employeeOptions } = useEmployees({ size: 100 })
  const createMutation = useCreateDepartment()
  const updateMutation = useUpdateDepartment(department?.id ?? '')
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DepartmentFormValues>({ resolver: zodResolver(departmentSchema) })

  useEffect(() => {
    if (isOpen) {
      reset(
        department
          ? {
              name: department.name,
              description: department.description ?? '',
              headEmployeeId: department.headEmployeeId ?? '',
              budget: department.budget,
            }
          : {},
      )
      setServerError(null)
    }
  }, [isOpen, department, reset])

  async function onSubmit(values: DepartmentFormValues) {
    setServerError(null)
    const payload = { ...values, headEmployeeId: values.headEmployeeId || undefined }
    try {
      if (isEdit) {
        await updateMutation.mutateAsync(payload)
      } else {
        await createMutation.mutateAsync(payload)
      }
      onClose()
    } catch (err) {
      setServerError(getErrorMessage(err))
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit department' : 'Add department'}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {serverError && (
          <div className="rounded-lg bg-signal-rose/10 px-3.5 py-2.5 text-sm text-signal-rose">{serverError}</div>
        )}
        <Input label="Department name" error={errors.name?.message} {...register('name')} />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ink-800">Description</label>
          <textarea
            className="min-h-20 w-full rounded-lg border border-paper-300 bg-white px-3.5 py-2.5 text-sm focus:border-brass-500 focus:outline-none focus:ring-2 focus:ring-brass-400/50"
            {...register('description')}
          />
        </div>
        <Input label="Budget" type="number" step="0.01" error={errors.budget?.message} {...register('budget')} />
        <Select label="Department head" {...register('headEmployeeId')}>
          <option value="">None</option>
          {employeeOptions?.content.map((e) => (
            <option key={e.id} value={e.id}>
              {e.fullName}
            </option>
          ))}
        </Select>
        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {isEdit ? 'Save changes' : 'Add department'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
