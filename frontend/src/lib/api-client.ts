import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import type { ApiResponse, AuthResponse } from '@/types/api'

const ACCESS_TOKEN_KEY = 'hr_access_token'
const REFRESH_TOKEN_KEY = 'hr_refresh_token'
const USER_KEY = 'hr_user'

export const tokenStore = {
  getAccessToken: () => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  setTokens: (accessToken: string, refreshToken: string) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  },
  clear: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  },
}

export const apiClient = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  const token = tokenStore.getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Queues concurrent requests while a single refresh call is in flight,
// instead of firing one refresh per failed request.
let refreshPromise: Promise<string> | null = null

async function refreshAccessToken(): Promise<string> {
  const refreshToken = tokenStore.getRefreshToken()
  if (!refreshToken) throw new Error('No refresh token available')

  const response = await axios.post<ApiResponse<AuthResponse>>('/api/v1/auth/refresh', { refreshToken })
  const { accessToken, refreshToken: newRefreshToken } = response.data.data
  tokenStore.setTokens(accessToken, newRefreshToken)
  return accessToken
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status === 401 && !originalRequest._retry && tokenStore.getRefreshToken()) {
      originalRequest._retry = true
      try {
        refreshPromise ??= refreshAccessToken().finally(() => {
          refreshPromise = null
        })
        const newAccessToken = await refreshPromise
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        return apiClient(originalRequest)
      } catch {
        tokenStore.clear()
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  },
)