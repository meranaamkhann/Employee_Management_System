import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import type { Role } from '@/types/api'

export function ProtectedRoute({ allowedRoles }: { allowedRoles?: Role[] }) {
  const { user, isLoading } = useAuth()

  if (isLoading) return null
  if (!user) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/app/departments" replace />

  return <Outlet />
}
