import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import OfferingForm, { type OfferingFormValues } from '../components/offerings/OfferingForm'
import PageHeader from '../components/layout/PageHeader'
import LoadingState from '../components/feedback/LoadingState'
import ErrorState from '../components/feedback/ErrorState'
import { useCourseOffering, useCreateCourseOffering, useUpdateCourseOffering } from '../hooks/useCourseOfferings'

export default function OfferingFormPage() {
  const id = Number(useParams<{ id: string }>().id)
  const editing = Number.isInteger(id) && id > 0
  const navigate = useNavigate()
  const detail = useCourseOffering(editing ? id : null)
  const create = useCreateCourseOffering()
  const update = useUpdateCourseOffering(id)
  const defaults = useMemo(() => detail.data ? { course_id: detail.data.course_id, academic_term_id: detail.data.academic_term_id, instructor_id: detail.data.instructor_id ?? undefined, section: detail.data.section, room: detail.data.room ?? undefined, day_of_week: detail.data.day_of_week, start_time: detail.data.start_time.slice(0, 5), end_time: detail.data.end_time.slice(0, 5), delivery_mode: detail.data.delivery_mode, capacity: detail.data.capacity, status: detail.data.status } : undefined, [detail.data])
  if (editing && detail.isLoading) return <LoadingState label="Loading course offering..." />
  if (editing && detail.isError) return <ErrorState message="Unable to load course offering." onRetry={() => void detail.refetch()} />
  const submit = async (data: OfferingFormValues) => { const result = editing ? await update.mutateAsync(data) : await create.mutateAsync(data); navigate(`/course-offerings/${result.id}/edit`) }
  return <section className="mx-auto max-w-4xl space-y-6">
    <PageHeader back={{ to: '/offerings', label: 'Back to course offerings' }} title={editing ? 'Edit course offering' : 'New course offering'} description={editing ? 'Change the schedule, instructor or capacity for this section.' : 'Schedule a section of a course for a term.'} />
    <OfferingForm defaultValues={defaults} onSubmit={submit} submitLabel={editing ? 'Save changes' : 'Create offering'} isSubmitting={create.isPending || update.isPending} cancelTo="/offerings" />
  </section>
}
