import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { apiClient, tokenStore } from './api-client'
import type { ApiResponse, AuthResponse, Role } from '@/types/api'

interface AuthUser {
  email: string
  role: Role
  employeeId: string | null
  displayName?: string | null
}

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<AuthUser>
  register: (fullName: string, email: string, password: string) => Promise<AuthUser>
  logout: () => void
  updateDisplayName: (displayName: string) => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const USER_KEY = 'hr_user'

function persistFromAuthResponse(auth: AuthResponse): AuthUser {
  const { accessToken, refreshToken, ...rest } = auth
  tokenStore.setTokens(accessToken, refreshToken)
  const authUser: AuthUser = {
    email: rest.email,
    role: rest.role,
    employeeId: rest.employeeId,
    displayName: rest.displayName,
  }
  localStorage.setItem(USER_KEY, JSON.stringify(authUser))
  return authUser
}

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
    const authUser = persistFromAuthResponse(response.data.data)
    setUser(authUser)
    return authUser
  }

  async function register(fullName: string, email: string, password: string) {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/register', {
      fullName,
      email,
      password,
    })
    const authUser = persistFromAuthResponse(response.data.data)
    localStorage.setItem('hr_show_onboarding', '1')
    setUser(authUser)
    return authUser
  }

  async function logout() {
    const refreshToken = getStoredRefreshToken() // however you currently read it
    try {
      if (refreshToken) {
        await apiClient.post('/auth/logout', { refreshToken })
      }
    } catch {
      // Best-effort — logout must always succeed client-side even if the
      // network call fails or the token was already invalid.
    } finally {
      clearTokens()
      setUser(null)
      navigate('/login')
    }
  }

  function updateDisplayName(displayName: string) {
    setUser((prev) => {
      if (!prev) return prev
      const next = { ...prev, displayName }
      localStorage.setItem(USER_KEY, JSON.stringify(next))
      return next
    })
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, updateDisplayName }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
