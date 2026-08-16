import { NavLink } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { useTheme } from '@/lib/theme-context'
import {
  LayoutDashboard, Users, Building2, LogOut, Sun, Moon,
  User, Settings, History, Clock, CalendarDays, Wallet, KeyRound,
} from 'lucide-react'

const navItems = [
  { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'HR', 'MANAGER'] },
  { to: '/app/employees', label: 'Employees', icon: Users, roles: ['ADMIN', 'HR', 'MANAGER'] },
  { to: '/app/departments', label: 'Departments', icon: Building2, roles: ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'] },
  { to: '/app/attendance', label: 'Attendance', icon: Clock, roles: ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'] },
  { to: '/app/leave', label: 'Leave', icon: CalendarDays, roles: ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'] },
  { to: '/app/payroll', label: 'Payroll', icon: Wallet, roles: ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'] },
  { to: '/app/activity', label: 'Activity', icon: History, roles: ['ADMIN', 'IT_ADMIN'] },
  { to: '/app/accounts', label: 'Accounts', icon: KeyRound, roles: ['ADMIN', 'IT_ADMIN'] },
  { to: '/app/profile', label: 'Profile', icon: User, roles: ['ADMIN', 'IT_ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'] },
  { to: '/app/settings', label: 'Settings', icon: Settings, roles: ['ADMIN', 'IT_ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'] },
]

export function Sidebar() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const visibleItems = navItems.filter((item) => !user?.role || item.roles.includes(user.role))

  return (
    <aside className="flex h-full w-72 flex-col border-r border-paper-200 bg-paper-50 p-4 dark:border-ink-700 dark:bg-ink-900">
      <div className="mb-6 flex items-center gap-2 px-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brass-400 font-display text-sm font-bold text-ink-900">
          R
        </div>
        <span className="font-display text-lg text-ink-900 dark:text-paper-50">Rosterly</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brass-400 text-ink-900'
                  : 'text-ink-700 hover:bg-paper-200 dark:text-paper-300 dark:hover:bg-ink-800'
              }`
            }
          >
            <item.icon size={18} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-4 flex flex-col gap-1 border-t border-paper-200 pt-4 dark:border-ink-700">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-paper-200 dark:text-paper-300 dark:hover:bg-ink-800"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>

        <div className="flex items-center gap-3 px-3 py-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-paper-200 text-xs font-medium text-ink-700 dark:bg-ink-800 dark:text-paper-200">
            {user?.email?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink-900 dark:text-paper-50">{user?.email}</p>
            <p className="text-xs text-ink-600 dark:text-paper-300/60">{user?.role}</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-paper-200 dark:text-paper-300 dark:hover:bg-ink-800"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </div>
    </aside>
  )
}