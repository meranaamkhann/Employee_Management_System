import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { ApiResponse, Employee, EmployeeFormValues, PageResponse } from '@/types/api'

export interface EmployeeFilters {
  q?: string
  departmentId?: string
  status?: string
  gender?: string
  page?: number
  size?: number
  sort?: string
}

export function useEmployees(filters: EmployeeFilters) {
  return useQuery({
    queryKey: ['employees', filters],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<PageResponse<Employee>>>('/employees', {
        params: filters,
      })
      return data.data
    },
    placeholderData: (prev) => prev,
  })
}

export function useEmployee(id: string | undefined) {
  return useQuery({
    queryKey: ['employees', id],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<Employee>>(`/employees/${id}`)
      return data.data
    },
    enabled: !!id,
  })
}

export function useCreateEmployee() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: EmployeeFormValues) => {
      const { data } = await apiClient.post<ApiResponse<Employee>>('/employees', payload)
      return data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}

export function useUpdateEmployee(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: EmployeeFormValues) => {
      const { data } = await apiClient.put<ApiResponse<Employee>>(`/employees/${id}`, payload)
      return data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    },
  })
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/employees/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}

export function useBulkDeleteEmployees() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (ids: string[]) => {
      await apiClient.post('/employees/bulk-delete', { ids })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}
