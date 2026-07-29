import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { useAuth } from '@/lib/auth-context'
import { getDefaultRouteForRole } from '@/lib/routing'

const links = [
  { href: '#features', label: 'Features' },
  { href: '#preview', label: 'Product' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#faq', label: 'FAQ' },
]

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false)
  const { user, logout } = useAuth()

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8)
    }
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={clsx(
        'fixed inset-x-0 top-0 z-40 transition-all duration-300',
        scrolled ? 'border-b border-white/5 bg-ink-950/80 backdrop-blur-lg' : 'bg-transparent',
      )}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to={user ? getDefaultRouteForRole(user.role) : '/'} className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brass-400">
            <span className="font-display text-sm font-semibold text-ink-950">R</span>
          </div>
          <span className="font-display text-base font-medium text-paper-50">Rosterly</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="text-sm text-paper-300/70 transition-colors hover:text-paper-50">
              {link.label}
            </a>
          ))}
        </div>

        {user ? (
          <div className="flex items-center gap-3">
            <Link to="/app/profile" className="text-sm text-paper-300/70 transition-colors hover:text-paper-50">
              {user.email}
            </Link>
            <Link
              to={getDefaultRouteForRole(user.role)}
              className="rounded-lg bg-paper-50 px-4 py-2 text-sm font-medium text-ink-950 transition-transform hover:scale-[1.03] active:scale-[0.98]"
            >
              Open workspace
            </Link>
            <button
              onClick={logout}
              className="text-sm text-paper-300/70 transition-colors hover:text-paper-50"
            >
              Sign out
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm text-paper-300/70 transition-colors hover:text-paper-50">
              Sign in
            </Link>
            <Link
              to="/login"
              className="rounded-lg bg-paper-50 px-4 py-2 text-sm font-medium text-ink-950 transition-transform hover:scale-[1.03] active:scale-[0.98]"
            >
              Get started
            </Link>
          </div>
        )}
      </nav>
    </header>
  )
}
