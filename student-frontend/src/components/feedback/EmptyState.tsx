import type { ReactNode } from 'react'
import Icon, { type IconName } from '../ui/Icon'

type EmptyStateProps = {
  title: string
  description: string
  action?: ReactNode
  icon?: IconName
  /** Render without the card surface, e.g. inside an existing card. */
  bare?: boolean
}

export default function EmptyState({ title, description, action, icon = 'inbox', bare = false }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center px-6 py-14 text-center ${bare ? '' : 'card'}`}>
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100">
        <Icon name={icon} size={22} />
      </span>
      <h2 className="text-lg font-semibold text-stone-900">{title}</h2>
      <p className="mt-1 max-w-md text-[15px] text-stone-600">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
