import { useState, type FormEvent } from 'react'
import axios from 'axios'
import { useLocation, useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Icon from '../components/ui/Icon'
import BrandMark from '../components/branding/BrandMark'
import { useAuth } from '../contexts/AuthContext'
import { useBranding } from '../contexts/BrandingContext'
import type { ApiError } from '../types'

type LoginLocationState = {
  from?: {
    pathname?: string
  }
}

const demoAccounts = [
  { role: 'Administrator', email: 'admin@example.com' },
  { role: 'Registrar', email: 'registrar@example.com' },
  { role: 'Faculty', email: 'faculty@example.com' },
  { role: 'Student', email: 'student@example.com' },
]

function getLoginError(error: unknown): string {
  if (axios.isAxiosError<ApiError>(error)) {
    const responseData = error.response?.data
    const emailError = responseData?.errors?.email?.[0]

    return emailError ?? responseData?.message ?? 'Unable to sign in. Please try again.'
  }

  return 'Unable to sign in. Please try again.'
}

/** Soft dotted texture for the brand panel, drawn in the current theme colour. */
const panelPattern = {
  backgroundImage: 'radial-gradient(rgb(255 255 255 / 0.13) 1.2px, transparent 1.2px)',
  backgroundSize: '22px 22px',
}

export default function LoginPage() {
  const { login } = useAuth()
  const { institutionName, logo } = useBranding()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [mfaRequired, setMfaRequired] = useState(false)
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const from = (location.state as LoginLocationState | null)?.from?.pathname || '/dashboard'

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const complete = await login(email, password, code || undefined)
      if (!complete) { setMfaRequired(true); return }
      setPassword('')
      setCode('')
      navigate(from, { replace: true })
    } catch (requestError: unknown) {
      setError(getLoginError(requestError))
    } finally {
      setIsSubmitting(false)
    }
  }

  const fillDemoAccount = (demoEmail: string): void => {
    setEmail(demoEmail)
    setPassword('password')
    setCode('')
    setMfaRequired(false)
    setError(null)
  }

  return (
    <main className="min-h-screen bg-canvas lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <aside className="relative hidden overflow-hidden bg-brand-700 text-white lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        <div className="absolute inset-0" style={panelPattern} aria-hidden="true" />
        <div className="absolute -bottom-40 -right-32 h-[28rem] w-[28rem] rounded-full bg-brand-600/60" aria-hidden="true" />
        <div className="absolute -bottom-24 -right-10 h-72 w-72 rounded-full border border-white/10" aria-hidden="true" />

        <div className="relative flex items-center gap-3 text-sm font-medium text-white/80">
          <Icon name="building" size={18} />
          Student information system
        </div>

        <div className="relative max-w-md">
          <BrandMark size="xl" inverted={!logo} />
          <p className="mt-8 text-4xl font-semibold leading-tight tracking-tight text-white xl:text-[2.75rem]">{institutionName}</p>
          <p className="mt-4 text-lg leading-relaxed text-white/80">
            Welcome back. Records, classes and grades — all in one calm place.
          </p>
        </div>

        <p className="relative text-sm text-white/70">Your session is protected and every change is recorded.</p>
      </aside>

      <section className="flex min-h-screen flex-col justify-center px-4 py-10 sm:px-8 lg:min-h-0 lg:px-12">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <BrandMark size="lg" />
            <p className="text-lg font-semibold leading-tight text-stone-900">{institutionName}</p>
          </div>

          <h1 className="text-[28px] font-semibold tracking-tight text-stone-900">Sign in</h1>
          <p className="mt-1.5 text-stone-600">
            {mfaRequired ? 'One more step: confirm it’s you with your authenticator.' : 'Use your school email and password to continue.'}
          </p>

          {error && (
            <div className="alert-error mt-6 flex gap-2.5" role="alert">
              <Icon name="alert" size={18} className="mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              placeholder="you@example.com"
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
            {mfaRequired && <Input label="Authenticator or recovery code" value={code} onChange={(event) => setCode(event.target.value)} autoComplete="one-time-code" required autoFocus help="Enter a fresh six-digit authenticator code or one unused recovery code." />}
            <Button className="w-full" type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          {import.meta.env.DEV && (
            <details className="group mt-8 rounded-xl border border-dashed border-stone-300 bg-white/60">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-xl px-4 py-3 text-sm font-medium text-stone-700 hover:text-stone-900 [&::-webkit-details-marker]:hidden">
                <span className="flex items-center gap-2"><Icon name="info" size={16} className="text-brand-600" />Demo accounts</span>
                <Icon name="chevronDown" size={16} className="transition group-open:rotate-180" />
              </summary>
              <div className="border-t border-stone-200 px-2 pb-2 pt-1">
                <p className="px-2 py-2 text-xs text-stone-600">Development only. Pick an account to fill the form; all use the same demo password.</p>
                <ul className="grid gap-1">
                  {demoAccounts.map((account) => (
                    <li key={account.email}>
                      <button type="button" className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2 text-left text-sm transition hover:bg-brand-50" onClick={() => fillDemoAccount(account.email)}>
                        <span className="font-medium text-stone-800">{account.role}</span>
                        <span className="truncate text-stone-600">{account.email}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </details>
          )}
        </div>
      </section>
    </main>
  )
}
