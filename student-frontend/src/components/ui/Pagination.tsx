import Button from './Button'
import Icon from './Icon'

type PaginationProps = {
  currentPage: number
  lastPage: number
  onPageChange: (page: number) => void
  total?: number
}

export default function Pagination({ currentPage, lastPage, onPageChange, total }: PaginationProps) {
  const pages = Math.max(lastPage, 1)
  const canGoPrevious = currentPage > 1
  const canGoNext = currentPage < pages

  return (
    <nav className="flex items-center justify-between gap-4" aria-label="Pagination">
      <Button
        variant="secondary"
        size="sm"
        disabled={!canGoPrevious}
        onClick={() => onPageChange(currentPage - 1)}
      >
        <Icon name="arrowLeft" size={16} />
        Prev
      </Button>
      <p className="text-center text-sm text-stone-600">
        <span>Page {currentPage} of {pages}</span>
        {total !== undefined && <span className="hidden sm:inline"> · {total.toLocaleString()} {total === 1 ? 'record' : 'records'}</span>}
      </p>
      <Button
        variant="secondary"
        size="sm"
        disabled={!canGoNext}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Next
        <Icon name="arrowRight" size={16} />
      </Button>
    </nav>
  )
}
