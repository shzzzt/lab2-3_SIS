import { useId, useState, type ReactNode } from 'react'
import Button from './Button'
import Icon from './Icon'

type FilterBarProps = {
  search?: {
    label: string
    value: string
    placeholder?: string
    onChange: (value: string) => void
  }
  /** One or two key filters that stay visible next to the search box. */
  inline?: ReactNode
  /** Less common filters, mounted only while the "Filters" panel is open. */
  advanced?: ReactNode
  /** Number of active filters (search excluded) for the badge and clear button. */
  activeCount: number
  onClear: () => void
  /** Optional submit handler; when set, the bar renders as a form with an apply button. */
  onSubmit?: () => void
  submitLabel?: string
}

/**
 * The shared list-page filter pattern: a prominent search box and at most two
 * inline filters, with everything else tucked behind a "Filters" disclosure.
 */
export default function FilterBar({ search, inline, advanced, activeCount, onClear, onSubmit, submitLabel = 'Apply filters' }: FilterBarProps) {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const searchId = useId()
  const hasAnything = activeCount > 0 || Boolean(search?.value)

  const body = (
    <>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        {search && (
          <div className="relative min-w-0 flex-1">
            <label htmlFor={searchId} className="sr-only">{search.label}</label>
            <Icon name="search" size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              id={searchId}
              type="search"
              className="input pl-10"
              placeholder={search.placeholder}
              value={search.value}
              onChange={(event) => search.onChange(event.target.value)}
            />
          </div>
        )}
        {(inline || advanced || hasAnything) && (
          <div className={`flex flex-wrap items-center gap-2 sm:flex-nowrap ${search ? '' : 'flex-1'}`}>
            {inline && <div className={`flex min-w-0 flex-1 flex-wrap gap-2 sm:flex-nowrap ${search ? 'lg:flex-none' : ''} [&>*]:min-w-[11rem] [&>*]:flex-1`}>{inline}</div>}
            {advanced && (
              <Button
                variant="secondary"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpen((value) => !value)}
                className={open ? 'border-brand-300 bg-brand-50 text-brand-800 hover:bg-brand-50' : ''}
              >
                <Icon name="filter" size={17} />
                Filters
                {activeCount > 0 && <span className="ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1.5 text-xs font-semibold text-white">{activeCount}<span className="sr-only"> active</span></span>}
              </Button>
            )}
            {onSubmit && <Button type="submit">{submitLabel}</Button>}
            {hasAnything && (
              <Button variant="ghost" onClick={onClear}>
                Clear filters
              </Button>
            )}
          </div>
        )}
      </div>
      {advanced && open && (
        <div id={panelId} className="mt-4 grid animate-fade-up gap-4 border-t border-stone-100 pt-4 sm:grid-cols-2 lg:grid-cols-4">
          {advanced}
        </div>
      )}
    </>
  )

  if (onSubmit) {
    return (
      <form className="card p-3 sm:p-4" role="search" onSubmit={(event) => { event.preventDefault(); onSubmit() }}>
        {body}
      </form>
    )
  }

  return <div className="card p-3 sm:p-4" role="search">{body}</div>
}
