import { useState, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import client from '../api/client'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { getApiErrorMessage } from '../api/errors'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Icon, { type IconName } from '../components/ui/Icon'
import PageHeader from '../components/layout/PageHeader'
import ErrorState from '../components/feedback/ErrorState'
import LoadingState from '../components/feedback/LoadingState'
import { humanize } from '../utils/format'

type Level = 'none' | 'read' | 'manage'
type Permissions = Record<string, Record<string, Level>>
type Policy = { password_min_length: number; session_minutes: number; login_attempts: number; lockout_minutes: number; mfa_required_roles: string[]; permissions: Permissions }
type Response = { data: Policy; ceilings: Permissions }

const levelLabels: Record<Level, string> = { none: 'No access', read: 'View', manage: 'Manage' }

function PolicyCard({ icon, title, description, children }: { icon: IconName; title: string; description: ReactNode; children: ReactNode }) {
  return <section className="card" aria-labelledby={`${icon}-policy-heading`}>
    <header className="flex items-start gap-3 border-b border-stone-100 px-5 py-4 sm:px-6">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100"><Icon name={icon} size={18} /></span>
      <div><h2 id={`${icon}-policy-heading`} className="text-lg font-semibold text-stone-900">{title}</h2><p className="text-sm text-stone-600">{description}</p></div>
    </header>
    <div className="space-y-6 px-5 py-5 sm:px-6 sm:py-6">{children}</div>
  </section>
}

function PolicyForm({ initial }: { initial: Response }) {
  const [policy, setPolicy] = useState(initial.data)
  const [password, setPassword] = useState('')
  const { refreshUser } = useAuth()
  const { showToast } = useToast()
  const cache = useQueryClient()
  const save = useMutation({ mutationFn: () => client.put('/admin/security', { ...policy, password }), onSuccess: async () => { setPassword(''); showToast('Security policy saved.', 'success'); await cache.invalidateQueries({ queryKey: ['security-policy'] }); await refreshUser() } })
  return <form className="space-y-6" onSubmit={(event) => { event.preventDefault(); save.mutate() }}>
    <PolicyCard icon="lock" title="Sign-in rules" description="Password strength, session length and protection against repeated failed sign-ins.">
      <div className="grid gap-5 sm:grid-cols-2">
        <Input label="Minimum password length" type="number" min={8} max={128} value={policy.password_min_length} required onChange={(e) => setPolicy({ ...policy, password_min_length: Number(e.target.value) })} help="Applies when creating or resetting passwords; existing passwords continue to work." />
        <Input label="Session duration (minutes)" type="number" min={5} max={480} value={policy.session_minutes} required onChange={(e) => setPolicy({ ...policy, session_minutes: Number(e.target.value) })} help="An absolute session limit. Reductions also apply to existing sessions." />
        <Input label="Failed login attempt limit" type="number" min={3} max={10} value={policy.login_attempts} required onChange={(e) => setPolicy({ ...policy, login_attempts: Number(e.target.value) })} />
        <Input label="Login lockout (minutes)" type="number" min={1} max={60} value={policy.lockout_minutes} required onChange={(e) => setPolicy({ ...policy, lockout_minutes: Number(e.target.value) })} />
      </div>
      <fieldset className="space-y-3 border-t border-stone-100 pt-5">
        <legend className="font-semibold text-stone-900">Require MFA for roles</legend>
        <p className="text-sm text-stone-600">Selected roles must enroll before accessing records. Enable your own MFA in Profile → Security &amp; sign-in before requiring it for Admin.</p>
        <div className="flex flex-wrap gap-2">{Object.keys(initial.ceilings).map((role) => {
          const checked = policy.mfa_required_roles.includes(role)
          return <label key={role} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-500/60 ${checked ? 'border-brand-300 bg-brand-50 text-brand-800' : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300'}`}>
            <input type="checkbox" className="checkbox" checked={checked} onChange={(e) => setPolicy({ ...policy, mfa_required_roles: e.target.checked ? [...policy.mfa_required_roles, role] : policy.mfa_required_roles.filter((r) => r !== role) })} />
            {humanize(role)}
          </label>
        })}</div>
      </fieldset>
    </PolicyCard>

    <PolicyCard icon="shield" title="Permission levels" description="No access blocks a module. View allows reading. Manage allows changes. Faculty assignment and student ownership limits still apply; administrator access is fixed to prevent lockout.">
      <div className="grid gap-4 md:grid-cols-2">{Object.entries(initial.ceilings).map(([role, modules]) => <fieldset key={role} className="rounded-xl border border-stone-200 bg-stone-50/50 p-4">
        <legend className="px-1.5 font-semibold text-stone-900">{humanize(role)}</legend>
        <div className="divide-y divide-stone-200/70">{Object.entries(modules).map(([module, ceiling]) => <label key={module} className="flex items-center justify-between gap-4 py-2">
          <span className="text-sm text-stone-700">{humanize(module)}</span>
          <select aria-label={`${role} ${module} permission`} className="input min-h-9 max-w-36 py-1.5 text-sm" disabled={role === 'admin'} value={policy.permissions[role][module]} onChange={(e) => setPolicy({ ...policy, permissions: { ...policy.permissions, [role]: { ...policy.permissions[role], [module]: e.target.value as Level } } })}>
            {(ceiling === 'manage' ? ['none', 'read', 'manage'] as const : ['none', 'read'] as const).map((level) => <option key={level} value={level}>{levelLabels[level]}</option>)}
          </select>
        </label>)}</div>
      </fieldset>)}</div>
    </PolicyCard>

    <section className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6" aria-label="Confirm and save">
      <div className="w-full max-w-sm"><Input label="Confirm your current password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required help="Policy changes are recorded in the audit log." /></div>
      <div className="flex flex-col items-start gap-2 sm:items-end">
        {save.isError && <p role="alert" className="text-sm text-rose-700">{getApiErrorMessage(save.error)}</p>}
        <Button type="submit" loading={save.isPending}>Save security policy</Button>
      </div>
    </section>
  </form>
}

export default function SecurityPolicyPage() {
  const policy = useQuery({ queryKey: ['security-policy'], queryFn: async () => (await client.get<Response>('/admin/security')).data })
  return <section className="space-y-6">
    <PageHeader title="Security & access control" description="Configure authentication requirements and role permissions. Policy changes are recorded in the audit log." />
    {policy.isPending ? <LoadingState label="Loading policy…" /> : policy.isError ? <ErrorState message={getApiErrorMessage(policy.error)} onRetry={() => void policy.refetch()} /> : <PolicyForm initial={policy.data} />}
  </section>
}
