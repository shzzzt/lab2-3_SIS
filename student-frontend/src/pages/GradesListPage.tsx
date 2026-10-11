import { allowed } from '../utils/permissions'
import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Pagination from '../components/ui/Pagination'
import FilterBar from '../components/ui/FilterBar'
import Icon from '../components/ui/Icon'
import StatusBadge from '../components/ui/StatusBadge'
import PageHeader from '../components/layout/PageHeader'
import LoadingState from '../components/feedback/LoadingState'
import EmptyState from '../components/feedback/EmptyState'
import ErrorState from '../components/feedback/ErrorState'
import { useAuth } from '../contexts/AuthContext'
import { useGrades, useUpdateGrade } from '../hooks/useGrades'
import { useStudentsList } from '../hooks/useStudents'
import type { Grade } from '../types'
import { z } from 'zod'
import GradeCreateModal from '../components/grades/GradeCreateModal'
import { humanize } from '../utils/format'

const editGradeSchema = z.object({
  letter_grade: z.string().nullable(),
  numeric_grade: z.coerce.number().min(0).max(100),
  grade_points: z.coerce.number().min(0).max(4),
  remarks: z.string().optional(),
  status: z.enum(['pending', 'submitted', 'approved', 'disputed', 'revised']),
})
type EditGradeValues = z.output<typeof editGradeSchema>

