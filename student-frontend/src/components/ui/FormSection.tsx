import { useId, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import Button from './Button'

type FormSectionProps = {
  title: string
  description?: string
  children: ReactNode
  /** Grid columns for the fields on wide screens. */
  columns?: 1 | 2
}

/** A titled group of related fields inside a form card. */
export function FormSection({ title, description, children, columns = 2 }: FormSectionProps) {
  const headingId = useId()
  return (
    <section aria-labelledby={headingId} className="grid gap-x-8 gap-y-4 border-b border-stone-100 px-5 py-6 last:border-b-0 sm:px-7 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]">
      <div>
        <h2 id={headingId} className="text-base font-semibold text-stone-900">{title}</h2>
        {description && <p className="pt-1 text-sm text-stone-600">{description}</p>}
      </div>
      <div className={`grid gap-5 ${columns === 2 ? 'sm:grid-cols-2' : ''}`}>{children}</div>
    </section>
  )
}

type FormActionsProps = {
  submitLabel: string
  isSubmitting: boolean
  cancelTo?: string
  onCancel?: () => void
  note?: ReactNode
}

/** Footer for page forms: optional note on the left, Cancel + primary on the right. */
export function FormActions({ submitLabel, isSubmitting, cancelTo, onCancel, note }: FormActionsProps) {
  return (
    <div className="flex flex-col-reverse gap-3 rounded-b-xl border-t border-stone-100 bg-stone-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
      <p className="text-sm text-stone-600">{note ?? <><span className="text-rose-600" aria-hidden="true">*</span> Required field</>}</p>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:gap-3">
        {cancelTo && <Link className="btn-secondary" to={cancelTo}>Cancel</Link>}
        {!cancelTo && onCancel && <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>Cancel</Button>}
        <Button type="submit" loading={isSubmitting}>{submitLabel}</Button>
      </div>
    </div>
  )
}
