import clsx from 'clsx'
import { THEMES, type ThemeKey } from '../../api/branding'
import Icon from '../ui/Icon'

const themeNames: Record<ThemeKey, { name: string; mood: string }> = {
  teal: { name: 'Teal', mood: 'Calm and fresh' },
  indigo: { name: 'Indigo', mood: 'Classic and focused' },
  forest: { name: 'Forest', mood: 'Grounded and natural' },
  plum: { name: 'Plum', mood: 'Warm and distinctive' },
  sunset: { name: 'Sunset', mood: 'Bright and friendly' },
  graphite: { name: 'Graphite', mood: 'Quiet and neutral' },
}

type ThemePickerProps = {
  value: ThemeKey
  onChange: (theme: ThemeKey) => void
  name?: string
}

/**
 * Six swatch cards with native radio semantics (arrow keys move between them).
 * Each preview sets `data-theme` locally so it paints in its own colours.
 */
export default function ThemePicker({ value, onChange, name = 'theme' }: ThemePickerProps) {
  return (
    <div role="radiogroup" aria-label="System theme" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {THEMES.map((theme) => {
        const selected = theme === value
        return (
          <label
            key={theme}
            data-theme={theme}
            className={clsx(
              'group relative cursor-pointer rounded-xl border bg-white p-2.5 transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-500 has-[:focus-visible]:ring-offset-2',
              selected ? 'border-brand-500 shadow-lift ring-1 ring-brand-500' : 'border-stone-200 hover:border-stone-300 hover:shadow-soft',
            )}
          >
            <input
              type="radio"
              name={name}
              value={theme}
              checked={selected}
              onChange={() => onChange(theme)}
              className="sr-only"
            />
            <span className="flex h-20 overflow-hidden rounded-lg border border-stone-200/80 bg-canvas" aria-hidden="true">
              <span className="flex w-1/3 flex-col gap-1.5 bg-brand-50 p-2">
                <span className="h-2 w-2 rounded-sm bg-brand-600" />
                <span className="h-1.5 w-full rounded-full bg-white ring-1 ring-brand-200" />
                <span className="h-1.5 w-3/4 rounded-full bg-brand-200/70" />
                <span className="h-1.5 w-2/3 rounded-full bg-brand-200/70" />
              </span>
              <span className="flex flex-1 flex-col justify-between p-2">
                <span className="space-y-1">
                  <span className="block h-1.5 w-3/4 rounded-full bg-stone-300" />
                  <span className="block h-1.5 w-1/2 rounded-full bg-stone-200" />
                </span>
                <span className="self-end rounded-md bg-brand-600 px-2 py-0.5 text-[10px] font-semibold text-white">Save</span>
              </span>
            </span>
            <span className="mt-2.5 flex items-start justify-between gap-2 px-0.5">
              <span>
                <span className="block text-sm font-semibold text-stone-900">{themeNames[theme].name}</span>
                <span className="block text-xs text-stone-600">{themeNames[theme].mood}</span>
              </span>
              <span className={clsx('mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition', selected ? 'border-brand-600 bg-brand-600 text-white' : 'border-stone-300 bg-white text-transparent')}>
                <Icon name="check" size={12} strokeWidth={3} />
              </span>
            </span>
          </label>
        )
      })}
    </div>
  )
}
