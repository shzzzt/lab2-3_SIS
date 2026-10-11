import { useQuery } from '@tanstack/react-query'
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import brandingApi, { brandingQueryKey, DEFAULT_INSTITUTION_NAME, isThemeKey, type Branding, type ThemeKey } from '../api/branding'

const CACHE_KEY = 'branding_cache'

type BrandingContextValue = {
  institutionName: string
  /** The theme currently painted on screen (includes an unsaved preview). */
  theme: ThemeKey
  /** The theme saved on the server. */
  savedTheme: ThemeKey
  logo: string | null
  isLoading: boolean
  /** Temporarily paint a theme without saving it; pass null to revert. */
  setPreviewTheme: (theme: ThemeKey | null) => void
}

const fallback: BrandingContextValue = {
  institutionName: DEFAULT_INSTITUTION_NAME,
  theme: 'teal',
  savedTheme: 'teal',
  logo: null,
  isLoading: false,
  setPreviewTheme: () => undefined,
}

const BrandingContext = createContext<BrandingContextValue | undefined>(undefined)

function readCachedBranding(): Branding | undefined {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return undefined
    const parsed = JSON.parse(raw) as Partial<Branding>
    if (typeof parsed.institution_name !== 'string' || !isThemeKey(parsed.theme)) return undefined
    return { institution_name: parsed.institution_name, theme: parsed.theme, logo: typeof parsed.logo === 'string' ? parsed.logo : null }
  } catch {
    return undefined
  }
}

function writeCachedBranding(branding: Branding): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(branding))
  } catch {
    // Storage can be full or blocked; the cache only avoids a colour flash on reload.
  }
}

export function BrandingProvider({ children }: { children: ReactNode }) {
  const query = useQuery({
    queryKey: brandingQueryKey,
    queryFn: brandingApi.get,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    // Keeps the last known branding on screen while signing in/out clears the cache.
    placeholderData: (previous) => previous ?? readCachedBranding(),
  })
  const [previewTheme, setPreviewTheme] = useState<ThemeKey | null>(null)

  const data = query.data
  const savedTheme: ThemeKey = isThemeKey(data?.theme) ? data.theme : 'teal'
  const theme = previewTheme ?? savedTheme
  const institutionName = data?.institution_name?.trim() || DEFAULT_INSTITUTION_NAME
  const logo = data?.logo ?? null

  useEffect(() => {
    if (query.isSuccess && !query.isPlaceholderData && data) writeCachedBranding(data)
  }, [data, query.isPlaceholderData, query.isSuccess])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    document.title = institutionName
  }, [institutionName])

  useEffect(() => {
    const icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
    if (!icon) return
    icon.href = logo ?? '/favicon.svg'
    icon.type = logo ? (logo.slice(5, logo.indexOf(';')) || 'image/png') : 'image/svg+xml'
  }, [logo])

  const value = useMemo<BrandingContextValue>(() => ({
    institutionName,
    theme,
    savedTheme,
    logo,
    isLoading: query.isPending,
    setPreviewTheme,
  }), [institutionName, logo, query.isPending, savedTheme, theme])

  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>
}

// This hook intentionally shares its context module with BrandingProvider.
// Outside the provider (isolated page tests) it returns the default branding.
// eslint-disable-next-line react-refresh/only-export-components
export function useBranding(): BrandingContextValue {
  return useContext(BrandingContext) ?? fallback
}
