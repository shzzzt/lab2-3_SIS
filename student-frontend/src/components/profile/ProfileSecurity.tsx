import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { QRCodeSVG } from 'qrcode.react'
import client, { AUTH_TOKEN_KEY } from '../../api/client'
import { getApiErrorMessage } from '../../api/errors'
import { useAuth } from '../../contexts/AuthContext'
import Input from '../ui/Input'
import Button from '../ui/Button'
import Icon from '../ui/Icon'
import ErrorState from '../feedback/ErrorState'
import LoadingState from '../feedback/LoadingState'

type Status = { enabled: boolean; required: boolean; recovery_codes_remaining: number }
type Result = { secret?: string; uri?: string; access_token?: string; recovery_codes?: string[] }

export default function ProfileSecurity() {
  const { refreshUser } = useAuth()
  const cache = useQueryClient()
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [setup, setSetup] = useState<{ secret: string; uri: string } | null>(null)
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const status = useQuery({ queryKey: ['my-security'], queryFn: async () => (await client.get<{ data: Status }>('/security/mfa')).data.data })
  const action = useMutation({
    mutationFn: async (operation: string) => (await client.post<Result>(`/security/mfa/${operation}`, { password, code })).data,
    onSuccess: async (result, operation) => {
      if (result.access_token) localStorage.setItem(AUTH_TOKEN_KEY, result.access_token)
      if (result.secret && result.uri) setSetup({ secret: result.secret, uri: result.uri })
      if (operation !== 'setup') setSetup(null)
      if (result.recovery_codes) setRecoveryCodes(result.recovery_codes)
      if (operation === 'disable') setRecoveryCodes([])
      setPassword(''); setCode('')
      setMessage(operation === 'confirm' ? 'MFA is enabled. Save your recovery codes now.' : operation === 'disable' ? 'MFA disabled.' : operation === 'recovery' ? 'New recovery codes generated. Old codes no longer work.' : 'Scan the QR code or enter the setup key in your authenticator, then confirm with a code.')
      await cache.invalidateQueries({ queryKey: ['my-security'] })
      if (result.access_token) await refreshUser()
    },
  })
  return <section id="security" aria-labelledby="profile-security-heading" className="scroll-mt-24 space-y-6">
    <header><h2 id="profile-security-heading" className="text-xl font-semibold tracking-tight text-stone-900">Security &amp; sign-in</h2><p className="mt-1 text-stone-600">Protect your account with authenticator-app verification and recovery codes.</p></header>
    {status.isPending && <LoadingState label="Loading security settings…" />}
    {status.isError && <ErrorState message={getApiErrorMessage(status.error)} onRetry={() => void status.refetch()} />}
    {status.data && <div className="card flex items-start gap-4 p-6"><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ${status.data.enabled ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-amber-50 text-amber-700 ring-amber-200'}`}><Icon name="shield" size={20} /></span><div><h3 className="text-lg font-semibold">Multi-factor authentication: {status.data.enabled ? 'Enabled' : 'Not enabled'}</h3><p className="mt-1 text-stone-600">{status.data.required ? (status.data.enabled ? 'Your account meets the MFA requirement for your role.' : 'Required for your role. Complete setup below to access the application.') : 'Optional for your role. Enabling MFA adds a verification step at sign-in.'}</p>{status.data.enabled && <p className="mt-2">{status.data.recovery_codes_remaining} recovery codes remaining.</p>}</div></div>}
    {message && <p role="status" className="alert-info">{message}</p>}
    {action.isError && <p role="alert" className="alert-error">{getApiErrorMessage(action.error)}</p>}
    {recoveryCodes.length > 0 && <div role="region" aria-label="Recovery codes" className="space-y-4 rounded-xl border border-amber-300 bg-amber-50 p-6 text-amber-950"><h3 className="text-lg font-semibold">Save your recovery codes</h3><p>Each code works once in place of an authenticator code. Keep them in a secure password manager. These codes are shown only now.</p><ul className="grid gap-2 rounded-lg bg-white p-4 font-mono text-sm ring-1 ring-amber-200 sm:grid-cols-2">{recoveryCodes.map((value) => <li key={value}>{value}</li>)}</ul><Button variant="secondary" onClick={() => setRecoveryCodes([])}>I have saved my codes</Button></div>}
    {setup && <form className="card space-y-4 p-6" onSubmit={(e) => { e.preventDefault(); action.mutate('confirm') }}><h3 className="text-lg font-semibold">Connect your authenticator</h3><p>In your authenticator app, add an account and scan this QR code. Setup expires after 10 minutes.</p><QRCodeSVG value={setup.uri} size={200} title="Authenticator setup QR code" /><p>Or enter this setup key manually:</p><code className="block break-all rounded-lg bg-stone-100 p-3 text-sm">{setup.secret}</code><p className="help-text">Choose a time-based account if your authenticator asks.</p><Input label="Authenticator code" value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" required /><Button type="submit" loading={action.isPending}>Enable MFA</Button></form>}
    {status.data && !setup && <form className="card space-y-4 p-6" onSubmit={(e) => { e.preventDefault(); action.mutate(status.data.enabled ? 'recovery' : 'setup') }}>
      <h3 className="text-lg font-semibold">{status.data.enabled ? 'Manage your MFA' : 'Set up MFA'}</h3>
      <Input label="Current password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      {status.data.enabled && <Input label="Authenticator or recovery code" value={code} onChange={(e) => setCode(e.target.value)} autoComplete="one-time-code" required help="Use a fresh code. Each authenticator code can be used only once." />}
      <div className="flex flex-wrap gap-3"><Button type="submit" loading={action.isPending}>{status.data.enabled ? 'Generate new recovery codes' : 'Start MFA setup'}</Button>{status.data.enabled && !status.data.required && <Button type="button" variant="secondary" disabled={action.isPending || !password || !code} onClick={() => action.mutate('disable')}>Disable MFA</Button>}</div>
    </form>}
  </section>
}
