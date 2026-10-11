/** Turns API keys such as `on_leave` or `course-offerings` into "On leave". */
export const humanize = (value: string): string => {
  const text = value.replaceAll('_', ' ').replaceAll('-', ' ')
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export const initialsOf = (value: string, max = 2): string => {
  const words = value
    .split(/\s+/)
    .map((word) => word.replace(/[^\p{L}\p{N}]/gu, ''))
    .filter((word) => word.length > 0 && !['of', 'the', 'and', 'for', 'de', 'ng'].includes(word.toLowerCase()))
  const letters = (words.length > 0 ? words : [value]).slice(0, max).map((word) => word.charAt(0))
  return letters.join('').toUpperCase() || '?'
}

export const formatDate = (value?: string | null, fallback = '—'): string => {
  if (!value || Number.isNaN(Date.parse(value))) return fallback
  // Date-only values (YYYY-MM-DD) are calendar dates, so read them in local time.
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  const date = dateOnly ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3])) : new Date(value)
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date)
}

export const formatTime = (value: string): string => {
  const [hourText, minute] = value.slice(0, 5).split(':')
  const hour = Number(hourText)
  return `${hour % 12 || 12}:${minute} ${hour >= 12 ? 'PM' : 'AM'}`
}
