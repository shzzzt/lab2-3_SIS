import { allowed, routeModule } from '../utils/permissions'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { getApiErrorMessage } from '../api/errors'
import studentsApi from '../api/students'
import programsApi from '../api/programs'
import offeringsApi from '../api/courseOfferings'
import enrollmentsApi from '../api/enrollments'
import gradesApi from '../api/grades'
import Button from '../components/ui/Button'
import Icon, { type IconName } from '../components/ui/Icon'
import AdminPage from './AdminPage'

type StatTileProps = { label: string; count: number | undefined; isLoading: boolean; isError: boolean; href: string; icon: IconName }

function StatTile({ label, count, isLoading, isError, href, icon }: StatTileProps) {
  return <Link to={href} className="card group flex flex-col p-5 transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift">
    <div className="flex items-center justify-between">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100">
        <Icon name={icon} size={20} />
      </span>
      <Icon name="arrowRight" size={18} className="text-stone-300 transition group-hover:translate-x-0.5 group-hover:text-brand-600" />
    </div>
    <p className="mt-5 text-3xl font-semibold tabular-nums tracking-tight text-stone-900">
      {isLoading ? <span className="inline-block h-8 w-14 animate-pulse rounded-lg bg-stone-100 align-middle" aria-label="Loading" /> : isError ? '—' : (count ?? 0).toLocaleString()}
    </p>
    <p className="mt-1 text-[15px] font-medium text-stone-600">{label}</p>
  </Link>
}

type QuickAction = { title: string; description: string; href: string; icon: IconName }

function QuickActionCard({ action }: { action: QuickAction }) {
  return <Link to={action.href} className="group flex items-start gap-4 rounded-xl border border-stone-200/80 bg-white p-4 transition hover:border-brand-200 hover:bg-brand-50/40">
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-700 transition group-hover:bg-brand-600 group-hover:text-white">
      <Icon name={action.icon} size={19} />
    </span>
    <span className="min-w-0 flex-1">
      <span className="block font-semibold text-stone-900">{action.title}</span>
      <span className="mt-0.5 block text-sm text-stone-600">{action.description}</span>
    </span>
    <Icon name="chevronRight" size={18} className="mt-2.5 text-stone-400 transition group-hover:translate-x-0.5 group-hover:text-brand-600" />
  </Link>
}

function greetingFor(date: Date): { text: string; icon: IconName } {
  const hour = date.getHours()
  if (hour < 12) return { text: 'Good morning', icon: 'sunrise' }
  if (hour < 18) return { text: 'Good afternoon', icon: 'sun' }
  return { text: 'Good evening', icon: 'moon' }
}

