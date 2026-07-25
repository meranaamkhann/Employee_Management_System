import type { Role } from '@/types/api'

/**
 * Where a given role lands after login, or gets bounced to when they hit a
 * route their role can't access. Must stay in sync with the backend's
 * @PreAuthorize rules — picking a route the role also can't reach just
 * turns one redirect into two.
 */
export function getDefaultRouteForRole(role: Role): string {
  switch (role) {
    case 'ADMIN':
    case 'HR':
    case 'MANAGER':
      return '/app/dashboard'
    case 'IT_ADMIN':
      return '/app/activity'
    case 'EMPLOYEE':
    default:
      return '/app/departments'
  }
}
