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
import { useProgramsCrud } from '../hooks/useProgramsCrud'
import { humanize } from '../utils/format'

export default function ProgramsListPage() {
  const { user } = useAuth()
  const canManage = allowed(user, 'programs', true)
  const [search, setSearch] = useState('')
  const [degree, setDegree] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [debounced, setDebounced] = useState('')
  useEffect(() => { const t = setTimeout(() => setDebounced(search.trim()), 350); return () => clearTimeout(t) }, [search])
  const query = useProgramsCrud({ search: debounced || undefined, degree_level: degree || undefined, status: status || undefined, page, per_page: 20 })
  const rows = query.data?.data ?? []
  const activeCount = (degree ? 1 : 0) + (status ? 1 : 0)
  const filtered = Boolean(debounced) || activeCount > 0

  return <section className="space-y-6">
    <PageHeader
      title="Programs"
      description="Degree programs offered by your school. Select one to see its courses."
      actions={canManage && <Link className="btn-primary" to="/programs/new"><Icon name="plus" size={17} />New program</Link>}
    />
    <FilterBar
      search={{ label: 'Search programs', value: search, placeholder: 'Search by code or name', onChange: (value) => { setSearch(value); setPage(1) } }}
      inline={<>
        <Select label="Degree level" hideLabel value={degree} onChange={(e) => { setDegree(e.target.value); setPage(1) }}><option value="">All degree levels</option><option value="certificate">Certificate</option><option value="associate">Associate</option><option value="bachelor">Bachelor</option><option value="master">Master</option><option value="doctorate">Doctorate</option></Select>
        <Select label="Status" hideLabel value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}><option value="">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option><option value="archived">Archived</option></Select>
      </>}
      activeCount={activeCount}
      onClear={() => { setSearch(''); setDegree(''); setStatus(''); setPage(1) }}
    />
    {query.isLoading ? <LoadingState label="Loading programs..." rows={5} />
      : query.isError ? <ErrorState message="Unable to load programs." onRetry={() => void query.refetch()} />
      : rows.length === 0 ? <EmptyState icon="programs" title="No programs found" description={filtered ? 'Try a different search or clear the filters.' : 'Programs you add will appear here.'} action={canManage && !filtered ? <Link className="btn-primary" to="/programs/new"><Icon name="plus" size={17} />New program</Link> : undefined} />
      : <>
        <div className="table-wrap"><table className="data-table">
          <thead><tr><th scope="col">Program</th><th scope="col">Code</th><th scope="col">Department</th><th scope="col">Degree level</th><th scope="col">Status</th>{canManage && <th scope="col" className="text-right"><span className="sr-only">Actions</span></th>}</tr></thead>
          <tbody>{rows.map((p) => <tr key={p.id}>
            <td><Link className="font-semibold text-stone-900 hover:text-brand-700 hover:underline" to={`/programs/${p.id}`}>{p.name}</Link></td>
            <td className="whitespace-nowrap"><Link className="link" to={`/programs/${p.id}`} aria-label={`View ${p.code} program details`}>{p.code}</Link></td>
            <td>{p.department ?? '—'}</td>
            <td>{humanize(p.degree_level)}</td>
            <td><StatusBadge status={p.status} /></td>
            {canManage && <td className="cell-actions"><Link className="btn-ghost btn-sm" to={`/programs/${p.id}/edit`}>Edit</Link></td>}
          </tr>)}</tbody>
        </table></div>
        <Pagination currentPage={query.data?.meta.current_page ?? 1} lastPage={query.data?.meta.last_page ?? 1} total={query.data?.meta.total} onPageChange={setPage} />
      </>}
  </section>
}
