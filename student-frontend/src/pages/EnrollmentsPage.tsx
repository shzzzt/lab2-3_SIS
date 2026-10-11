import { allowed } from '../utils/permissions'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Button from '../components/ui/Button'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import EmptyState from '../components/feedback/EmptyState'
import ErrorState from '../components/feedback/ErrorState'
import LoadingState from '../components/feedback/LoadingState'
import Input from '../components/ui/Input'
import Modal from '../components/ui/Modal'
import Pagination from '../components/ui/Pagination'
import Select from '../components/ui/Select'
import FilterBar from '../components/ui/FilterBar'
import Icon from '../components/ui/Icon'
import StatusBadge from '../components/ui/StatusBadge'
import PageHeader from '../components/layout/PageHeader'
import { useToast } from '../contexts/ToastContext'
import { getApiErrorMessage, getValidationErrors } from '../api/errors'
import { useAuth } from '../contexts/AuthContext'
import { useCourseOfferings } from '../hooks/useCourseOfferings'
import { useStudentsList } from '../hooks/useStudents'
import { useCreateEnrollment, useDeleteEnrollment, useEnrollments, useUpdateEnrollment } from '../hooks/useEnrollments'
import type { CourseOffering, Enrollment, EnrollmentStatus, GradeMode } from '../types'
import { formatDate, humanize } from '../utils/format'

const statuses: EnrollmentStatus[] = ['enrolled', 'waitlisted', 'dropped', 'withdrawn', 'completed']
const gradeModes: GradeMode[] = ['graded', 'pass_fail', 'audit']

const enrollmentSchema = z.object({
  student_id: z.coerce.number().int().positive('Choose a student.'),
  course_offering_id: z.coerce.number().int().positive('Choose a course offering.'),
  enrolled_on: z.string().min(1, 'Enrollment date is required.'),
  status: z.enum(statuses),
  grade_mode: z.enum(gradeModes),
})
type EnrollmentValues = z.infer<typeof enrollmentSchema>

const offeringLabel = (offering: CourseOffering): string =>
  `${offering.course?.course_code ?? `Offering #${offering.id}`} · Section ${offering.section}`

function EnrollmentForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth()
  const create = useCreateEnrollment()
  const { showToast } = useToast()
  const students = useStudentsList({ per_page: 100, sort: 'last_name' }, open && allowed(user, 'students'))
  const offerings = useCourseOfferings({ per_page: 100 }, allowed(user, 'course-offerings'))
  const [formError, setFormError] = useState<string | null>(null)
  const { register, handleSubmit, reset, setError, formState: { errors } } = useForm<z.input<typeof enrollmentSchema>, unknown, EnrollmentValues>({
    resolver: zodResolver(enrollmentSchema),
    defaultValues: { enrolled_on: new Date().toLocaleDateString('en-CA'), status: 'enrolled', grade_mode: 'graded' },
  })

  const close = (): void => {
    reset({ enrolled_on: new Date().toLocaleDateString('en-CA'), status: 'enrolled', grade_mode: 'graded' })
    setFormError(null)
    onClose()
  }

  const submit = (values: EnrollmentValues): void => {
    setFormError(null)
    create.mutate(values, {
      onSuccess: () => { showToast('Enrollment created.', 'success'); close() },
      onError: (error: unknown) => {
        const validation = getValidationErrors(error)
        Object.entries(validation).forEach(([field, messages]) => {
          if (field in values) setError(field as keyof EnrollmentValues, { message: messages[0] })
        })
        setFormError(getApiErrorMessage(error, 'Could not create the enrollment.'))
      },
    })
  }

  return <Modal
    open={open}
    title="Enroll a student"
    description="Register a student in a scheduled course offering."
    onClose={close}
    footer={<><Button variant="secondary" onClick={close} disabled={create.isPending}>Cancel</Button><Button type="submit" form="enrollment-create-form" loading={create.isPending}>Create enrollment</Button></>}
  >
    {formError && <p className="alert-error mb-4" role="alert">{formError}</p>}
    {students.isError || offerings.isError ? <ErrorState message="Could not load student or offering choices." onRetry={() => { void students.refetch(); void offerings.refetch() }} /> : <form id="enrollment-create-form" className="space-y-4" onSubmit={handleSubmit(submit)}>
      <Select label="Student" required error={errors.student_id?.message} {...register('student_id')}>
        <option value="">{students.isLoading ? 'Loading students…' : 'Select a student'}</option>
        {students.data?.data.data.map((student) => <option key={student.id} value={student.id}>{student.last_name}, {student.first_name} · {student.student_number}</option>)}
      </Select>
      <Select label="Course offering" required error={errors.course_offering_id?.message} {...register('course_offering_id')}>
        <option value="">{offerings.isLoading ? 'Loading offerings…' : 'Select an offering'}</option>
        {offerings.data?.data.map((offering) => <option key={offering.id} value={offering.id}>{offeringLabel(offering)} · {offering.academic_term?.name ?? offering.academic_term?.code ?? 'Term'}</option>)}
      </Select>
      <div className="grid gap-4 sm:grid-cols-3">
        <Input label="Enrollment date" type="date" required error={errors.enrolled_on?.message} {...register('enrolled_on')} />
        <Select label="Status" required error={errors.status?.message} {...register('status')}>{statuses.map((status) => <option key={status} value={status}>{humanize(status)}</option>)}</Select>
        <Select label="Grade mode" required error={errors.grade_mode?.message} {...register('grade_mode')}>{gradeModes.map((mode) => <option key={mode} value={mode}>{humanize(mode)}</option>)}</Select>
      </div>
      {students.data?.data.data.length === 0 && <p className="alert-warning">Create a student record before enrolling.</p>}
      {offerings.data?.data.length === 0 && <p className="alert-warning">Create a course offering before enrolling.</p>}
    </form>}
  </Modal>
}

