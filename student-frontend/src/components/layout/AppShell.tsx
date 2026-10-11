import { allowed, routeModule } from '../../utils/permissions'
import { useQuery } from '@tanstack/react-query'
import client from '../../api/client'
import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import Icon, { type IconName } from '../ui/Icon'
import BrandMark from '../branding/BrandMark'
import { useAuth } from '../../contexts/AuthContext'
import { useBranding } from '../../contexts/BrandingContext'
import type { Role } from '../../types'
import { initialsOf } from '../../utils/format'

type NavigationItem = { label: string; path: string; icon: IconName; roles?: Role[]; labels?: Partial<Record<Role, string>> }
type NavigationGroup = { label: string; labels?: Partial<Record<Role, string>>; roles?: Role[]; items: NavigationItem[] }

const learnerRoles: Role[] = ['faculty', 'instructor', 'student']

const navigationGroups: NavigationGroup[] = [
  {
    label: 'Overview',
    items: [{ label: 'Dashboard', path: '/dashboard', icon: 'home' }],
  },
  {
    label: 'Records',
    roles: ['registrar'],
    items: [
      { label: 'Students', path: '/students', icon: 'students', roles: ['registrar'] },
      { label: 'Enrollments', path: '/enrollments', icon: 'enrollments', roles: ['registrar'] },
      { label: 'Grades', path: '/grades', icon: 'grades', roles: ['registrar'] },
    ],
  },
  {
    label: 'Academics',
    roles: ['registrar'],
    items: [
      { label: 'Programs', path: '/programs', icon: 'programs', roles: ['registrar'] },
      { label: 'Courses', path: '/courses', icon: 'courses', roles: ['registrar'] },
      { label: 'Academic terms', path: '/terms', icon: 'calendar', roles: ['registrar'] },
      { label: 'Course offerings', path: '/offerings', icon: 'classes', roles: ['registrar'] },
    ],
  },
  {
    label: 'My studies',
    labels: { faculty: 'Teaching', instructor: 'Teaching' },
    roles: learnerRoles,
    items: [
      { label: 'My classes', path: '/offerings', icon: 'classes', roles: learnerRoles },
      { label: 'My enrollments', path: '/enrollments', icon: 'enrollments', roles: learnerRoles, labels: { faculty: 'Class enrollments', instructor: 'Class enrollments' } },
      { label: 'My grades', path: '/grades', icon: 'grades', roles: learnerRoles, labels: { faculty: 'Grading', instructor: 'Grading' } },
    ],
  },
  {
    label: 'Administration',
    roles: ['admin'],
    items: [
      { label: 'User accounts', path: '/admin/users', icon: 'accounts', roles: ['admin'] },
      { label: 'Security & access', path: '/admin/security', icon: 'shield', roles: ['admin'] },
      { label: 'Audit logs', path: '/admin/audit-logs', icon: 'history', roles: ['admin'] },
      { label: 'System settings', path: '/admin/settings', icon: 'settings', roles: ['admin'] },
    ],
  },
]

const roleTitles: Record<Role, string> = {
  admin: 'Administrator', registrar: 'Registrar', faculty: 'Faculty', instructor: 'Instructor', student: 'Student', advisor: 'Advisor',
}

