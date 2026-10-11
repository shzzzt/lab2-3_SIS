import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import CourseForm, { type CourseFormValues } from '../components/courses/CourseForm'
import PageHeader from '../components/layout/PageHeader'
import LoadingState from '../components/feedback/LoadingState'
import ErrorState from '../components/feedback/ErrorState'
import { useCourse, useCreateCourse, useUpdateCourse } from '../hooks/useCourses'

export default function CourseFormPage() {
  const id = Number(useParams<{ id: string }>().id)
  const editing = Number.isInteger(id) && id > 0
  const navigate = useNavigate()
  const detail = useCourse(editing ? id : null)
  const create = useCreateCourse()
  const update = useUpdateCourse(id)
  const defaults = useMemo(() => detail.data ? { course_code: detail.data.course_code, title: detail.data.title, description: detail.data.description ?? undefined, credits: detail.data.credits, lecture_hours: detail.data.lecture_hours, lab_hours: detail.data.lab_hours, program_id: detail.data.program_id ?? undefined, status: detail.data.status } : undefined, [detail.data])
  if (editing && detail.isLoading) return <LoadingState label="Loading course..." />
  if (editing && detail.isError) return <ErrorState message="Unable to load course." onRetry={() => void detail.refetch()} />
  const submit = async (data: CourseFormValues) => { const result = editing ? await update.mutateAsync(data) : await create.mutateAsync(data); navigate(`/courses/${result.id}/edit`) }
  return <section className="mx-auto max-w-4xl space-y-6">
    <PageHeader back={{ to: '/courses', label: 'Back to courses' }} title={editing ? 'Edit course' : 'New course'} description={editing ? `Update the details for ${detail.data?.course_code ?? 'this course'}.` : 'Add a subject to the course catalog.'} />
    <CourseForm defaultValues={defaults} onSubmit={submit} submitLabel={editing ? 'Save changes' : 'Create course'} isSubmitting={create.isPending || update.isPending} cancelTo="/courses" />
  </section>
}
