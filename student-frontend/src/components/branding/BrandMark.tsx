import clsx from 'clsx'
import { useBranding } from '../../contexts/BrandingContext'
import { initialsOf } from '../../utils/format'

type BrandMarkProps = {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Override the logo/name, e.g. for a live preview of an unsaved upload. */
  logo?: string | null
  name?: string
  /** Inverted monogram for dark/brand-coloured backgrounds. */
  inverted?: boolean
  className?: string
  /** Decorative when the institution name is printed next to it. */
  decorative?: boolean
}

const sizes = {
  sm: 'h-8 w-8 rounded-lg text-xs',
  md: 'h-10 w-10 rounded-xl text-sm',
  lg: 'h-14 w-14 rounded-2xl text-lg',
  xl: 'h-24 w-24 rounded-3xl text-3xl',
}

/** The uploaded logo, or a monogram of the institution's initials. */
export default function BrandMark({ size = 'md', logo, name, inverted = false, className, decorative = true }: BrandMarkProps) {
  const branding = useBranding()
  const source = logo === undefined ? branding.logo : logo
  const label = name ?? branding.institutionName

  if (source) {
    return (
      <span className={clsx('inline-flex shrink-0 items-center justify-center overflow-hidden bg-white ring-1 ring-inset ring-stone-900/5', sizes[size], className)}>
        <img src={source} alt={decorative ? '' : `${label} logo`} className="h-full w-full object-contain" />
      </span>
    )
  }

  return (
    <span
      className={clsx(
        'inline-flex shrink-0 select-none items-center justify-center font-bold tracking-tight',
        inverted ? 'bg-white/15 text-white ring-1 ring-inset ring-white/25' : 'bg-brand-600 text-white shadow-soft',
        sizes[size],
        className,
      )}
      role={decorative ? undefined : 'img'}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : `${label} monogram`}
    >
      {initialsOf(label)}
    </span>
  )
}
