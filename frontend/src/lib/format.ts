import { AxiosError } from 'axios'
import type { ApiErrorResponse } from '@/types/api'

export function getErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiErrorResponse | undefined
    if (data?.message) return data.message
  }
  if (error instanceof Error) return error.message
  return fallback
}

export function getFieldErrors(error: unknown): Record<string, string> | undefined {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiErrorResponse | undefined
    return data?.fieldErrors
  }
  return undefined
}

export function formatCurrency(amount: number | undefined | null): string {
  if (amount == null) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount)
}

export function formatDate(iso: string | undefined | null): string {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(iso))
}

export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
}
