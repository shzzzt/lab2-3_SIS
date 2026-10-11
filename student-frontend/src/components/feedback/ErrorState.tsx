import Button from '../ui/Button'
import Icon from '../ui/Icon'

type ErrorStateProps = {
  message: string
  onRetry?: () => void
}

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="card flex flex-col items-center justify-center px-6 py-12 text-center" role="alert">
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ring-1 ring-inset ring-rose-100">
        <Icon name="alert" size={22} />
      </span>
      <p className="font-semibold text-stone-900">{message}</p>
      <p className="mt-1 max-w-md text-sm text-stone-600">This is usually temporary. Check your connection and try again.</p>
      {onRetry && (
        <Button variant="secondary" className="mt-5" onClick={onRetry}>
          <Icon name="refresh" size={16} />
          Try again
        </Button>
      )}
    </div>
  )
}
