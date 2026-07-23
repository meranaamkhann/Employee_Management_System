import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './Button'

export function Pagination({
  page,
  totalPages,
  totalElements,
  onPageChange,
}: {
  page: number
  totalPages: number
  totalElements: number
  onPageChange: (page: number) => void
}) {
  if (totalElements === 0) return null

  return (
    <div className="flex items-center justify-between border-t border-paper-200 px-6 py-4">
      <p className="text-sm text-ink-600">
        Page <span className="font-medium text-ink-900">{page + 1}</span> of{' '}
        <span className="font-medium text-ink-900">{Math.max(totalPages, 1)}</span> ·{' '}
        <span className="font-medium text-ink-900">{totalElements}</span> total
      </p>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" onClick={() => onPageChange(page - 1)} disabled={page <= 0}>
          <ChevronLeft size={16} /> Previous
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page + 1 >= totalPages}
        >
          Next <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  )
}
