import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { ApiResponse, AuditEntityType, AuditLogEntry, PageResponse } from '@/types/api'

export function useAuditLogs(entityType: AuditEntityType | undefined, page: number) {
  return useQuery({
    queryKey: ['audit-logs', entityType, page],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<PageResponse<AuditLogEntry>>>('/audit-logs', {
        params: { entityType, page, size: 15, sort: 'createdAt,desc' },
      })
      return data.data
    },
    placeholderData: (prev) => prev,
  })
}