export default function DashboardPage() {
  const { user } = useAuth()
  const role = user?.role
  const isRegistrar = role === 'registrar'
  const isTeacher = role === 'faculty' || role === 'instructor'
  const canReadStudentList = isRegistrar
  const canReadCatalog = isRegistrar
  const canReadAcademicActivity = ['registrar', 'faculty', 'instructor', 'student'].includes(role ?? '')
  const canReadGrades = ['registrar', 'faculty', 'instructor', 'student'].includes(role ?? '')

  const students = useQuery({ queryKey: ['dashboard', 'students'], queryFn: async () => (await studentsApi.list({ per_page: 1 })).data, enabled: canReadStudentList && allowed(user, 'students') })
  const programs = useQuery({ queryKey: ['dashboard', 'programs'], queryFn: () => programsApi.list({ per_page: 1 }), enabled: canReadCatalog && allowed(user, 'programs') })
  const offerings = useQuery({ queryKey: ['dashboard', 'offerings'], queryFn: () => offeringsApi.list({ per_page: 1 }), enabled: canReadAcademicActivity && allowed(user, 'course-offerings') })
  const enrollments = useQuery({ queryKey: ['dashboard', 'enrollments'], queryFn: () => enrollmentsApi.list({ per_page: 1 }), enabled: canReadAcademicActivity && allowed(user, 'enrollments') })
  const grades = useQuery({ queryKey: ['dashboard', 'grades'], queryFn: () => gradesApi.list({ per_page: 1 }), enabled: canReadGrades && allowed(user, 'grades') && !isRegistrar })

  const tiles = isRegistrar
    ? [
        { label: 'Students', count: students.data?.meta?.total, query: students, href: '/students', icon: 'students' as const },
        { label: 'Enrollments', count: enrollments.data?.meta?.total, query: enrollments, href: '/enrollments', icon: 'enrollments' as const },
        { label: 'Course offerings', count: offerings.data?.meta?.total, query: offerings, href: '/offerings', icon: 'classes' as const },
        { label: 'Programs', count: programs.data?.meta?.total, query: programs, href: '/programs', icon: 'programs' as const },
      ]
    : canReadAcademicActivity ? [
        { label: 'My classes', count: offerings.data?.meta?.total, query: offerings, href: '/offerings', icon: 'classes' as const },
        { label: isTeacher ? 'Class enrollments' : 'My enrollments', count: enrollments.data?.meta?.total, query: enrollments, href: '/enrollments', icon: 'enrollments' as const },
        { label: isTeacher ? 'Grades recorded' : 'My grades', count: grades.data?.meta?.total, query: grades, href: '/grades', icon: 'grades' as const },
      ] : []

  const visibleTiles = tiles.filter((tile) => allowed(user, routeModule(tile.href)!))
  const failed = visibleTiles.filter((tile) => tile.query.isError)
  const myRecordId = role === 'student' ? enrollments.data?.data[0]?.student_id : undefined

  const actions: QuickAction[] = isRegistrar
    ? [
        ...(allowed(user, 'students', true) ? [{ title: 'Add a student', description: 'Create a new student record.', href: '/students/new', icon: 'students' as const }] : []),
        ...(allowed(user, 'enrollments', true) ? [{ title: 'Enroll a student', description: 'Register a student in a class.', href: '/enrollments', icon: 'enrollments' as const }] : []),
        ...(allowed(user, 'course-offerings', true) ? [{ title: 'Create a course offering', description: 'Schedule a section for a term.', href: '/offerings/new', icon: 'classes' as const }] : []),
        ...(allowed(user, 'grades') ? [{ title: 'Review grades', description: 'See grades submitted by faculty.', href: '/grades', icon: 'grades' as const }] : []),
      ]
    : canReadAcademicActivity
      ? [
          ...(myRecordId ? [{ title: 'Open my academic record', description: 'Your courses and grades, term by term.', href: `/students/${myRecordId}`, icon: 'file' as const }] : []),
          ...(allowed(user, 'course-offerings') ? [{ title: isTeacher ? 'See my classes' : 'View my classes', description: isTeacher ? 'Sections you are teaching this term.' : 'Your schedule, rooms and instructors.', href: '/offerings', icon: 'classes' as const }] : []),
          ...(isTeacher && allowed(user, 'grades', true) ? [{ title: 'Record a grade', description: 'Enter a grade for a student in your class.', href: '/grades', icon: 'grades' as const }] : []),
          ...(!isTeacher && allowed(user, 'grades') ? [{ title: 'Check my grades', description: 'See the grades you have received.', href: '/grades', icon: 'grades' as const }] : []),
          ...(isTeacher && allowed(user, 'enrollments') ? [{ title: 'View class lists', description: 'Who is enrolled in your sections.', href: '/enrollments', icon: 'enrollments' as const }] : []),
        ]
      : []

  if (role === 'admin') return <AdminPage />

  const now = new Date()
  const greeting = greetingFor(now)
  const subtitle = isRegistrar
    ? 'Here’s a quick look at your records today.'
    : isTeacher
      ? 'Here’s what’s happening in your classes.'
      : 'Here’s a snapshot of your studies.'

  return <section className="space-y-8">
    <header>
      <p className="flex items-center gap-2 text-sm font-medium text-brand-700">
        <Icon name={greeting.icon} size={17} />
        {new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(now)}
      </p>
      <h1 className="mt-2 text-[28px] font-semibold leading-tight tracking-tight text-stone-900 sm:text-[32px]">{greeting.text}, {user?.first_name ?? user?.name}</h1>
      <p className="mt-1.5 text-[16px] text-stone-600">{subtitle}</p>
    </header>

    {failed.length > 0 && <div className="alert-warning flex flex-wrap items-center justify-between gap-3" role="status">
      <span>Some dashboard counts could not be loaded. {getApiErrorMessage(failed[0].query.error, 'Try again in a moment.')}</span>
      <Button variant="secondary" size="sm" onClick={() => { void Promise.all(failed.map((tile) => tile.query.refetch())) }}>Retry</Button>
    </div>}

    {visibleTiles.length > 0
      ? <div className={`grid gap-4 sm:grid-cols-2 ${visibleTiles.length >= 4 ? 'xl:grid-cols-4' : 'lg:grid-cols-3'}`}>
          {visibleTiles.map((tile) => <StatTile key={tile.href} label={tile.label} count={tile.count} isLoading={tile.query.isLoading} isError={tile.query.isError} href={tile.href} icon={tile.icon} />)}
        </div>
      : <p className="card p-5 text-stone-600">Your account does not currently have dashboard data modules enabled.</p>}

    {actions.length > 0 && <section aria-labelledby="quick-actions-heading" className="card p-5 sm:p-6">
      <h2 id="quick-actions-heading" className="text-lg font-semibold text-stone-900">What you can do today</h2>
      <p className="mt-0.5 text-sm text-stone-600">Shortcuts to the tasks people in your role do most.</p>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {actions.slice(0, 4).map((action) => <QuickActionCard key={action.title} action={action} />)}
      </div>
    </section>}
  </section>
}
