import { allowed } from '../utils/permissions'
import { useAuth } from '../contexts/AuthContext'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Select from '../components/ui/Select'
import FilterBar from '../components/ui/FilterBar'
import Icon from '../components/ui/Icon'
import StatusBadge from '../components/ui/StatusBadge'
import PageHeader from '../components/layout/PageHeader'
import EmptyState from '../components/feedback/EmptyState'
import ErrorState from '../components/feedback/ErrorState'
import LoadingState from '../components/feedback/LoadingState'
import Pagination from '../components/ui/Pagination'
import { useCourses } from '../hooks/useCourses'
import { usePrograms } from '../hooks/usePrograms'

export default function CoursesListPage() {
  const { user } = useAuth()
  const canManage = allowed(user, 'courses', true)
  const [search, setSearch] = useState('')
  const [program, setProgram] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [debounced, setDebounced] = useState('')
  useEffect(() => { const t = setTimeout(() => setDebounced(search.trim()), 350); return () => clearTimeout(t) }, [search])
  const query = useCourses({ search: debounced || undefined, program_id: program ? Number(program) : undefined, status: status || undefined, page, per_page: 20 })
  const programs = usePrograms(allowed(user, 'programs'))
  const rows = query.data?.data ?? []
  const activeCount = (program ? 1 : 0) + (status ? 1 : 0)
  const filtered = Boolean(debounced) || activeCount > 0

  return <section className="space-y-6">
    <PageHeader
      title="Courses"
      description="The course catalog: subjects, credits and the program each belongs to."
      actions={canManage && <Link className="btn-primary" to="/courses/new"><Icon name="plus" size={17} />New course</Link>}
    />
    <FilterBar
      search={{ label: 'Search courses', value: search, placeholder: 'Search by code or title', onChange: (value) => { setSearch(value); setPage(1) } }}
      inline={<>
        <Select label="Program" hideLabel value={program} onChange={(e) => { setProgram(e.target.value); setPage(1) }}><option value="">All programs</option>{programs.data?.map((p) => <option key={p.id} value={p.id}>{p.code}</option>)}</Select>
        <Select label="Status" hideLabel value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}><option value="">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option><option value="archived">Archived</option></Select>
      </>}
      activeCount={activeCount}
      onClear={() => { setSearch(''); setProgram(''); setStatus(''); setPage(1) }}
    />
    {query.isLoading ? <LoadingState label="Loading courses..." rows={6} />
      : query.isError ? <ErrorState message="Unable to load courses." onRetry={() => void query.refetch()} />
      : rows.length === 0 ? <EmptyState icon="courses" title="No courses found" description={filtered ? 'Try a different search or clear the filters.' : 'Courses you add will appear here.'} action={canManage && !filtered ? <Link className="btn-primary" to="/courses/new"><Icon name="plus" size={17} />New course</Link> : undefined} />
      : <>
        <div className="table-wrap"><table className="data-table">
          <thead><tr><th scope="col">Course</th><th scope="col">Code</th><th scope="col">Credits</th><th scope="col">Program</th><th scope="col">Status</th>{canManage && <th scope="col" className="text-right"><span className="sr-only">Actions</span></th>}</tr></thead>
          <tbody>{rows.map((c) => <tr key={c.id}>
            <td className="font-semibold text-stone-900">{c.title}</td>
            <td className="whitespace-nowrap">{c.course_code}</td>
            <td className="tabular-nums">{c.credits}</td>
            <td>{c.program?.code ?? '—'}</td>
            <td><StatusBadge status={c.status} /></td>
            {canManage && <td className="cell-actions"><Link className="btn-ghost btn-sm" to={`/courses/${c.id}/edit`}>Edit</Link></td>}
          </tr>)}</tbody>
        </table></div>
        <Pagination currentPage={query.data?.meta.current_page ?? 1} lastPage={query.data?.meta.last_page ?? 1} total={query.data?.meta.total} onPageChange={setPage} />
      </>}
  </section>
}
