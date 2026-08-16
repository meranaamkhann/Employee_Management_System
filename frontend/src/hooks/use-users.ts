import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { ApiResponse } from '@/types/api'

export interface AccountUser {
  id: string
  email: string
  role: string
  active: boolean
  emailVerified: boolean
  employeeId?: string
  employeeName?: string
  displayName?: string
  createdAt: string
}

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<AccountUser[]>>('/users')
      return data.data
    },
  })
}

export function useLinkEmployee() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, employeeId }: { id: string; employeeId: string }) => {
      await apiClient.patch(`/users/${id}/link-employee`, { employeeId })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })
}