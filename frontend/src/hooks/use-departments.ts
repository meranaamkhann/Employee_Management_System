import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { ApiResponse, Department, DepartmentFormValues } from '@/types/api'

export function useDepartments() {
  return useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<Department[]>>('/departments')
      return data.data
    },
  })
}

export function useCreateDepartment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: DepartmentFormValues) => {
      const { data } = await apiClient.post<ApiResponse<Department>>('/departments', payload)
      return data.data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['departments'] }),
  })
}

export function useUpdateDepartment(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: DepartmentFormValues) => {
      const { data } = await apiClient.put<ApiResponse<Department>>(`/departments/${id}`, payload)
      return data.data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['departments'] }),
  })
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/departments/${id}`)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['departments'] }),
  })
}
