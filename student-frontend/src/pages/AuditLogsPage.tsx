import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import client from '../api/client'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Button from '../components/ui/Button'
import FilterBar from '../components/ui/FilterBar'
import Icon from '../components/ui/Icon'
import Pagination from '../components/ui/Pagination'
import PageHeader from '../components/layout/PageHeader'
import EmptyState from '../components/feedback/EmptyState'
import ErrorState from '../components/feedback/ErrorState'
import LoadingState from '../components/feedback/LoadingState'
import { getApiErrorMessage } from '../api/errors'

type Entry = { id: number; actor_name: string | null; actor_role: string | null; actor_id: number | null; action: string; resource: string; resource_id: string | null; changes: Record<string, unknown>; created_at: string }
type LogPage = { data: Entry[]; current_page: number; last_page: number; total: number }
const actions = ['created', 'updated', 'deleted', 'login_succeeded', 'login_failed', 'logout', 'mfa_enabled', 'mfa_disabled', 'recovery_codes_regenerated']
const label = (value: string) => value.replaceAll('_', ' ')
const blankFilters = { search: '', action: '', from: '', to: '' }

const actionTone = (action: string): string => {
  if (action === 'deleted' || action === 'login_failed' || action === 'mfa_disabled') return 'bg-rose-50 text-rose-800 ring-rose-600/15'
  if (action === 'created' || action === 'login_succeeded' || action === 'mfa_enabled') return 'bg-emerald-50 text-emerald-800 ring-emerald-600/15'
  if (action === 'updated' || action === 'recovery_codes_regenerated') return 'bg-sky-50 text-sky-800 ring-sky-600/15'
  return 'bg-stone-100 text-stone-700 ring-stone-500/15'
}

export default function AuditLogsPage() {
  const [page, setPage] = useState(1)
  const [draft, setDraft] = useState(blankFilters)
  const [filters, setFilters] = useState(draft)
  const logs = useQuery({ queryKey: ['audit-logs', filters, page], queryFn: async () => (await client.get<LogPage>('/admin/audit-logs', { params: { ...filters, page } })).data })
  const activeCount = [draft.action, draft.from, draft.to].filter(Boolean).length

  return <section className="space-y-6">
    <PageHeader
      title="Audit logs"
      description={<>Read-only history of account, academic, and settings changes and sign-in activity. <span className="text-stone-600">Times use your browser’s timezone; date filters use UTC.</span></>}
      actions={<Button variant="secondary" onClick={() => void logs.refetch()} loading={logs.isFetching}>{!logs.isFetching && <Icon name="refresh" size={16} />}Refresh</Button>}
    />

    <FilterBar
      search={{ label: 'Search actor or record', value: draft.search, placeholder: 'Search by person or record', onChange: (value) => setDraft({ ...draft, search: value }) }}
      inline={<Select id="audit-action" label="Action" hideLabel value={draft.action} onChange={(e) => setDraft({ ...draft, action: e.target.value })}><option value="">All actions</option>{actions.map((action) => <option key={action} value={action}>{label(action).replace(/^./, (c) => c.toUpperCase())}</option>)}</Select>}
      advanced={<>
        <Input label="From (UTC)" type="date" value={draft.from} onChange={(e) => setDraft({ ...draft, from: e.target.value })} />
        <Input label="To (UTC)" type="date" min={draft.from || undefined} value={draft.to} onChange={(e) => setDraft({ ...draft, to: e.target.value })} />
      </>}
      activeCount={activeCount}
      onSubmit={() => { setFilters(draft); setPage(1) }}
      onClear={() => { setDraft(blankFilters); setFilters(blankFilters); setPage(1) }}
    />

    {logs.isPending && <LoadingState label="Loading audit history…" rows={6} />}
    {logs.isError && <ErrorState message={getApiErrorMessage(logs.error, 'Could not load audit history.')} onRetry={() => void logs.refetch()} />}
    {logs.data && (logs.data.data.length === 0
      ? <EmptyState icon="history" title="No events found" description="No events match these filters. History starts when audit logging was enabled." />
      : <>
        <p className="text-sm text-stone-600">{logs.data.total.toLocaleString()} {logs.data.total === 1 ? 'event' : 'events'}</p>
        <div className="table-wrap"><table className="data-table">
          <thead><tr>{['Time', 'Actor', 'Action', 'Record', 'Details'].map((heading) => <th scope="col" key={heading}>{heading}</th>)}</tr></thead>
          <tbody>{logs.data.data.map((entry) => <tr key={entry.id} className="align-top">
            <td className="whitespace-nowrap tabular-nums">{new Date(entry.created_at).toLocaleString()}</td>
            <td><p className="font-medium text-stone-900">{entry.actor_name ?? 'Unauthenticated'}</p>{entry.actor_role && <p className="cell-muted capitalize">{entry.actor_role} · #{entry.actor_id}</p>}</td>
            <td><span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-[13px] font-medium capitalize ring-1 ring-inset ${actionTone(entry.action)}`}>{label(entry.action)}</span></td>
            <td className="whitespace-nowrap">{entry.resource}{entry.resource_id && <span className="text-stone-600"> #{entry.resource_id}</span>}</td>
            <td>{Object.keys(entry.changes).length ? <details><summary className="cursor-pointer text-sm font-medium text-brand-700 hover:text-brand-800">View changes</summary><pre className="mt-2 max-w-lg overflow-auto whitespace-pre-wrap break-words rounded-lg bg-stone-50 p-3 text-xs text-stone-700 ring-1 ring-stone-200">{JSON.stringify(entry.changes, null, 2)}</pre></details> : <span className="text-stone-500">—</span>}</td>
          </tr>)}</tbody>
        </table></div>
        <Pagination currentPage={logs.data.current_page} lastPage={logs.data.last_page} onPageChange={setPage} />
      </>)}
  </section>
}
