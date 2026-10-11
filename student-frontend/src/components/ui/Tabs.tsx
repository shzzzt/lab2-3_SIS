import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react'
import clsx from 'clsx'

export type TabItem = { id: string; label: string; count?: number; content: ReactNode }

type TabsProps = {
  label: string
  tabs: TabItem[]
  value: string
  onChange: (id: string) => void
}

/** Accessible tabs: arrow keys, Home and End move between tabs. */
export default function Tabs({ label, tabs, value, onChange }: TabsProps) {
  const baseId = useId()
  const refs = useRef<Array<HTMLButtonElement | null>>([])
  const active = tabs.find((tab) => tab.id === value) ?? tabs[0]

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number): void => {
    const last = tabs.length - 1
    const next = event.key === 'ArrowRight' ? (index === last ? 0 : index + 1)
      : event.key === 'ArrowLeft' ? (index === 0 ? last : index - 1)
        : event.key === 'Home' ? 0
          : event.key === 'End' ? last
            : null
    if (next === null) return
    event.preventDefault()
    onChange(tabs[next].id)
    refs.current[next]?.focus()
  }

  return (
    <div>
      <div role="tablist" aria-label={label} className="flex gap-1 overflow-x-auto border-b border-stone-200">
        {tabs.map((tab, index) => {
          const selected = tab.id === active.id
          return (
            <button
              key={tab.id}
              ref={(element) => { refs.current[index] = element }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(tab.id)}
              onKeyDown={(event) => onKeyDown(event, index)}
              className={clsx(
                '-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-[15px] font-medium transition',
                selected ? 'border-brand-600 text-brand-800' : 'border-transparent text-stone-600 hover:border-stone-300 hover:text-stone-900',
              )}
            >
              {tab.label}
              {tab.count !== undefined && <span className={clsx('rounded-full px-2 py-0.5 text-xs font-semibold', selected ? 'bg-brand-100 text-brand-800' : 'bg-stone-100 text-stone-600')}>{tab.count}</span>}
            </button>
          )
        })}
      </div>
      <div role="tabpanel" id={`${baseId}-panel-${active.id}`} aria-labelledby={`${baseId}-tab-${active.id}`} className="pt-6" tabIndex={0}>
        {active.content}
      </div>
    </div>
  )
}
