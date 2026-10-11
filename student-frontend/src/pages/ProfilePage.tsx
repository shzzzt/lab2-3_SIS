import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import ProfileSecurity from '../components/profile/ProfileSecurity'
import type { Role } from '../types'
import PageHeader from '../components/layout/PageHeader'
import Icon from '../components/ui/Icon'
import StatusBadge from '../components/ui/StatusBadge'
import { humanize } from '../utils/format'

const roles: Record<Role, { title: string; description: string }> = {
  admin: { title: 'Administrator', description: 'Manage user accounts, system settings, security policies, and audit history.' },
  registrar: { title: 'Registrar', description: 'Manage student records, academic programs, courses, terms, and enrollments.' },
  faculty: { title: 'Faculty', description: 'View your assigned classes and manage grades for students in those classes.' },
  instructor: { title: 'Instructor', description: 'View your assigned classes and manage grades for students in those classes.' },
  student: { title: 'Student', description: 'View your own student information, enrollments, grades, and academic record.' },
  advisor: { title: 'Advisor', description: 'Review academic information within your assigned access.' },
}
const moduleLabels: Record<string, string> = {
  accounts: 'User accounts', settings: 'System settings', security: 'Security policies', audit: 'Audit history',
  students: 'Student records', programs: 'Programs', courses: 'Courses', 'academic-terms': 'Academic terms',
  'course-offerings': 'Course offerings', enrollments: 'Enrollments', grades: 'Grades & academic records',
}
const formatDate = (value?: string) => {
  if (!value || Number.isNaN(Date.parse(value))) return 'Not available'
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function ProfilePage() {
  const { user } = useAuth()
  const { hash } = useLocation()
  useEffect(() => {
    if (hash === '#security') document.getElementById('security')?.scrollIntoView({ block: 'start' })
  }, [hash])
  if (!user) return null

  const role = roles[user.role]
  const initials = `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase()
  const permissions = Object.entries(user.permissions ?? {}).filter(([, level]) => level !== 'none')
  const mfaNeeded = user.mfa_required && !user.mfa_enabled

  return <div className="space-y-8">
    <PageHeader eyebrow="Your account" title="My profile" description="Your personal details, access, and sign-in security in one place." actions={<a href="#security" className="btn-secondary"><Icon name="lock" size={16} />Manage sign-in security</a>} />

    <section aria-label="Profile overview" className="card overflow-hidden">
      <div className="h-24 bg-brand-600 sm:h-28" style={{ backgroundImage: 'radial-gradient(rgb(255 255 255 / 0.14) 1.2px, transparent 1.2px)', backgroundSize: '20px 20px' }} />
      <div className="px-5 pb-6 sm:px-8">
        <div className="-mt-10 flex flex-wrap items-end justify-between gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-brand-100 text-2xl font-semibold text-brand-800 shadow-soft" aria-hidden="true">{initials}</div>
          <div className="flex flex-wrap gap-2 pb-1"><StatusBadge status="role" tone="brand" label={role.title} /><StatusBadge status={user.status} label={`${humanize(user.status)} account`} /></div>
        </div>
        <div className="mt-4"><h2 className="text-2xl font-semibold tracking-tight">{user.name || `${user.first_name} ${user.last_name}`}</h2><p className="mt-1 break-all text-stone-500">{user.email}</p></div>
        <div className="mt-6 grid gap-4 border-t border-stone-100 pt-5 sm:grid-cols-3">
          <div><p className="text-sm text-stone-600">Account ID</p><p className="mt-1 font-medium">#{user.id}</p></div>
          <div><p className="text-sm text-stone-600">Member since</p><p className="mt-1 font-medium">{formatDate(user.created_at)}</p></div>
          <div><p className="text-sm text-stone-600">Multi-factor authentication</p><a href="#security" className={`mt-1 inline-block font-medium underline decoration-dotted underline-offset-4 ${user.mfa_enabled ? 'text-emerald-700' : 'text-amber-700'}`}>{user.mfa_enabled ? 'Enabled' : mfaNeeded ? 'Setup required' : 'Not enabled'}</a></div>
        </div>
      </div>
    </section>

    {mfaNeeded && <div role="status" className="alert-warning p-5"><p className="font-semibold">Finish securing your account</p><p className="mt-1">Your role requires MFA. Set up your authenticator in Security &amp; sign-in below to continue using the application.</p></div>}

    <div className="grid items-start gap-6 lg:grid-cols-2">
      <section aria-labelledby="personal-details-heading" className="card p-6">
        <h2 id="personal-details-heading" className="text-lg font-semibold">Personal details</h2><p className="mt-1 text-sm text-stone-500">The information associated with your sign-in account.</p>
        <dl className="mt-6 grid gap-x-6 gap-y-5 sm:grid-cols-2">
          {[['First name', user.first_name], ['Last name', user.last_name], ['Email address', user.email], ['Account status', user.status], ['Role', role.title], ['Account last updated', formatDate(user.updated_at)]].map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-sm text-stone-500">{label}</dt><dd className="mt-1 break-words font-medium text-stone-900">{value}</dd></div>)}
        </dl>
        <p className="mt-6 border-t border-stone-100 pt-4 text-sm text-stone-500">Contact your administrator if your name, email address, or role needs to change.</p>
      </section>
      <section aria-labelledby="role-access-heading" className="card p-6">
        <h2 id="role-access-heading" className="text-lg font-semibold">Role &amp; access</h2><p className="mt-2 text-sm leading-6 text-stone-600">{role.description}</p>
        {permissions.length > 0 ? <ul className="mt-4 divide-y divide-stone-100">{permissions.map(([module, level]) => <li key={module} className="flex items-center justify-between gap-4 py-3 text-sm"><span>{moduleLabels[module] ?? module}</span><span className={`shrink-0 rounded-md px-2 py-1 text-xs font-medium ${level === 'manage' ? 'bg-brand-50 text-brand-800' : 'bg-stone-100 text-stone-600'}`}>{level === 'manage' ? 'Manage' : 'View'}</span></li>)}</ul> : <p className="mt-4 text-sm text-stone-500">Your administrator controls which areas you can access.</p>}
        <p className="mt-4 text-xs leading-5 text-stone-500">Permissions apply within your role. Student records stay limited to your own account; faculty access stays limited to assigned classes.</p>
      </section>
    </div>

    <ProfileSecurity />
  </div>
}
