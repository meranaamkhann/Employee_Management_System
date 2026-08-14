import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { ApiResponse, PageResponse, Payslip } from '@/types/api'

export function useMyPayslips(month?: string) {
  return useQuery({
    queryKey: ['payslips-me', month],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<PageResponse<Payslip>>>('/payroll/me', { params: { month } })
      return data.data
    },
  })
}

export function usePayrollSearch(filters: { month?: string; status?: string; departmentId?: string; page?: number }) {
  return useQuery({
    queryKey: ['payroll', filters],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<PageResponse<Payslip>>>('/payroll', { params: filters })
      return data.data
    },
    placeholderData: (prev) => prev,
  })
}

export function useGeneratePayroll() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { month: string; employeeId?: string }) => {
      const { data } = await apiClient.post<ApiResponse<Payslip[]>>('/payroll/generate', payload)
      return data.data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payroll'] }),
  })
}

export function useFinalizePayslip() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post<ApiResponse<Payslip>>(`/payroll/${id}/finalize`)
      return data.data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payroll'] }),
  })
}

export function useMarkPayslipPaid() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post<ApiResponse<Payslip>>(`/payroll/${id}/mark-paid`)
      return data.data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payroll'] }),
  })
}

export async function downloadPayslipPdf(id: string, payMonth: string) {
  const response = await apiClient.get(`/payroll/${id}/pdf`, { responseType: 'blob' })
  const blob = new Blob([response.data], { type: 'application/pdf' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `payslip-${payMonth}.pdf`
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}