export default function EnrollmentsPage() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const canManage = user?.role === 'registrar' && allowed(user, 'enrollments', true)
  const isTeacher = user?.role === 'faculty' || user?.role === 'instructor'
  const [studentId, setStudentId] = useState('')
  const [offeringId, setOfferingId] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<Enrollment | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const query = useEnrollments({ student_id: studentId ? Number(studentId) : undefined, course_offering_id: offeringId ? Number(offeringId) : undefined, status: (status || undefined) as EnrollmentStatus | undefined, page, per_page: 20 })
  const students = useStudentsList({ per_page: 100 }, canManage)
  const offerings = useCourseOfferings({ per_page: 100 }, allowed(user, 'course-offerings'))
  const update = useUpdateEnrollment()
  const remove = useDeleteEnrollment()
  const rows = query.data?.data ?? []
  const activeCount = [studentId, offeringId, status].filter(Boolean).length

  const setFilter = (setter: (value: string) => void, value: string): void => { setter(value); setPage(1) }

  const updateStatus = (enrollment: Enrollment, nextStatus: EnrollmentStatus): void => {
    setFeedback(null)
    update.mutate({ id: enrollment.id, data: { status: nextStatus } }, {
      onSuccess: () => showToast('Enrollment status updated.', 'success'),
      onError: (error: unknown) => setFeedback(getApiErrorMessage(error, 'Could not update the enrollment.')),
    })
  }

  const deleteEnrollment = (): void => {
    if (!deleting) return
    remove.mutate(deleting.id, {
      onSuccess: () => { showToast('Enrollment deleted.', 'success'); setDeleting(null) },
      onError: (error: unknown) => { setFeedback(getApiErrorMessage(error, 'Could not delete the enrollment.')); setDeleting(null) },
    })
  }

  const statusFilter = <Select label="Status" hideLabel value={status} onChange={(event) => setFilter(setStatus, event.target.value)}><option value="">All statuses</option>{statuses.map((item) => <option key={item} value={item}>{humanize(item)}</option>)}</Select>
  const offeringFilter = (hideLabel: boolean) => <Select label="Course offering" hideLabel={hideLabel} value={offeringId} onChange={(event) => setFilter(setOfferingId, event.target.value)}><option value="">All course offerings</option>{offerings.data?.data.map((offering) => <option key={offering.id} value={offering.id}>{offeringLabel(offering)}</option>)}</Select>

  return <section className="space-y-6">
    <PageHeader
      title={canManage ? 'Enrollments' : isTeacher ? 'Class enrollments' : 'My enrollments'}
      description={canManage ? 'Who is registered in which class. Change a status right from the list.' : isTeacher ? 'Students registered in the sections you teach.' : 'The classes you are registered in.'}
      actions={canManage && <Button onClick={() => setCreating(true)}><Icon name="plus" size={17} />Enroll a student</Button>}
    />
    {feedback && <div className="alert-error" role="alert">{feedback}</div>}
    <FilterBar
      inline={canManage ? <>
        <Select label="Student" hideLabel value={studentId} onChange={(event) => setFilter(setStudentId, event.target.value)}><option value="">All students</option>{students.data?.data.data.map((student) => <option key={student.id} value={student.id}>{student.last_name}, {student.first_name} · {student.student_number}</option>)}</Select>
        {statusFilter}
      </> : <>{offeringFilter(true)}{statusFilter}</>}
      advanced={canManage ? offeringFilter(false) : undefined}
      activeCount={activeCount}
      onClear={() => { setStudentId(''); setOfferingId(''); setStatus(''); setPage(1) }}
    />
    {query.isLoading ? <LoadingState label="Loading enrollments..." rows={6} />
      : query.isError ? <ErrorState message={getApiErrorMessage(query.error, 'Unable to load enrollments.')} onRetry={() => void query.refetch()} />
      : rows.length === 0 ? <EmptyState icon="enrollments" title="No enrollments found" description={activeCount ? 'Try clearing the filters.' : canManage ? 'Enroll a student in a course offering to get started.' : 'Nothing to show yet.'} action={canManage && !activeCount ? <Button onClick={() => setCreating(true)}><Icon name="plus" size={17} />Enroll a student</Button> : undefined} />
      : <>
        <div className="table-wrap"><table className="data-table min-w-[860px]">
          <thead><tr>{['Student', 'Course', 'Term', 'Enrolled on', 'Grade mode', 'Status'].map((heading) => <th scope="col" key={heading}>{heading}</th>)}{canManage && <th scope="col" className="text-right"><span className="sr-only">Actions</span></th>}</tr></thead>
          <tbody>{rows.map((enrollment) => {
            const student = enrollment.student
            const offering = enrollment.course_offering
            return <tr key={enrollment.id}>
              <td><span className="block whitespace-nowrap font-semibold text-stone-900">{student ? `${student.first_name} ${student.last_name}` : 'Student'}</span><span className="cell-muted block">{student?.student_number ?? `#${enrollment.student_id}`}</span></td>
              <td><span className="block font-medium text-stone-900">{offering?.course?.course_code ?? '—'}{offering?.section && <span className="font-normal text-stone-600"> · Section {offering.section}</span>}</span><span className="cell-muted block">{offering?.course?.title ?? ''}</span></td>
              <td className="whitespace-nowrap">{offering?.academic_term?.name ?? offering?.academic_term?.code ?? '—'}</td>
              <td className="whitespace-nowrap">{formatDate(enrollment.enrolled_on)}</td>
              <td>{humanize(enrollment.grade_mode)}</td>
              <td>{canManage
                ? <Select aria-label={`Status for enrollment ${enrollment.id}`} className="min-h-9 min-w-36 py-1.5 text-sm" value={enrollment.status} disabled={update.isPending} onChange={(event) => updateStatus(enrollment, event.target.value as EnrollmentStatus)}>{statuses.map((item) => <option key={item} value={item}>{humanize(item)}</option>)}</Select>
                : <StatusBadge status={enrollment.status} />}</td>
              {canManage && <td className="cell-actions"><Button variant="quiet-danger" size="sm" onClick={() => setDeleting(enrollment)}>Delete</Button></td>}
            </tr>
          })}</tbody>
        </table></div>
        <Pagination currentPage={query.data?.meta.current_page ?? 1} lastPage={query.data?.meta.last_page ?? 1} total={query.data?.meta.total} onPageChange={setPage} />
      </>}
    <EnrollmentForm open={creating} onClose={() => setCreating(false)} />
    <ConfirmDialog open={deleting !== null} title="Delete enrollment?" message="This removes the enrollment record and updates the course offering count. This action cannot be undone." confirmLabel="Delete enrollment" loading={remove.isPending} onCancel={() => setDeleting(null)} onConfirm={deleteEnrollment} />
  </section>
}
