import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { ApiResponse, AttendanceRecord, MonthlySummary, PageResponse } from '@/types/api'

export interface AttendanceFilters {
  employeeId?: string
  departmentId?: string
  status?: string
  from?: string
  to?: string
  page?: number
  size?: number
}

export function useMyAttendance(filters: { from?: string; to?: string; page?: number }) {
  return useQuery({
    queryKey: ['attendance-me', filters],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<PageResponse<AttendanceRecord>>>('/attendance/me', {
        params: filters,
      })
      return data.data
    },
  })
}

export function useAttendanceSearch(filters: AttendanceFilters) {
  return useQuery({
    queryKey: ['attendance', filters],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<PageResponse<AttendanceRecord>>>('/attendance', {
        params: filters,
      })
      return data.data
    },
    placeholderData: (prev) => prev,
  })
}

export function useMonthlySummary(month: string, employeeId?: string) {
  return useQuery({
    queryKey: ['attendance-summary', month, employeeId],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<MonthlySummary>>('/attendance/summary/monthly', {
        params: { month, employeeId },
      })
      return data.data
    },
    enabled: !!month,
  })
}

export function useClockIn() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post<ApiResponse<AttendanceRecord>>('/attendance/clock-in')
      return data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-me'] })
      queryClient.invalidateQueries({ queryKey: ['attendance-summary'] })
    },
  })
}

export function useClockOut() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post<ApiResponse<AttendanceRecord>>('/attendance/clock-out')
      return data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-me'] })
      queryClient.invalidateQueries({ queryKey: ['attendance-summary'] })
    },
  })
}