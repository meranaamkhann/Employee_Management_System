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

export interface CreateUserPayload {
  email: string
  password: string
  role: string
  employeeId?: string
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

export function useCreateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: CreateUserPayload) => {
      const { data } = await apiClient.post<ApiResponse<AccountUser>>('/users', payload)
      return data.data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })
}

export function useDeactivateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (userId: string) => {
      await apiClient.post(`/users/${userId}/deactivate`)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })
}

export function useChangeUserRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      await apiClient.patch(`/users/${id}/role`, { role })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
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