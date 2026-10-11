import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import { allowed } from '../utils/permissions'
import courseOfferingsApi from '../api/courseOfferings'
import LoadingState from '../components/feedback/LoadingState'
import ErrorState from '../components/feedback/ErrorState'
import EmptyState from '../components/feedback/EmptyState'
import Input from '../components/ui/Input'
import Icon from '../components/ui/Icon'
import StatusBadge from '../components/ui/StatusBadge'
import PageHeader from '../components/layout/PageHeader'
import { formatTime } from '../utils/format'

const dayNames: Record<string, string> = { MWF: 'Mon · Wed · Fri', TTh: 'Tue · Thu', Sat: 'Saturday', Sun: 'Sunday' }

function errorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 404) return 'This class could not be found.'
    if (error.response?.status === 403) return 'You can only view classes assigned to you.'
  }
  return fallback
}

export default function OfferingDetailPage() {
  const { id } = useParams()
  const offeringId = Number(id)
  const { user } = useAuth()
  const canManage = user?.role === 'registrar' && allowed(user, 'course-offerings', true)
  const backLabel = canManage ? 'Back to course offerings' : 'Back to my classes'
  const [search, setSearch] = useState('')

  const offering = useQuery({ queryKey: ['course-offering', offeringId], queryFn: () => courseOfferingsApi.get(offeringId), enabled: Number.isFinite(offeringId) })
  const roster = useQuery({ queryKey: ['course-offering', offeringId, 'students'], queryFn: () => courseOfferingsApi.students(offeringId), enabled: offering.isSuccess })

  const students = useMemo(() => {
    const term = search.trim().toLowerCase()
    const list = roster.data ?? []
    return term ? list.filter((s) => `${s.first_name} ${s.last_name} ${s.student_number}`.toLowerCase().includes(term)) : list
  }, [roster.data, search])

  if (offering.isPending) return <LoadingState label="Loading class…" />
  if (offering.isError) return <div className="space-y-4">
    <Link className="-ml-1 inline-flex items-center gap-1.5 rounded-md px-1 py-0.5 text-sm font-medium text-stone-600 hover:text-brand-700" to="/offerings"><Icon name="arrowLeft" size={16} />{backLabel}</Link>
    <ErrorState message={errorMessage(offering.error, 'Unable to load this class.')} onRetry={() => void offering.refetch()} />
  </div>

  const o = offering.data
  const details: Array<[string, string]> = [
    ['Schedule', `${dayNames[o.day_of_week] ?? o.day_of_week} · ${formatTime(o.start_time)} – ${formatTime(o.end_time)}`],
    ['Room', o.room || '—'],
    ['Term', o.academic_term?.name ?? o.academic_term?.code ?? '—'],
    ['Instructor', o.instructor ? `${o.instructor.first_name} ${o.instructor.last_name}` : '—'],
    ['Seats', `${o.enrolled_count} of ${o.capacity} filled`],
  ]

  return <section className="space-y-6">
    <PageHeader
      back={{ to: '/offerings', label: backLabel }}
      eyebrow={`${o.course?.course_code ?? 'Course'} · Section ${o.section}`}
      title={o.course?.title ?? 'Class'}
      badge={<StatusBadge status={o.status} />}
      actions={canManage && <Link className="btn-secondary" to={`/offerings/${o.id}/edit`}><Icon name="pencil" size={16} />Edit offering</Link>}
    />

    <dl className="grid gap-4 rounded-xl border border-stone-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-5">
      {details.map(([label, value]) => <div key={label}><dt className="text-sm text-stone-500">{label}</dt><dd className="mt-1 font-medium text-stone-900">{value}</dd></div>)}
    </dl>

    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-stone-900">Enrolled students</h2>
          <p className="text-sm text-stone-600">{roster.data ? `${roster.data.length} student${roster.data.length === 1 ? '' : 's'} in this class` : 'Students enrolled in this class'}</p>
        </div>
        {(roster.data?.length ?? 0) > 0 && <div className="w-full sm:w-72"><Input label="Search students" hideLabel placeholder="Search by name or number" value={search} onChange={(event) => setSearch(event.target.value)} /></div>}
      </div>

      {roster.isPending ? <LoadingState label="Loading students…" rows={5} />
        : roster.isError ? <ErrorState message={errorMessage(roster.error, 'Unable to load the students in this class.')} onRetry={() => void roster.refetch()} />
        : students.length === 0 ? <EmptyState icon="students" title={search ? 'No matching students' : 'No students enrolled yet'} description={search ? 'Try a different name or student number.' : 'Students will appear here once they are enrolled in this class.'} />
        : <div className="table-wrap"><table className="data-table">
          <thead><tr><th scope="col">#</th><th scope="col">Student number</th><th scope="col">Name</th><th scope="col">Year</th><th scope="col">Status</th></tr></thead>
          <tbody>{students.map((student, index) => <tr key={student.id}>
            <td className="cell-muted tabular-nums">{index + 1}</td>
            <td className="whitespace-nowrap tabular-nums">{student.student_number}</td>
            <td className="whitespace-nowrap font-semibold text-stone-900">{canManage ? <Link className="hover:text-brand-700 hover:underline" to={`/students/${student.id}`}>{student.last_name}, {student.first_name}</Link> : <>{student.last_name}, {student.first_name}</>}</td>
            <td>{student.year_level ? `Year ${student.year_level}` : '—'}</td>
            <td><StatusBadge status={student.status} /></td>
          </tr>)}</tbody>
        </table></div>}
    </div>
  </section>
}
