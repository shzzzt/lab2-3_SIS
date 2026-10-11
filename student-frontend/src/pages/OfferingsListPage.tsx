import { allowed } from '../utils/permissions'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import EmptyState from '../components/feedback/EmptyState'
import ErrorState from '../components/feedback/ErrorState'
import LoadingState from '../components/feedback/LoadingState'
import Pagination from '../components/ui/Pagination'
import Select from '../components/ui/Select'
import FilterBar from '../components/ui/FilterBar'
import Icon from '../components/ui/Icon'
import StatusBadge from '../components/ui/StatusBadge'
import PageHeader from '../components/layout/PageHeader'
import { useAcademicTerms } from '../hooks/useAcademicTerms'
import { useCourseOfferings } from '../hooks/useCourseOfferings'
import { useCourses } from '../hooks/useCourses'
import { useFacultyUsers } from '../hooks/useUsers'
import { useAuth } from '../contexts/AuthContext'
import { formatTime } from '../utils/format'

const dayNames: Record<string, string> = { MWF: 'Mon · Wed · Fri', TTh: 'Tue · Thu', Sat: 'Saturday', Sun: 'Sunday' }

export default function OfferingsListPage() {
  const { user } = useAuth()
  const canManage = user?.role === 'registrar' && allowed(user, 'course-offerings', true)
  const isTeacher = user?.role === 'faculty' || user?.role === 'instructor'
  const canViewRoster = isTeacher || user?.role === 'registrar'
  const [course, setCourse] = useState('')
  const [term, setTerm] = useState('')
  const [instructor, setInstructor] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const query = useCourseOfferings({ course_id: course ? Number(course) : undefined, academic_term_id: term ? Number(term) : undefined, instructor_id: instructor ? Number(instructor) : undefined, status: status || undefined, page, per_page: 20 })
  const courses = useCourses({ per_page: 100 }, canManage && allowed(user, 'courses'))
  const terms = useAcademicTerms({ per_page: 100 }, canManage && allowed(user, 'academic-terms'))
  const faculty = useFacultyUsers(canManage)
  const rows = query.data?.data ?? []
  const activeCount = [course, term, instructor, status].filter(Boolean).length

  const statusSelect = <Select label="Status" hideLabel value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }}><option value="">All statuses</option><option value="scheduled">Scheduled</option><option value="open">Open</option><option value="closed">Closed</option><option value="cancelled">Cancelled</option><option value="completed">Completed</option></Select>

  return (
    <section className="space-y-6">
      <PageHeader
        title={canManage ? 'Course offerings' : 'My classes'}
        description={canManage ? 'Scheduled sections for each term: who teaches them, when, and how full they are.' : isTeacher ? 'The sections you are assigned to teach. Select a class to see its enrolled students.' : 'The classes available to your account.'}
        actions={canManage && <Link className="btn-primary" to="/offerings/new"><Icon name="plus" size={17} />New offering</Link>}
      />
      <FilterBar
        inline={canManage ? <>
          <Select label="Academic term" hideLabel value={term} onChange={(event) => { setTerm(event.target.value); setPage(1) }}><option value="">All terms</option>{terms.data?.data.map((item) => <option key={item.id} value={item.id}>{item.name ?? item.code}</option>)}</Select>
          {statusSelect}
        </> : statusSelect}
        advanced={canManage ? <>
          <Select label="Course" value={course} onChange={(event) => { setCourse(event.target.value); setPage(1) }}><option value="">All courses</option>{courses.data?.data.map((item) => <option key={item.id} value={item.id}>{item.course_code} · {item.title}</option>)}</Select>
          <Select label="Instructor" value={instructor} onChange={(event) => { setInstructor(event.target.value); setPage(1) }}><option value="">All instructors</option>{faculty.data?.map((member) => <option key={member.id} value={member.id}>{member.last_name}, {member.first_name}</option>)}</Select>
        </> : undefined}
        activeCount={activeCount}
        onClear={() => { setCourse(''); setTerm(''); setInstructor(''); setStatus(''); setPage(1) }}
      />
      {query.isLoading ? <LoadingState label="Loading course offerings..." rows={6} />
        : query.isError ? <ErrorState message="Unable to load course offerings." onRetry={() => void query.refetch()} />
        : rows.length === 0 ? <EmptyState icon="classes" title="No course offerings found" description={activeCount ? 'Try clearing the filters.' : canManage ? 'Offerings you schedule will appear here.' : 'Nothing is scheduled for you yet.'} action={canManage && !activeCount ? <Link className="btn-primary" to="/offerings/new"><Icon name="plus" size={17} />New offering</Link> : undefined} />
        : <>
          <div className="table-wrap"><table className="data-table">
            <thead><tr><th scope="col">Course</th><th scope="col">Section</th><th scope="col">Schedule</th><th scope="col">Term</th><th scope="col">Instructor</th><th scope="col">Seats</th><th scope="col">Status</th>{canManage && <th scope="col" className="text-right"><span className="sr-only">Actions</span></th>}</tr></thead>
            <tbody>{rows.map((offering) => {
              const full = offering.capacity > 0 && offering.enrolled_count >= offering.capacity
              const fill = offering.capacity > 0 ? Math.min(100, Math.round((offering.enrolled_count / offering.capacity) * 100)) : 0
              return <tr key={offering.id}>
                <td className="min-w-48">{canViewRoster ? <Link className="group block" to={`/offerings/${offering.id}`} aria-label={`View students in ${offering.course?.course_code ?? 'class'} section ${offering.section}`}><span className="block font-semibold text-brand-700 group-hover:underline">{offering.course?.course_code ?? '—'}</span><span className="cell-muted block">{offering.course?.title ?? ''}</span></Link> : <><span className="block font-semibold text-stone-900">{offering.course?.course_code ?? '—'}</span><span className="cell-muted block">{offering.course?.title ?? ''}</span></>}</td>
                <td>{offering.section}</td>
                <td className="whitespace-nowrap"><span className="block">{dayNames[offering.day_of_week] ?? offering.day_of_week}</span><span className="cell-muted block">{formatTime(offering.start_time)} – {formatTime(offering.end_time)}{offering.room ? ` · ${offering.room}` : ''}</span></td>
                <td className="whitespace-nowrap">{offering.academic_term?.name ?? offering.academic_term?.code ?? '—'}</td>
                <td className="whitespace-nowrap">{offering.instructor ? `${offering.instructor.first_name} ${offering.instructor.last_name}` : '—'}</td>
                <td className="min-w-28">
                  <span className={`block tabular-nums ${full ? 'font-semibold text-rose-700' : ''}`}>{offering.enrolled_count} / {offering.capacity}{full && <span className="ml-1 text-xs font-medium">Full</span>}</span>
                  <span className="mt-1 block h-1.5 w-20 overflow-hidden rounded-full bg-stone-100" aria-hidden="true"><span className={`block h-full rounded-full ${full ? 'bg-rose-500' : 'bg-brand-500'}`} style={{ width: `${fill}%` }} /></span>
                </td>
                <td><StatusBadge status={offering.status} /></td>
                {canManage && <td className="cell-actions"><Link className="btn-ghost btn-sm" to={`/offerings/${offering.id}`}>Students</Link><Link className="btn-ghost btn-sm" to={`/offerings/${offering.id}/edit`}>Edit</Link></td>}
              </tr>
            })}</tbody>
          </table></div>
          <Pagination currentPage={query.data?.meta.current_page ?? 1} lastPage={query.data?.meta.last_page ?? 1} total={query.data?.meta.total} onPageChange={setPage} />
        </>}
    </section>
  )
}
