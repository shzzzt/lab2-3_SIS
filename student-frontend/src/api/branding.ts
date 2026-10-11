import client from './client'

export const brandingQueryKey = ['branding'] as const
export const DEFAULT_INSTITUTION_NAME = 'Student Information'

export const THEMES = ['teal', 'indigo', 'forest', 'plum', 'sunset', 'graphite'] as const
export type ThemeKey = (typeof THEMES)[number]

export type Branding = {
  institution_name: string
  theme: ThemeKey
  logo: string | null
}

export type SystemSettings = Branding & {
  support_email: string | null
}

export type SettingsInput = {
  institution_name: string
  support_email: string | null
  theme: ThemeKey
}

export const isThemeKey = (value: unknown): value is ThemeKey =>
  typeof value === 'string' && (THEMES as readonly string[]).includes(value)

const brandingApi = {
  /** Public endpoint: works before sign-in so the login page is branded too. */
  async get(): Promise<Branding> {
    return (await client.get<{ data: Branding }>('/branding')).data.data
  },
  async getSettings(): Promise<SystemSettings> {
    return (await client.get<{ data: SystemSettings }>('/admin/settings')).data.data
  },
  async saveSettings(input: SettingsInput): Promise<SystemSettings> {
    return (await client.put<{ data: SystemSettings }>('/admin/settings', input)).data.data
  },
  async uploadLogo(file: File): Promise<SystemSettings> {
    const body = new FormData()
    body.append('logo', file)
    // The multipart header stops Axios from JSON-encoding the FormData; the
    // browser then fills in the boundary itself.
    return (await client.post<{ data: SystemSettings }>('/admin/settings/logo', body, { headers: { 'Content-Type': 'multipart/form-data' } })).data.data
  },
  async removeLogo(): Promise<SystemSettings> {
    return (await client.delete<{ data: SystemSettings }>('/admin/settings/logo')).data.data
  },
}

export default brandingApi
