import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

export function StatusPage({
  code,
  title,
  description,
}: {
  code: string
  title: string
  description: string
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper-100 px-6 text-center">
      <p className="font-display text-7xl text-ink-900/10">{code}</p>
      <h1 className="mt-4 font-display text-2xl text-ink-900">{title}</h1>
      <p className="mt-2 max-w-sm text-sm text-ink-600">{description}</p>
      <Link to="/" className="mt-8">
        <Button>Back to home</Button>
      </Link>
    </div>
  )
}
