import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { apiClient, tokenStore } from './api-client'
import type { ApiResponse, AuthResponse, Role } from '@/types/api'

interface AuthUser {
  email: string
  role: Role
  employeeId: string | null
}

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const USER_KEY = 'hr_user'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const raw = localStorage.getItem(USER_KEY)
    const hasTokens = tokenStore.getAccessToken() && tokenStore.getRefreshToken()
    if (raw && hasTokens) {
      setUser(JSON.parse(raw))
    }
    setIsLoading(false)
  }, [])

  async function login(email: string, password: string) {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', { email, password })
    const { accessToken, refreshToken, ...rest } = response.data.data
    tokenStore.setTokens(accessToken, refreshToken)
    const authUser: AuthUser = { email: rest.email, role: rest.role, employeeId: rest.employeeId }
    localStorage.setItem(USER_KEY, JSON.stringify(authUser))
    setUser(authUser)
  }

  function logout() {
    tokenStore.clear()
    localStorage.removeItem(USER_KEY)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
