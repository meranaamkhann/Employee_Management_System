import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { ApiResponse, Holiday, LeaveBalanceItem, LeaveRequestItem, PageResponse } from '@/types/api'

export function useMyLeaveRequests() {
  return useQuery({
    queryKey: ['leave-requests-me'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<PageResponse<LeaveRequestItem>>>('/leave/requests/me')
      return data.data
    },
  })
}

export function useMyLeaveBalances() {
  return useQuery({
    queryKey: ['leave-balances-me'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<LeaveBalanceItem[]>>('/leave/balances/me')
      return data.data
    },
  })
}

export function useLeaveApprovalQueue(filters: { status?: string; page?: number }) {
  return useQuery({
    queryKey: ['leave-requests', filters],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<PageResponse<LeaveRequestItem>>>('/leave/requests', {
        params: filters,
      })
      return data.data
    },
    placeholderData: (prev) => prev,
  })
}

export function useApplyLeave() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { leaveType: string; startDate: string; endDate: string; reason?: string }) => {
      const { data } = await apiClient.post<ApiResponse<LeaveRequestItem>>('/leave/requests', payload)
      return data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests-me'] })
      queryClient.invalidateQueries({ queryKey: ['leave-balances-me'] })
    },
  })
}

export function useReviewLeave() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, action, note }: { id: string; action: 'approve' | 'reject'; note?: string }) => {
      const { data } = await apiClient.post<ApiResponse<LeaveRequestItem>>(`/leave/requests/${id}/${action}`, { note })
      return data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] })
    },
  })
}

export function useCancelLeave() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post<ApiResponse<LeaveRequestItem>>(`/leave/requests/${id}/cancel`)
      return data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests-me'] })
      queryClient.invalidateQueries({ queryKey: ['leave-balances-me'] })
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] })
    },
  })
}

export function useHolidays(year?: number) {
  return useQuery({
    queryKey: ['holidays', year],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<Holiday[]>>('/holidays', { params: { year } })
      return data.data
    },
  })
}

export function useCreateHoliday() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { date: string; name: string }) => {
      const { data } = await apiClient.post<ApiResponse<Holiday>>('/holidays', payload)
      return data.data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['holidays'] }),
  })
}

export function useDeleteHoliday() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/holidays/${id}`)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['holidays'] }),
  })
}