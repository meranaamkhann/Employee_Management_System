import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { OnboardingModal } from '@/components/onboarding/OnboardingModal'

export function AppLayout() {
  return (
    <div className="flex bg-paper-100 dark:bg-ink-950">
      <Sidebar />
      <main className="h-screen flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-8 py-8">
          <Outlet />
        </div>
      </main>
      <OnboardingModal />
    </div>
  )
}