const statusOptions = ['pending', 'submitted', 'approved', 'disputed', 'revised'] as const
const letterOptions = ['', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F']

function GradeEditModal({ grade, open, canEdit, onClose }: { grade: Grade | null; open: boolean; canEdit: boolean; onClose: () => void }) {
  const updateGrade = useUpdateGrade()
  const [serverMessage, setServerMessage] = useState<string | null>(null)
  const { register, handleSubmit, reset, formState: { errors } } = useForm<z.input<typeof editGradeSchema>, unknown, EditGradeValues>({ resolver: zodResolver(editGradeSchema) })

  useEffect(() => {
    if (grade) {
      reset({ letter_grade: grade.letter_grade ?? '', numeric_grade: Number(grade.numeric_grade ?? 0), grade_points: Number(grade.grade_points ?? 0), remarks: grade.remarks ?? '', status: grade.status })
    }
  }, [grade, reset])

  if (!grade || !canEdit) return null

  const submit = (data: EditGradeValues): void => {
    setServerMessage(null)
    updateGrade.mutate({ id: grade.id, data }, { onSuccess: onClose, onError: (error: unknown) => {
      if (axios.isAxiosError<{ message?: string }>(error) && error.response?.status === 403) setServerMessage('You cannot modify this grade.')
      else setServerMessage('Unable to update this grade.')
    } })
  }

  const student = grade.enrollment?.student
  const course = grade.enrollment?.course_offering?.course

  return <Modal
    open={open}
    title="Edit grade"
    description={[student ? `${student.first_name} ${student.last_name}` : null, course?.course_code].filter(Boolean).join(' · ') || undefined}
    onClose={onClose}
    footer={<><Button variant="secondary" onClick={onClose} disabled={updateGrade.isPending}>Cancel</Button><Button type="submit" form="grade-edit-form" loading={updateGrade.isPending}>Save changes</Button></>}
  >
    <form id="grade-edit-form" className="space-y-4" onSubmit={handleSubmit(submit)}>
      {serverMessage && <div className="alert-error" role="alert">{serverMessage}</div>}
      <div className="grid gap-4 sm:grid-cols-3">
        <Select label="Letter grade" error={errors.letter_grade?.message} {...register('letter_grade')}><option value="">None</option>{letterOptions.slice(1).map((letter) => <option key={letter} value={letter}>{letter}</option>)}</Select>
        <Input label="Numeric grade" type="number" min={0} max={100} step="0.01" required error={errors.numeric_grade?.message} {...register('numeric_grade')} />
        <Input label="Grade points" type="number" min={0} max={4} step="0.01" required error={errors.grade_points?.message} {...register('grade_points')} />
      </div>
      <Select label="Status" required error={errors.status?.message} {...register('status')}>{statusOptions.map((status) => <option key={status} value={status}>{humanize(status)}</option>)}</Select>
      <div className="space-y-1.5">
        <label className="label" htmlFor="grade-remarks">Remarks</label>
        <textarea id="grade-remarks" className="input" placeholder="Optional note for the student record" {...register('remarks')} />
        {errors.remarks?.message && <p className="error-text">{errors.remarks.message}</p>}
      </div>
    </form>
  </Modal>
}

export default function GradesListPage() {
  const { user } = useAuth()
  const isRegistrar = user?.role === 'registrar'
  const isStudent = user?.role === 'student'
  const isTeacher = user?.role === 'faculty' || user?.role === 'instructor'
  const [studentId, setStudentId] = useState('')
  const [offeringId, setOfferingId] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null)
  const [creating, setCreating] = useState(false)
  const query = useGrades({ student_id: studentId ? Number(studentId) : undefined, enrollment_id: offeringId ? Number(offeringId) : undefined, status: status || undefined, page, per_page: 20 })
  const students = useStudentsList({ per_page: 100, sort: 'last_name' }, isRegistrar && allowed(user, 'students'))
  const grades = query.data?.data ?? []
  const canCreate = (user?.role === 'faculty' || user?.role === 'instructor') && allowed(user, 'grades', true)
  const canEdit = (grade: Grade): boolean => allowed(user, 'grades', true) && ((user?.role === 'faculty' || user?.role === 'instructor') && grade.enrollment?.course_offering?.instructor_id === user.id)
  const anyEditable = grades.some(canEdit)
  const activeCount = [studentId, offeringId, status].filter(Boolean).length

  const statusFilter = <Select label="Status" hideLabel value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}><option value="">All statuses</option>{statusOptions.map((item) => <option key={item} value={item}>{humanize(item)}</option>)}</Select>
  const studentFilter = isRegistrar && students.data
    ? <Select label="Student" hideLabel value={studentId} onChange={(e) => { setStudentId(e.target.value); setPage(1) }}><option value="">All students</option>{students.data.data.data.map((student) => <option key={student.id} value={student.id}>{student.last_name}, {student.first_name} · {student.student_number}</option>)}</Select>
    : null

  return <section className="space-y-6">
    <PageHeader
      title={isStudent ? 'My grades' : 'Grades'}
      description={isStudent ? 'Grades you have received, course by course.' : isTeacher ? 'Grades for students in the classes you teach.' : 'Grades submitted for every class. Faculty record and update them.'}
      actions={canCreate && <Button onClick={() => setCreating(true)}><Icon name="plus" size={17} />Record grade</Button>}
    />
    <FilterBar
      inline={<>{studentFilter}{statusFilter}</>}
      advanced={isStudent ? undefined : <>
        {!studentFilter && <Input label="Student ID" type="number" min={1} value={studentId} help="The student's record number." onChange={(e) => { setStudentId(e.target.value); setPage(1) }} />}
        <Input label="Enrollment ID" type="number" min={1} value={offeringId} help="Shown in the enrollment record." onChange={(e) => { setOfferingId(e.target.value); setPage(1) }} />
      </>}
      activeCount={activeCount}
      onClear={() => { setStudentId(''); setOfferingId(''); setStatus(''); setPage(1) }}
    />
    {query.isLoading ? <LoadingState label="Loading grades..." rows={6} />
      : query.isError ? <ErrorState message="Unable to load grades." onRetry={() => void query.refetch()} />
      : grades.length === 0 ? <EmptyState icon="grades" title="No grades found" description={activeCount ? 'Try clearing the filters.' : isStudent ? 'Grades will appear here once your instructors submit them.' : 'Grades will appear here once they are recorded.'} action={canCreate && !activeCount ? <Button onClick={() => setCreating(true)}><Icon name="plus" size={17} />Record grade</Button> : undefined} />
      : <>
        <div className="table-wrap"><table className="data-table">
          <thead><tr>
            {!isStudent && <th scope="col">Student</th>}
            <th scope="col">Course</th><th scope="col">Term</th><th scope="col">Grade</th><th scope="col">Status</th>
            {anyEditable && <th scope="col" className="text-right"><span className="sr-only">Actions</span></th>}
          </tr></thead>
          <tbody>{grades.map((grade) => {
            const enrollment = grade.enrollment
            const offering = enrollment?.course_offering
            const course = offering?.course
            const term = offering?.academic_term
            return <tr key={grade.id}>
              {!isStudent && <td><span className="block whitespace-nowrap font-semibold text-stone-900">{enrollment?.student ? `${enrollment.student.first_name} ${enrollment.student.last_name}` : '—'}</span><span className="cell-muted block">{enrollment?.student?.student_number ?? ''}</span></td>}
              <td className="min-w-48"><span className="block font-medium text-stone-900">{course?.course_code ?? '—'}{offering?.section && <span className="font-normal text-stone-600"> · Section {offering.section}</span>}</span><span className="cell-muted block">{course?.title ?? ''}</span></td>
              <td className="whitespace-nowrap">{term?.name ?? term?.code ?? '—'}</td>
              <td className="whitespace-nowrap"><span className="text-base font-semibold text-stone-900">{grade.letter_grade ?? '—'}</span>{grade.numeric_grade != null && <span className="cell-muted ml-2">{grade.numeric_grade}</span>}</td>
              <td><StatusBadge status={grade.status} /></td>
              {anyEditable && <td className="cell-actions">{canEdit(grade) && <Button variant="ghost" size="sm" onClick={() => setSelectedGrade(grade)}><Icon name="pencil" size={15} />Edit</Button>}</td>}
            </tr>
          })}</tbody>
        </table></div>
        <Pagination currentPage={query.data?.meta.current_page ?? 1} lastPage={query.data?.meta.last_page ?? 1} total={query.data?.meta.total} onPageChange={setPage} />
      </>}
    <GradeEditModal key={selectedGrade?.id ?? 'none'} grade={selectedGrade} open={selectedGrade !== null} canEdit={selectedGrade !== null && canEdit(selectedGrade)} onClose={() => setSelectedGrade(null)} />
    <GradeCreateModal open={creating} onClose={() => setCreating(false)} />
  </section>
}
