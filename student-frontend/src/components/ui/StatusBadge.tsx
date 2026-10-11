import clsx from 'clsx'
import { humanize } from '../../utils/format'

type Tone = 'green' | 'amber' | 'blue' | 'grey' | 'rose' | 'brand'

const toneByStatus: Record<string, Tone> = {
  active: 'green', enrolled: 'green', open: 'green', approved: 'green',
  pending: 'amber', planned: 'amber', on_leave: 'amber', waitlisted: 'amber', scheduled: 'amber', disputed: 'amber',
  graduated: 'blue', completed: 'blue', submitted: 'blue', revised: 'blue',
  suspended: 'rose', dismissed: 'rose', cancelled: 'rose',
  inactive: 'grey', withdrawn: 'grey', closed: 'grey', archived: 'grey', dropped: 'grey',
}

const toneClasses: Record<Tone, { pill: string; dot: string }> = {
  green: { pill: 'bg-emerald-50 text-emerald-800 ring-emerald-600/15', dot: 'bg-emerald-500' },
  amber: { pill: 'bg-amber-50 text-amber-900 ring-amber-600/20', dot: 'bg-amber-500' },
  blue: { pill: 'bg-sky-50 text-sky-800 ring-sky-600/15', dot: 'bg-sky-500' },
  grey: { pill: 'bg-stone-100 text-stone-700 ring-stone-500/15', dot: 'bg-stone-400' },
  rose: { pill: 'bg-rose-50 text-rose-800 ring-rose-600/15', dot: 'bg-rose-500' },
  brand: { pill: 'bg-brand-50 text-brand-800 ring-brand-600/15', dot: 'bg-brand-500' },
}

type StatusBadgeProps = {
  status: string
  /** Overrides the visible text; defaults to the humanized status. */
  label?: string
  tone?: Tone
  className?: string
}

export default function StatusBadge({ status, label, tone, className }: StatusBadgeProps) {
  const classes = toneClasses[tone ?? toneByStatus[status] ?? 'grey']

  return (
    <span className={clsx('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[13px] font-medium ring-1 ring-inset', classes.pill, className)}>
      <span className={clsx('h-1.5 w-1.5 rounded-full', classes.dot)} aria-hidden="true" />
      {label ?? humanize(status)}
    </span>
  )
}
