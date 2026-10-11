import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import client from '../api/client'
import { getApiErrorMessage, getValidationErrors } from '../api/errors'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Icon from '../components/ui/Icon'
import StatusBadge from '../components/ui/StatusBadge'
import FilterBar from '../components/ui/FilterBar'
import PageHeader from '../components/layout/PageHeader'
import Pagination from '../components/ui/Pagination'
import EmptyState from '../components/feedback/EmptyState'
import ErrorState from '../components/feedback/ErrorState'
import LoadingState from '../components/feedback/LoadingState'
import SystemSettingsView from '../components/admin/SystemSettingsView'
import { useToast } from '../contexts/ToastContext'
import { humanize, initialsOf } from '../utils/format'

type Account = { id: number; first_name: string; last_name: string; email: string; role: string; status: string }
const blank = { first_name: '', last_name: '', email: '', password: '', role: 'student', status: 'active' }
const roles = ['admin', 'registrar', 'faculty', 'student', 'advisor']
const statuses = ['active', 'inactive', 'suspended', 'pending']

function AccountForm({ editing, initial, onClose }: { editing: number | null; initial: typeof blank; onClose: () => void }) {
  const cache = useQueryClient()
  const { showToast } = useToast()
  const [form, setForm] = useState(initial)
  const save = useMutation({
    mutationFn: async () => {
      const payload = { ...form, password: form.password || undefined }
      return editing ? client.patch(`/admin/users/${editing}`, payload) : client.post('/admin/users', payload)
    },
    onSuccess: () => { showToast(editing ? 'Account updated.' : 'Account created.', 'success'); void cache.invalidateQueries({ queryKey: ['admin-users'] }); onClose() },
  })
  const errors = getValidationErrors(save.error)
  const submit = (event: FormEvent) => { event.preventDefault(); save.mutate() }

  return <Modal
    open
    size="lg"
    title={editing ? 'Edit account' : 'Create account'}
    description={editing ? 'Update this person’s details, role or access.' : 'Give someone access to the system.'}
    onClose={onClose}
    footer={<><Button variant="secondary" onClick={onClose} disabled={save.isPending}>Cancel</Button><Button type="submit" form="account-form" loading={save.isPending}>{editing ? 'Save account' : 'Create account'}</Button></>}
  >
    <form id="account-form" onSubmit={submit} className="space-y-5">
      {save.isError && <p role="alert" className="alert-error">{getApiErrorMessage(save.error, 'Could not save account.')}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="First name" required maxLength={100} value={form.first_name} error={errors.first_name?.[0]} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
        <Input label="Last name" required maxLength={100} value={form.last_name} error={errors.last_name?.[0]} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
        <div className="sm:col-span-2"><Input label="Email" type="email" required value={form.email} error={errors.email?.[0]} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
        <div className="sm:col-span-2"><Input label={editing ? 'New password' : 'Password'} type="password" autoComplete="new-password" required={!editing} minLength={8} value={form.password} error={errors.password?.[0]} help={editing ? 'Leave blank to keep the current password.' : 'At least 8 characters.'} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
        <Select label="Role" value={form.role} error={errors.role?.[0]} onChange={(e) => setForm({ ...form, role: e.target.value })}>{roles.map((role) => <option key={role} value={role}>{humanize(role)}</option>)}</Select>
        <Select label="Account status" value={form.status} error={errors.status?.[0]} onChange={(e) => setForm({ ...form, status: e.target.value })}>{statuses.map((status) => <option key={status} value={status}>{humanize(status)}</option>)}</Select>
      </div>
      <p className="alert-info flex gap-2"><Icon name="info" size={17} className="mt-0.5" /><span>Student accounts need a linked student record created by the Registrar. Accounts linked to academic records must keep their role.</span></p>
    </form>
  </Modal>
}

export default function AdminPage({ settingsOnly = false }: { settingsOnly?: boolean }) {
  const [editing, setEditing] = useState<number | null>(null)
  const [formInitial, setFormInitial] = useState<typeof blank | null>(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const accounts = useQuery({ queryKey: ['admin-users'], queryFn: async () => (await client.get<{ data: Account[] }>('/admin/users')).data.data, enabled: !settingsOnly })

  if (settingsOnly) return <SystemSettingsView />

  const filtered = accounts.data?.filter((account) =>
    `${account.first_name} ${account.last_name} ${account.email} ${account.role}`.toLowerCase().includes(search.toLowerCase())
    && (!roleFilter || account.role === roleFilter)
    && (!statusFilter || account.status === statusFilter)) ?? []
  const PAGE_SIZE = 20
  const lastPage = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, lastPage)
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const activeCount = accounts.data?.filter((account) => account.status === 'active').length ?? 0
  const adminCount = accounts.data?.filter((account) => account.role === 'admin').length ?? 0

  const openCreate = (): void => { setEditing(null); setFormInitial(blank) }
  const openEdit = (account: Account): void => { setEditing(account.id); setFormInitial({ first_name: account.first_name, last_name: account.last_name, email: account.email, password: '', role: account.role, status: account.status }) }

  return <section className="space-y-6">
    <PageHeader
      title="User administration"
      description="Manage accounts, assign roles, and control account access. Registrars manage academic records."
      actions={<Button onClick={openCreate}><Icon name="plus" size={17} />New account</Button>}
    />

    {accounts.data && <p className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-stone-600">
      <span><strong className="font-semibold text-stone-900">{accounts.data.length}</strong> accounts</span>
      <span><strong className="font-semibold text-stone-900">{activeCount}</strong> active</span>
      <span><strong className="font-semibold text-stone-900">{adminCount}</strong> {adminCount === 1 ? 'administrator' : 'administrators'}</span>
    </p>}

    <FilterBar
      search={{ label: 'Search accounts', value: search, placeholder: 'Search by name, email or role', onChange: (value) => { setSearch(value); setPage(1) } }}
      inline={<>
        <Select label="Role" hideLabel value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1) }}><option value="">All roles</option>{roles.map((role) => <option key={role} value={role}>{humanize(role)}</option>)}</Select>
        <Select label="Status" hideLabel value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}><option value="">All statuses</option>{statuses.map((status) => <option key={status} value={status}>{humanize(status)}</option>)}</Select>
      </>}
      activeCount={(roleFilter ? 1 : 0) + (statusFilter ? 1 : 0)}
      onClear={() => { setSearch(''); setRoleFilter(''); setStatusFilter(''); setPage(1) }}
    />

    {accounts.isPending ? <LoadingState label="Loading accounts…" rows={6} />
      : accounts.isError ? <ErrorState message="Could not load accounts." onRetry={() => void accounts.refetch()} />
      : filtered.length === 0 ? <EmptyState icon="accounts" title="No accounts found" description="Try a different search or clear the filters." />
      : <div className="table-wrap"><table className="data-table">
        <thead><tr><th scope="col">Name</th><th scope="col">Email</th><th scope="col">Role</th><th scope="col">Status</th><th scope="col" className="text-right"><span className="sr-only">Actions</span></th></tr></thead>
        <tbody>{visible.map((account) => <tr key={account.id}>
          <td><div className="flex items-center gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-100 text-xs font-semibold text-stone-700" aria-hidden="true">{initialsOf(`${account.first_name} ${account.last_name}`)}</span><span className="whitespace-nowrap font-medium text-stone-900">{account.first_name} {account.last_name}</span></div></td>
          <td>{account.email}</td>
          <td>{humanize(account.role)}</td>
          <td><StatusBadge status={account.status} /></td>
          <td className="cell-actions"><Button variant="ghost" size="sm" aria-label={`Edit ${account.email}`} onClick={() => openEdit(account)}><Icon name="pencil" size={15} />Edit</Button></td>
        </tr>)}</tbody>
      </table></div>}
    {accounts.isSuccess && filtered.length > PAGE_SIZE && <Pagination currentPage={currentPage} lastPage={lastPage} total={filtered.length} onPageChange={setPage} />}

    {formInitial && <AccountForm key={editing ?? 'new'} editing={editing} initial={formInitial} onClose={() => { setFormInitial(null); setEditing(null) }} />}
  </section>
}
