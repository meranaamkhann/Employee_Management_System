import { NavLink } from 'react-router-dom'
import clsx from 'clsx'
import { LayoutDashboard, Users, Building2, LogOut, Sun, Moon, User, Settings } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useTheme } from '@/lib/theme-context'

const navItems = [
  { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'HR', 'MANAGER'] },
  { to: '/app/employees', label: 'Employees', icon: Users, roles: ['ADMIN', 'HR', 'MANAGER'] },
  { to: '/app/departments', label: 'Departments', icon: Building2, roles: ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'] },
  { to: '/app/profile', label: 'Profile', icon: User, roles: ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'] },
  { to: '/app/settings', label: 'Settings', icon: Settings, roles: ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'] },
]

export function Sidebar() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()

  return (
    <aside className="flex h-screen w-64 flex-col justify-between border-r border-paper-300/70 bg-white px-4 py-6 dark:border-ink-700/70 dark:bg-ink-900">
      <div>
        <div className="mb-8 flex items-center gap-2 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-900 dark:bg-brass-400">
            <span className="font-display text-sm font-semibold text-brass-400 dark:text-ink-950">R</span>
          </div>
          <span className="font-display text-lg font-medium text-ink-900 dark:text-paper-50">Rosterly</span>
        </div>

        <nav className="flex flex-col gap-1">
          {navItems
            .filter((item) => !user || item.roles.includes(user.role))
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-ink-900 text-white dark:bg-brass-400 dark:text-ink-950'
                      : 'text-ink-700 hover:bg-paper-200 dark:text-paper-300/80 dark:hover:bg-ink-800',
                  )
                }
              >
                <item.icon size={17} />
                {item.label}
              </NavLink>
            ))}
        </nav>
      </div>

      <div className="border-t border-paper-200 pt-4 dark:border-ink-700">
        <button
          onClick={toggleTheme}
          className="mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-700 transition-colors hover:bg-paper-200 dark:text-paper-300/80 dark:hover:bg-ink-800"
          aria-label="Toggle dark mode"
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>

        <div className="mb-3 mt-3 flex items-center gap-2.5 px-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-paper-200 text-xs font-medium text-ink-800 dark:bg-ink-800 dark:text-paper-100">
            {user?.email?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink-900 dark:text-paper-50">{user?.email}</p>
            <p className="text-xs text-ink-600 dark:text-paper-300/60">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-700 transition-colors hover:bg-paper-200 dark:text-paper-300/80 dark:hover:bg-ink-800"
        >
          <LogOut size={17} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
