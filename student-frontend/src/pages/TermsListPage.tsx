import { allowed } from '../utils/permissions'
import { useAuth } from '../contexts/AuthContext'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import FilterBar from '../components/ui/FilterBar'
import Icon from '../components/ui/Icon'
import StatusBadge from '../components/ui/StatusBadge'
import PageHeader from '../components/layout/PageHeader'
import EmptyState from '../components/feedback/EmptyState'
import ErrorState from '../components/feedback/ErrorState'
import LoadingState from '../components/feedback/LoadingState'
import Pagination from '../components/ui/Pagination'
import { useAcademicTerms } from '../hooks/useAcademicTerms'
import { formatDate, humanize } from '../utils/format'

export default function TermsListPage() {
  const { user } = useAuth()
  const canManage = allowed(user, 'academic-terms', true)
  const [year, setYear] = useState('')
  const [type, setType] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const query = useAcademicTerms({ academic_year: year ? Number(year) : undefined, term_type: type || undefined, status: status || undefined, page, per_page: 20 })
  const rows = query.data?.data ?? []
  const activeCount = [year, type, status].filter(Boolean).length

  return <section className="space-y-6">
    <PageHeader
      title="Academic terms"
      description="Semesters and sessions, with their dates and registration status."
      actions={canManage && <Link className="btn-primary" to="/terms/new"><Icon name="plus" size={17} />New term</Link>}
    />
    <FilterBar
      inline={<>
        <Select label="Status" hideLabel value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}><option value="">All statuses</option><option value="planned">Planned</option><option value="open">Open</option><option value="closed">Closed</option><option value="archived">Archived</option></Select>
        <Select label="Term type" hideLabel value={type} onChange={(e) => { setType(e.target.value); setPage(1) }}><option value="">All term types</option><option value="fall">Fall</option><option value="spring">Spring</option><option value="summer">Summer</option><option value="winter">Winter</option><option value="intersession">Intersession</option></Select>
      </>}
      advanced={<Input label="Academic year" type="number" placeholder="e.g. 2026" value={year} onChange={(e) => { setYear(e.target.value); setPage(1) }} />}
      activeCount={activeCount}
      onClear={() => { setYear(''); setType(''); setStatus(''); setPage(1) }}
    />
    {query.isLoading ? <LoadingState label="Loading academic terms..." rows={5} />
      : query.isError ? <ErrorState message="Unable to load academic terms." onRetry={() => void query.refetch()} />
      : rows.length === 0 ? <EmptyState icon="calendar" title="No academic terms found" description={activeCount ? 'Try clearing the filters.' : 'Terms you add will appear here.'} action={canManage && !activeCount ? <Link className="btn-primary" to="/terms/new"><Icon name="plus" size={17} />New term</Link> : undefined} />
      : <>
        <div className="table-wrap"><table className="data-table">
          <thead><tr><th scope="col">Term</th><th scope="col">Code</th><th scope="col">Year</th><th scope="col">Type</th><th scope="col">Dates</th><th scope="col">Status</th>{canManage && <th scope="col" className="text-right"><span className="sr-only">Actions</span></th>}</tr></thead>
          <tbody>{rows.map((t) => <tr key={t.id}>
            <td className="font-semibold text-stone-900">{t.name}</td>
            <td className="whitespace-nowrap">{t.code}</td>
            <td className="tabular-nums">{t.academic_year}</td>
            <td>{humanize(t.term_type)}</td>
            <td className="whitespace-nowrap">{formatDate(t.start_date)} – {formatDate(t.end_date)}</td>
            <td><StatusBadge status={t.status} /></td>
            {canManage && <td className="cell-actions"><Link className="btn-ghost btn-sm" to={`/terms/${t.id}/edit`}>Edit</Link></td>}
          </tr>)}</tbody>
        </table></div>
        <Pagination currentPage={query.data?.meta.current_page ?? 1} lastPage={query.data?.meta.last_page ?? 1} total={query.data?.meta.total} onPageChange={setPage} />
      </>}
  </section>
}
