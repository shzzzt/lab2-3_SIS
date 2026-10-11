import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ProgramForm, { type ProgramFormValues } from '../components/programs/ProgramForm'
import PageHeader from '../components/layout/PageHeader'
import LoadingState from '../components/feedback/LoadingState'
import ErrorState from '../components/feedback/ErrorState'
import { useCreateProgram, useProgram, useUpdateProgram } from '../hooks/useProgramsCrud'

export default function ProgramFormPage() {
  const id = Number(useParams<{ id: string }>().id)
  const editing = Number.isInteger(id) && id > 0
  const navigate = useNavigate()
  const detail = useProgram(editing ? id : null)
  const create = useCreateProgram()
  const update = useUpdateProgram(id)
  const defaults = useMemo(() => detail.data ? { code: detail.data.code, name: detail.data.name, department: detail.data.department ?? undefined, degree_level: detail.data.degree_level, total_credits: detail.data.total_credits ?? undefined, status: detail.data.status } : undefined, [detail.data])
  if (editing && detail.isLoading) return <LoadingState label="Loading program..." />
  if (editing && detail.isError) return <ErrorState message="Unable to load program." onRetry={() => void detail.refetch()} />
  const submit = async (data: ProgramFormValues) => { const result = editing ? await update.mutateAsync(data) : await create.mutateAsync(data); navigate(`/programs/${result.id}`) }
  const backTo = editing ? `/programs/${id}` : '/programs'
  return <section className="mx-auto max-w-4xl space-y-6">
    <PageHeader back={{ to: backTo, label: editing ? 'Back to program' : 'Back to programs' }} title={editing ? 'Edit program' : 'New program'} description={editing ? `Update the details for ${detail.data?.code ?? 'this program'}.` : 'Add a degree program your school offers.'} />
    <ProgramForm defaultValues={defaults} onSubmit={submit} submitLabel={editing ? 'Save changes' : 'Create program'} isSubmitting={create.isPending || update.isPending} cancelTo={backTo} />
  </section>
}
