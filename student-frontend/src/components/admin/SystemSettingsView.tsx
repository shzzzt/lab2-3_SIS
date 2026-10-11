import { useEffect, useState, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import brandingApi, { brandingQueryKey, isThemeKey, type SystemSettings, type ThemeKey } from '../../api/branding'
import { getApiErrorMessage, getValidationErrors } from '../../api/errors'
import { useBranding } from '../../contexts/BrandingContext'
import { useToast } from '../../contexts/ToastContext'
import PageHeader from '../layout/PageHeader'
import ErrorState from '../feedback/ErrorState'
import LoadingState from '../feedback/LoadingState'
import Button from '../ui/Button'
import Icon, { type IconName } from '../ui/Icon'
import Input from '../ui/Input'
import ThemePicker from './ThemePicker'
import LogoSettings from './LogoSettings'

function SettingsCard({ icon, title, description, children, footer }: { icon: IconName; title: string; description: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <section className="card" aria-labelledby={`${icon}-heading`}>
      <header className="flex items-start gap-3 border-b border-stone-100 px-5 py-4 sm:px-6">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100">
          <Icon name={icon} size={18} />
        </span>
        <div>
          <h2 id={`${icon}-heading`} className="text-lg font-semibold text-stone-900">{title}</h2>
          <p className="text-sm text-stone-600">{description}</p>
        </div>
      </header>
      <div className="px-5 py-5 sm:px-6 sm:py-6">{children}</div>
      {footer}
    </section>
  )
}

type FormState = { institution_name: string; support_email: string; theme: ThemeKey }

const toForm = (settings: SystemSettings): FormState => ({
  institution_name: settings.institution_name,
  support_email: settings.support_email ?? '',
  theme: isThemeKey(settings.theme) ? settings.theme : 'teal',
})

function SettingsForm({ initial, logo }: { initial: SystemSettings; logo: string | null }) {
  const cache = useQueryClient()
  const { showToast } = useToast()
  const { setPreviewTheme } = useBranding()
  const [saved, setSaved] = useState<FormState>(() => toForm(initial))
  const [form, setForm] = useState<FormState>(saved)
  const dirty = form.institution_name !== saved.institution_name || form.support_email !== saved.support_email || form.theme !== saved.theme

  // Leaving the page without saving drops the live theme preview.
  useEffect(() => () => setPreviewTheme(null), [setPreviewTheme])

  const save = useMutation({
    mutationFn: () => brandingApi.saveSettings({ institution_name: form.institution_name, support_email: form.support_email || null, theme: form.theme }),
    onSuccess: async (settings) => {
      cache.setQueryData(['system-settings'], settings)
      await cache.invalidateQueries({ queryKey: brandingQueryKey })
      setPreviewTheme(null)
      setSaved(toForm(settings))
      setForm(toForm(settings))
      showToast('Settings saved.', 'success')
    },
  })
  const fieldErrors = getValidationErrors(save.error)

  const chooseTheme = (theme: ThemeKey): void => {
    setForm({ ...form, theme })
    setPreviewTheme(theme === saved.theme ? null : theme)
  }

  const cancel = (): void => {
    setForm(saved)
    setPreviewTheme(null)
    save.reset()
  }

  return (
    <div className="space-y-6">
    <form className="space-y-6" onSubmit={(event) => { event.preventDefault(); save.mutate() }}>
      <SettingsCard icon="building" title="Institution" description="How your school is named across the app and in the browser tab.">
        <div className="grid gap-5 sm:grid-cols-2">
          <Input label="Institution name" required maxLength={100} value={form.institution_name} error={fieldErrors.institution_name?.[0]} onChange={(event) => setForm({ ...form, institution_name: event.target.value })} />
          <Input label="Support email" type="email" value={form.support_email} error={fieldErrors.support_email?.[0]} help="Shown at the bottom of every page so people know who to ask." onChange={(event) => setForm({ ...form, support_email: event.target.value })} />
        </div>
      </SettingsCard>

      <SettingsCard icon="palette" title="Theme" description="Pick a colour for buttons, links and the sidebar. You'll see a live preview before saving.">
        <ThemePicker value={form.theme} onChange={chooseTheme} />
        {form.theme !== saved.theme && (
          <p className="alert-info mt-4 flex items-center gap-2" role="status">
            <Icon name="info" size={17} />
            Previewing this theme. Save to apply it for everyone, or cancel to go back.
          </p>
        )}
      </SettingsCard>

      <div className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-xl border border-stone-200 bg-white/95 px-5 py-3.5 shadow-lift sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-stone-600" aria-live="polite">
          {save.isError
            ? <span className="text-rose-700" role="alert">{getApiErrorMessage(save.error, 'Could not save settings.')}</span>
            : dirty ? 'You have unsaved changes.' : 'All changes saved.'}
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:gap-3">
          <Button variant="secondary" onClick={cancel} disabled={!dirty || save.isPending}>Cancel</Button>
          <Button type="submit" loading={save.isPending} disabled={!dirty && !save.isError}>Save settings</Button>
        </div>
      </div>
    </form>

      <SettingsCard icon="upload" title="Logo" description="Changes to the logo are saved straight away.">
        <LogoSettings logo={logo} institutionName={saved.institution_name} />
      </SettingsCard>
    </div>
  )
}

export default function SystemSettingsView() {
  const settings = useQuery({ queryKey: ['system-settings'], queryFn: brandingApi.getSettings })

  return (
    <section className="mx-auto max-w-4xl space-y-8">
      <PageHeader title="System settings" description="Manage the institution name, support contact, theme and logo shown across the application." />
      {settings.isPending
        ? <LoadingState label="Loading settings…" />
        : settings.isError
          ? <ErrorState message="Could not load settings." onRetry={() => void settings.refetch()} />
          : <SettingsForm initial={settings.data} logo={settings.data.logo ?? null} />}
    </section>
  )
}
