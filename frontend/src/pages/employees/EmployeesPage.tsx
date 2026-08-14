import { useMemo, useState } from 'react'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { exportEmployeesCsv, useBulkDeleteEmployees, useDeleteEmployee, useEmployees } from '@/hooks/use-employees'
import { useDepartments } from '@/hooks/use-departments'
import { useAuth } from '@/lib/auth-context'
import { Card } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Pagination } from '@/components/ui/Pagination'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatusBadge } from '@/components/ui/Badge'
import { EmployeeFormModal } from '@/components/employees/EmployeeFormModal'
import { formatCurrency, initials } from '@/lib/format'
import { Search, Plus, Trash2, Pencil, Users, Download } from 'lucide-react'
import type { Employee } from '@/types/api'

export default function EmployeesPage() {
  const { user } = useAuth()
  const canEdit = user?.role === 'ADMIN' || user?.role === 'HR'

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 350)
  const [departmentId, setDepartmentId] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(0)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [modalEmployee, setModalEmployee] = useState<Employee | undefined>(undefined)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const filters = useMemo(
    () => ({
      q: debouncedSearch || undefined,
      departmentId: departmentId || undefined,
      status: status || undefined,
      page,
      size: 10,
      sort: 'fullName,asc',
    }),
    [debouncedSearch, departmentId, status, page],
  )

  const [isExporting, setIsExporting] = useState(false)

  async function handleExport() {
    setIsExporting(true)
    try {
      await exportEmployeesCsv({
        q: debouncedSearch || undefined,
        departmentId: departmentId || undefined,
        status: status || undefined,
      })
    } finally {
      setIsExporting(false)
    }
  }

  const { data, isLoading, isPlaceholderData } = useEmployees(filters)
  const { data: departments } = useDepartments()
  const deleteMutation = useDeleteEmployee()
  const bulkDeleteMutation = useBulkDeleteEmployees()

  function openCreate() {
    setModalEmployee(undefined)
    setIsModalOpen(true)
  }

  function openDetails(employee: Employee) {
    setModalEmployee(employee)
    setIsModalOpen(true)
  }

  function toggleSelected(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  async function handleBulkDelete() {
    if (!confirm(`Delete ${selectedIds.length} selected employee(s)?`)) return
    await bulkDeleteMutation.mutateAsync(selectedIds)
    setSelectedIds([])
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-ink-900 dark:text-paper-50">Employees</h1>
          <p className="mt-1 text-sm text-ink-600 dark:text-paper-300/60">
            {user?.role === 'MANAGER' ? 'Your direct reports.' : 'Everyone in the organization.'}
          </p>
        </div>
        {canEdit && (
          <Button onClick={openCreate}>
            <Plus size={16} /> Add employee
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={handleExport} disabled={isExporting}>
            <Download size={16} /> {isExporting ? 'Exporting…' : 'Export CSV'}
          </Button>
          {canEdit && (
            <Button onClick={openCreate}>
              <Plus size={16} /> Add employee
            </Button>
          )}
        </div>

      <Card>
        <div className="flex flex-col gap-3 border-b border-paper-200 p-4 dark:border-ink-700 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-600/50" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(0)
              }}
              placeholder="Search by name, email, code, or designation…"
              className="w-full rounded-lg border border-paper-300 bg-white py-2.5 pl-9 pr-3.5 text-sm text-ink-900 focus:border-brass-500 focus:outline-none focus:ring-2 focus:ring-brass-400/50 dark:border-ink-600 dark:bg-ink-800 dark:text-paper-50"
            />
          </div>
          <Select
            value={departmentId}
            onChange={(e) => {
              setDepartmentId(e.target.value)
              setPage(0)
            }}
            className="sm:w-48"
          >
            <option value="">All departments</option>
            {departments?.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              setPage(0)
            }}
            className="sm:w-40"
          >
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="ON_LEAVE">On leave</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="TERMINATED">Terminated</option>
          </Select>
        </div>

        {canEdit && selectedIds.length > 0 && (
          <div className="flex items-center justify-between bg-brass-400/10 px-6 py-3">
            <p className="text-sm font-medium text-ink-900 dark:text-paper-50">{selectedIds.length} selected</p>
            <Button variant="danger" size="sm" onClick={handleBulkDelete}>
              <Trash2 size={14} /> Delete selected
            </Button>
          </div>
        )}

        {isLoading ? (
          <TableSkeleton />
        ) : !data || data.content.length === 0 ? (
          <EmptyState
            icon={<Users size={40} />}
            title="No employees found"
            description="Try adjusting your search or filters."
          />
        ) : (
          <div className={isPlaceholderData ? 'opacity-60 transition-opacity' : ''}>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-paper-200 text-xs uppercase tracking-wide text-ink-600 dark:border-ink-700 dark:text-paper-300/50">
                  {canEdit && <th className="w-10 px-6 py-3" />}
                  <th className="px-3 py-3">Employee</th>
                  <th className="px-3 py-3">Department</th>
                  <th className="px-3 py-3">Designation</th>
                  <th className="px-3 py-3">Salary</th>
                  <th className="px-3 py-3">Status</th>
                  {canEdit && <th className="px-6 py-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {data.content.map((employee) => (
                  <tr
                    key={employee.id}
                    onClick={() => openDetails(employee)}
                    className="cursor-pointer border-b border-paper-200/70 last:border-0 hover:bg-paper-100/60 dark:border-ink-700/70 dark:hover:bg-ink-800/60"
                  >
                    {canEdit && (
                      <td className="px-6 py-3.5">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(employee.id)}
                          onChange={() => toggleSelected(employee.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="h-4 w-4 rounded border-paper-300"
                        />
                      </td>
                    )}
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-paper-200 text-xs font-medium text-ink-800 dark:bg-ink-800 dark:text-paper-100">
                          {initials(employee.fullName)}
                        </div>
                        <div>
                          <p className="font-medium text-ink-900 dark:text-paper-50">{employee.fullName}</p>
                          <p className="font-mono text-xs text-ink-600 dark:text-paper-300/50">{employee.employeeCode}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3.5 text-ink-700 dark:text-paper-300/80">{employee.department?.name ?? '—'}</td>
                    <td className="px-3 py-3.5 text-ink-700 dark:text-paper-300/80">{employee.designation ?? '—'}</td>
                    <td className="px-3 py-3.5 font-mono text-ink-700 dark:text-paper-300/80">{formatCurrency(employee.salary)}</td>
                    <td className="px-3 py-3.5">
                      <StatusBadge status={employee.status} />
                    </td>
                    {canEdit && (
                      <td className="px-6 py-3.5 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              openDetails(employee)
                            }}
                            className="rounded-lg p-2 text-ink-600 hover:bg-paper-200 hover:text-ink-900 dark:text-paper-300/60 dark:hover:bg-ink-800 dark:hover:text-paper-50"
                            aria-label={`Edit ${employee.fullName}`}
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              if (confirm(`Delete ${employee.fullName}?`)) deleteMutation.mutate(employee.id)
                            }}
                            className="rounded-lg p-2 text-ink-600 hover:bg-signal-rose/10 hover:text-signal-rose"
                            aria-label={`Delete ${employee.fullName}`}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              totalElements={data.totalElements}
              onPageChange={setPage}
            />
          </div>
        )}
      </Card>

      <EmployeeFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        employee={modalEmployee}
        readOnly={!canEdit}
      />
    </div>
  )
}
