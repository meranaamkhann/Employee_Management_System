import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { ApiResponse, DashboardStats } from '@/types/api'

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<DashboardStats>>('/dashboard/stats')
      return data.data
    },
  })
}
