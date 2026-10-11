import type { ToastType } from '../../contexts/ToastContext'
import Icon, { type IconName } from './Icon'

type ToastProps = {
  message: string
  type: ToastType
  onDismiss: () => void
}

const styles: Record<ToastType, { box: string; icon: IconName; badge: string }> = {
  success: { box: 'border-emerald-200', icon: 'check', badge: 'bg-emerald-100 text-emerald-700' },
  error: { box: 'border-rose-200', icon: 'alert', badge: 'bg-rose-100 text-rose-700' },
  info: { box: 'border-brand-200', icon: 'info', badge: 'bg-brand-100 text-brand-700' },
}

export default function Toast({ message, type, onDismiss }: ToastProps) {
  const style = styles[type]

  return (
    <div
      className={`flex min-w-72 max-w-sm animate-fade-up items-start gap-3 rounded-xl border bg-white px-4 py-3 text-sm text-stone-800 shadow-lift ${style.box}`}
      role={type === 'error' ? 'alert' : 'status'}
    >
      <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${style.badge}`}>
        <Icon name={style.icon} size={14} strokeWidth={2.25} />
      </span>
      <span className="flex-1 pt-0.5">{message}</span>
      <button
        type="button"
        className="shrink-0 rounded-md p-1 text-stone-500 transition hover:bg-stone-100 hover:text-stone-800"
        aria-label="Dismiss notification"
        onClick={onDismiss}
      >
        <Icon name="close" size={16} />
      </button>
    </div>
  )
}
