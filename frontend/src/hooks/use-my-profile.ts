import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { ApiResponse, Employee } from '@/types/api'
import { AxiosError } from 'axios'

export function useMyProfile() {
  return useQuery({
    queryKey: ['my-profile'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<Employee>>('/employees/me')
      return data.data
    },
    retry: (failureCount, error) => {
      // 404 means this account has no linked employee record (e.g. a
      // standalone admin login) — that's an expected state, not worth retrying.
      if (error instanceof AxiosError && error.response?.status === 404) return false
      return failureCount < 1
    },
  })
}
