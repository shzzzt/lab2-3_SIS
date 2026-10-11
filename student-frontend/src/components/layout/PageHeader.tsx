import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../ui/Icon'

type PageHeaderProps = {
  title: ReactNode
  description?: ReactNode
  /** Primary action(s), shown on the right on wide screens. */
  actions?: ReactNode
  /** Small line above the title, e.g. a record code. */
  eyebrow?: ReactNode
  back?: { to: string; label: string }
  /** Extra content beside the title, such as a status pill. */
  badge?: ReactNode
}

export default function PageHeader({ title, description, actions, eyebrow, back, badge }: PageHeaderProps) {
  return (
    <header className="space-y-3">
      {back && (
        <Link to={back.to} className="-ml-1 inline-flex items-center gap-1.5 rounded-md px-1 py-0.5 text-sm font-medium text-stone-600 transition hover:text-brand-700">
          <Icon name="arrowLeft" size={16} />
          {back.label}
        </Link>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 max-w-3xl">
          {eyebrow && <p className="mb-1 text-sm font-semibold text-brand-700">{eyebrow}</p>}
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-stone-900 sm:text-[28px] sm:leading-9">{title}</h1>
            {badge}
          </div>
          {description && <p className="mt-1.5 text-[15px] text-stone-600">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2 sm:gap-3">{actions}</div>}
      </div>
    </header>
  )
}