export default function AppShell() {
  const { user, logout } = useAuth()
  const { institutionName } = useBranding()
  const info = useQuery({ queryKey: ['system-settings'], queryFn: async () => (await client.get('/system-info')).data.data as { institution_name: string; support_email: string | null } })
  const navigate = useNavigate()
  const location = useLocation()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const canSee = ({ roles, path }: { roles?: Role[]; path: string }): boolean =>
    (roles === undefined || (user !== null && roles.includes(user.role))) && (!routeModule(path) || allowed(user, routeModule(path)!))

  const visibleGroups = navigationGroups
    .filter((group) => group.roles === undefined || (user !== null && group.roles.includes(user.role)))
    .map((group) => ({ ...group, items: group.items.filter(canSee) }))
    .filter((group) => group.items.length > 0)

  useEffect(() => {
    if (!mobileNavOpen) return undefined
    const onKeyDown = (event: KeyboardEvent): void => { if (event.key === 'Escape') setMobileNavOpen(false) }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [mobileNavOpen])

  const handleSignOut = async (): Promise<void> => {
    setIsSigningOut(true)
    try { await logout() } finally { navigate('/login', { replace: true }); setIsSigningOut(false) }
  }

  const roleLabel = <T extends { label: string; labels?: Partial<Record<Role, string>> }>(item: T): string =>
    (user && item.labels?.[user.role]) ?? item.label

  const brandHeader = (
    <div className="flex min-w-0 items-center gap-3">
      <BrandMark size="md" />
      <div className="min-w-0">
        <p className="truncate text-[15px] font-semibold leading-tight text-stone-900" title={institutionName}>{institutionName}</p>
        <p className="mt-0.5 text-xs text-stone-600">Student information system</p>
      </div>
    </div>
  )

  const navigation = (
    <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5" aria-label="Main navigation">
      {visibleGroups.map((group) => (
        <div key={group.label}>
          <p className="mb-1.5 px-3 text-xs font-semibold text-brand-900/70">{roleLabel(group)}</p>
          <ul className="space-y-0.5">
            {group.items.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  onClick={() => setMobileNavOpen(false)}
                  className={({ isActive }) => clsx(
                    'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[15px] font-medium transition',
                    isActive
                      ? 'bg-white text-brand-800 shadow-soft ring-1 ring-brand-200/70'
                      : 'text-stone-700 hover:bg-white/70 hover:text-stone-900',
                  )}
                >
                  {({ isActive }) => <>
                    {isActive && <span className="absolute -left-3 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand-600" aria-hidden="true" />}
                    <Icon name={item.icon} size={19} className={isActive ? 'text-brand-600' : 'text-stone-500 group-hover:text-stone-700'} />
                    {roleLabel(item)}
                  </>}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  )

  const userCard = user && (
    <div className="border-t border-brand-100 p-3">
      <div className="flex items-center gap-3 rounded-xl bg-white/80 p-3 ring-1 ring-brand-100">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-800" aria-hidden="true">
          {initialsOf(`${user.first_name} ${user.last_name}`)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-stone-900">{user.name || `${user.first_name} ${user.last_name}`}</p>
          <p className="truncate text-xs text-stone-600">{roleTitles[user.role] ?? user.role}</p>
        </div>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <NavLink
          to="/profile"
          onClick={() => setMobileNavOpen(false)}
          className={({ isActive }) => clsx('btn-ghost btn-sm justify-start', isActive && 'bg-white text-brand-800 ring-1 ring-brand-200/70')}
        >
          <Icon name="user" size={16} />
          Profile
        </NavLink>
        <button type="button" className="btn-ghost btn-sm justify-start" disabled={isSigningOut} aria-busy={isSigningOut} onClick={() => void handleSignOut()}>
          <Icon name="logout" size={16} />
          Sign out
        </button>
      </div>
    </div>
  )

  const sidebarSurface = 'flex flex-col border-r border-brand-100 bg-brand-50'

  return <div className="min-h-screen bg-canvas">
    <aside className={clsx('fixed inset-y-0 left-0 z-30 hidden w-64 md:flex', sidebarSurface)}>
      <div className="px-5 pb-2 pt-5">{brandHeader}</div>
      {navigation}
      {userCard}
    </aside>

    {mobileNavOpen && <div className="fixed inset-0 z-40 md:hidden">
      <button type="button" aria-label="Close navigation" className="absolute inset-0 bg-stone-900/40" onClick={() => setMobileNavOpen(false)} />
      <aside className={clsx('relative h-full w-[min(18rem,85vw)] animate-slide-in shadow-2xl', sidebarSurface)} aria-label="Navigation menu">
        <div className="flex items-center justify-between gap-2 px-4 pb-2 pt-4">
          {brandHeader}
          <button type="button" className="rounded-lg p-2 text-stone-600 transition hover:bg-white hover:text-stone-900" aria-label="Close menu" onClick={() => setMobileNavOpen(false)}>
            <Icon name="close" size={20} />
          </button>
        </div>
        {navigation}
        {userCard}
      </aside>
    </div>}

    <div className="flex min-h-screen flex-col md:ml-64">
      <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-stone-200/80 bg-canvas/95 px-4 md:hidden">
        <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-700 transition hover:bg-stone-50" aria-label="Open navigation" aria-expanded={mobileNavOpen} onClick={() => setMobileNavOpen(true)}>
          <Icon name="menu" size={20} />
        </button>
        <BrandMark size="sm" />
        <p className="min-w-0 truncate text-[15px] font-semibold text-stone-900">{institutionName}</p>
      </header>
      <main key={location.pathname} className="page-enter mx-auto w-full max-w-[1200px] flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10"><Outlet /></main>
      {info.data?.support_email && <footer className="mx-auto w-full max-w-[1200px] px-4 pb-8 text-sm text-stone-600 sm:px-6 lg:px-10">Need help? Contact <a className="link" href={`mailto:${info.data.support_email}`}>{info.data.support_email}</a></footer>}
    </div>
  </div>
}
