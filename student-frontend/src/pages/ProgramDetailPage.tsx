import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import { allowed } from '../utils/permissions'
import { useProgram } from '../hooks/useProgramsCrud'
import { useCourses } from '../hooks/useCourses'
import LoadingState from '../components/feedback/LoadingState'
import ErrorState from '../components/feedback/ErrorState'
import EmptyState from '../components/feedback/EmptyState'
import Pagination from '../components/ui/Pagination'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Button from '../components/ui/Button'
import Icon from '../components/ui/Icon'
import StatusBadge from '../components/ui/StatusBadge'
import PageHeader from '../components/layout/PageHeader'
import { humanize } from '../utils/format'

function ProgramDetails({ id }: { id: number }) {
  const { user } = useAuth()
  const program = useProgram(id)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [draft, setDraft] = useState('')
  const [status, setStatus] = useState('')
  const canReadCourses = allowed(user, 'courses')
  const courses = useCourses({ program_id: id, page, per_page: 20, search: search || undefined, status: status || undefined }, program.isSuccess && canReadCourses)

  if (program.isPending) return <LoadingState label="Loading program details…" />
  if (program.isError) return <div className="space-y-4"><Link className="-ml-1 inline-flex items-center gap-1.5 rounded-md px-1 py-0.5 text-sm font-medium text-stone-600 hover:text-brand-700" to="/programs"><Icon name="arrowLeft" size={16} />Back to programs</Link><ErrorState message={axios.isAxiosError(program.error) && program.error.response?.status === 404 ? 'Program not found.' : 'Unable to load program details.'} onRetry={() => void program.refetch()} /></div>

  const details = program.data
  const filtered = Boolean(search || status)
  return <section className="space-y-6">
    <PageHeader
      back={{ to: '/programs', label: 'Back to programs' }}
      eyebrow={details.code}
      title={details.name}
      badge={<StatusBadge status={details.status} />}
      description="Program information and its assigned courses."
      actions={allowed(user, 'programs', true) && <Link className="btn-secondary" to={`/programs/${id}/edit`}><Icon name="pencil" size={16} />Edit program</Link>}
    />
    <dl className="card grid gap-5 p-5 sm:grid-cols-3 sm:p-6">
      <div><dt className="text-sm text-stone-600">Department</dt><dd className="mt-0.5 font-medium text-stone-900">{details.department || 'Not specified'}</dd></div>
      <div><dt className="text-sm text-stone-600">Degree level</dt><dd className="mt-0.5 font-medium text-stone-900">{humanize(details.degree_level)}</dd></div>
      <div><dt className="text-sm text-stone-600">Required credits</dt><dd className="mt-0.5 font-medium text-stone-900">{details.total_credits ?? 'Not specified'}</dd></div>
    </dl>
    <section aria-labelledby="program-courses-heading" className="space-y-4">
      <header><h2 id="program-courses-heading" className="text-lg font-semibold text-stone-900">Courses in {details.code}</h2><p className="mt-0.5 text-sm text-stone-600">Only courses assigned to this program are shown.</p></header>
      {!canReadCourses ? <p className="card p-5 text-stone-600">Your account does not have permission to view courses.</p> : <>
        <form className="card flex flex-col gap-3 p-3 sm:flex-row sm:items-end sm:p-4" role="search" onSubmit={(event) => { event.preventDefault(); setSearch(draft.trim()); setPage(1) }}>
          <div className="min-w-0 flex-1"><Input label="Search program courses" hideLabel placeholder="Search by course code or title" value={draft} onChange={(event) => setDraft(event.target.value)} /></div>
          <div className="sm:w-48"><Select label="Course status" hideLabel value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }}><option value="">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option><option value="archived">Archived</option></Select></div>
          <Button type="submit"><Icon name="search" size={16} />Search</Button>
          {filtered && <Button type="button" variant="ghost" onClick={() => { setSearch(''); setDraft(''); setStatus(''); setPage(1) }}>Clear filters</Button>}
        </form>
        {courses.isPending ? <LoadingState label="Loading program courses…" rows={4} /> : courses.isError ? <ErrorState message="Unable to load this program’s courses." onRetry={() => void courses.refetch()} /> : courses.data.data.length === 0 ? <EmptyState icon="courses" title={filtered ? 'No matching courses' : 'No courses assigned yet'} description={filtered ? 'Try another search or clear the filters for this program.' : `Courses linked to ${details.code} will appear here.`} /> : <>
          <p className="text-sm text-stone-600">{courses.data.meta.total} {filtered ? 'matching ' : ''}{courses.data.meta.total === 1 ? 'course' : 'courses'}</p>
          <div className="table-wrap"><table className="data-table"><thead><tr>{['Code', 'Course', 'Credits', 'Lecture hours', 'Lab hours', 'Status'].map((heading) => <th scope="col" key={heading}>{heading}</th>)}</tr></thead><tbody>{courses.data.data.map((course) => <tr key={course.id}>
            <td className="whitespace-nowrap font-semibold text-stone-900">{course.course_code}</td>
            <td className="min-w-52"><p className="font-medium text-stone-900">{course.title}</p>{course.description && <details className="mt-1 text-stone-600"><summary className="cursor-pointer text-[13px] text-brand-700">Course description</summary><p className="mt-2 max-w-xl whitespace-pre-wrap text-sm">{course.description}</p></details>}</td>
            <td className="tabular-nums">{course.credits}</td><td className="tabular-nums">{course.lecture_hours}</td><td className="tabular-nums">{course.lab_hours}</td><td><StatusBadge status={course.status} /></td>
          </tr>)}</tbody></table></div>
          <Pagination currentPage={courses.data.meta.current_page} lastPage={courses.data.meta.last_page} onPageChange={setPage} />
        </>}
      </>}
    </section>
  </section>
}

export default function ProgramDetailPage() {
  const id = Number(useParams<{ id: string }>().id)
  if (!Number.isSafeInteger(id) || id < 1) return <div className="space-y-4"><Link to="/programs" className="-ml-1 inline-flex items-center gap-1.5 rounded-md px-1 py-0.5 text-sm font-medium text-stone-600 hover:text-brand-700"><Icon name="arrowLeft" size={16} />Back to programs</Link><ErrorState message="Program not found." /></div>
  return <ProgramDetails key={id} id={id} />
}
