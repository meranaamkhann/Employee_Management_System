import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, UserCircle, Compass } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'

export function OnboardingModal() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (localStorage.getItem('hr_show_onboarding') === '1') {
      setIsOpen(true)
    }
  }, [])

  function dismiss() {
    localStorage.removeItem('hr_show_onboarding')
    setIsOpen(false)
  }

  return (
    <Modal isOpen={isOpen} onClose={dismiss} title="Welcome to Rosterly">
      <div className="flex flex-col gap-5">
        <p className="text-sm text-ink-600 dark:text-paper-300/60">
          Your account is ready. Here's what to do next.
        </p>

        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-3 rounded-xl bg-paper-100 p-4 dark:bg-ink-800">
            <UserCircle size={18} className="mt-0.5 shrink-0 text-brass-500" />
            <div>
              <p className="text-sm font-medium text-ink-900 dark:text-paper-50">Complete your profile</p>
              <p className="text-sm text-ink-600 dark:text-paper-300/60">
                HR links your employee record — check your profile page for status.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl bg-paper-100 p-4 dark:bg-ink-800">
            <Compass size={18} className="mt-0.5 shrink-0 text-brass-500" />
            <div>
              <p className="text-sm font-medium text-ink-900 dark:text-paper-50">Explore the workspace</p>
              <p className="text-sm text-ink-600 dark:text-paper-300/60">
                Browse departments and settings from the sidebar any time.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={dismiss}>
            Explore on my own
          </Button>
          <Link to="/app/profile" onClick={dismiss}>
            <Button>
              <Sparkles size={15} /> Go to my profile
            </Button>
          </Link>
        </div>
      </div>
    </Modal>
  )
}
