type LoadingStateProps = {
  label?: string
  /** Show placeholder table rows instead of a spinner. */
  rows?: number
}

export default function LoadingState({ label = 'Loading...', rows }: LoadingStateProps) {
  if (rows) {
    return (
      <div className="card overflow-hidden" role="status" aria-live="polite">
        <span className="sr-only">{label}</span>
        <div className="border-b border-stone-200 bg-stone-50/70 px-5 py-3.5">
          <div className="h-3 w-40 animate-pulse rounded-full bg-stone-200" />
        </div>
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="flex items-center gap-4 border-b border-stone-100 px-5 py-4 last:border-b-0" aria-hidden="true">
            <div className="h-3.5 w-24 animate-pulse rounded-full bg-stone-200/80" />
            <div className="h-3.5 flex-1 animate-pulse rounded-full bg-stone-100" style={{ maxWidth: `${60 - (index % 3) * 12}%` }} />
            <div className="ml-auto h-5 w-16 animate-pulse rounded-full bg-stone-100" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center gap-3 py-12" role="status" aria-live="polite">
      <span
        className="h-5 w-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600"
        aria-hidden="true"
      />
      <span className="text-[15px] text-stone-600">{label}</span>
    </div>
  )
}
