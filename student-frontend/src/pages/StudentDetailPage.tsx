import { allowed } from '../utils/permissions'
import { useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useDeleteStudent, useStudent } from '../hooks/useStudents'
import {
  useStudentAcademicRecord,
  useStudentEnrollments,
} from '../hooks/useStudentAcademic'
import Button from '../components/ui/Button'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import Icon from '../components/ui/Icon'
import StatusBadge from '../components/ui/StatusBadge'
import Tabs from '../components/ui/Tabs'
import EmptyState from '../components/feedback/EmptyState'
import ErrorState from '../components/feedback/ErrorState'
import LoadingState from '../components/feedback/LoadingState'
import type { Enrollment } from '../types'
import { formatDate, humanize, initialsOf } from '../utils/format'

const displayValue = (value?: string | number | null): string =>
  value === null || value === undefined || value === '' ? '—' : String(value)

const enrollmentCourse = (enrollment: Enrollment) => enrollment.course_offering?.course
const enrollmentTerm = (enrollment: Enrollment) => enrollment.course_offering?.academic_term

function Detail({ label, children, wide = false }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? 'sm:col-span-2' : undefined}>
      <dt className="text-sm text-stone-600">{label}</dt>
      <dd className="mt-0.5 break-words font-medium text-stone-900">{children}</dd>
    </div>
  )
}

function EnrollmentTable({ enrollments }: { enrollments: Enrollment[] }) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th scope="col">Course</th>
            <th scope="col">Term</th>
            <th scope="col">Section</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          {enrollments.map((enrollment) => {
            const course = enrollmentCourse(enrollment)
            const term = enrollmentTerm(enrollment)

            return (
              <tr key={enrollment.id}>
                <td><span className="block font-semibold text-stone-900">{course?.course_code ?? '—'}</span><span className="cell-muted block">{course?.title ?? ''}</span></td>
                <td className="whitespace-nowrap">{term?.name ?? term?.code ?? '—'}</td>
                <td>{enrollment.course_offering?.section ?? '—'}</td>
                <td><StatusBadge status={enrollment.status} /></td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const studentId = Number(id)
  const navigate = useNavigate()
  const { user } = useAuth()
  const canManage = user?.role === 'registrar' && allowed(user, 'students', true)
  const canDeactivate = canManage
  const studentQuery = useStudent(studentId)
  const enrollmentsQuery = useStudentEnrollments(allowed(user, 'enrollments') ? studentId : null)
  const recordQuery = useStudentAcademicRecord(allowed(user, 'grades') ? studentId : null)
  const deleteStudent = useDeleteStudent()
  const [tab, setTab] = useState('overview')
  const [confirming, setConfirming] = useState(false)

  const totalUnits = useMemo(
    () => (enrollmentsQuery.data ?? []).reduce(
      (total, enrollment) => total + (enrollmentCourse(enrollment)?.credits ?? 0),
      0,
    ),
    [enrollmentsQuery.data],
  )

  if (!Number.isInteger(studentId) || studentId < 1 || studentQuery.isError) {
    return <ErrorState message="Unable to load this student." onRetry={studentQuery.isError ? () => void studentQuery.refetch() : undefined} />
  }

  if (studentQuery.isLoading || !studentQuery.data) {
    return <LoadingState label="Loading student..." />
  }

  const student = studentQuery.data
  const email = student.email ?? student.user?.email
  const fullName = `${student.first_name} ${student.middle_name ? `${student.middle_name} ` : ''}${student.last_name}`
  const isOwnRecord = user?.role === 'student'

  const handleDeactivate = (): void => {
    deleteStudent.mutate(student.id, {
      onSuccess: () => navigate('/students'),
    })
  }

  const enrollmentsPanel = !allowed(user, 'enrollments')
    ? <p className="card p-5 text-stone-600">Your role cannot view enrollments.</p>
    : enrollmentsQuery.isLoading ? <LoadingState label="Loading enrollments..." rows={4} />
      : enrollmentsQuery.isError ? <ErrorState message="Unable to load enrollments." onRetry={() => void enrollmentsQuery.refetch()} />
        : enrollmentsQuery.data?.length === 0 ? <EmptyState icon="enrollments" title="No enrollments" description="This student has no enrollment records." />
          : <EnrollmentTable enrollments={enrollmentsQuery.data ?? []} />

  const recordPanel = !allowed(user, 'grades')
    ? <p className="card p-5 text-stone-600">Your role cannot view academic records.</p>
    : recordQuery.isLoading ? <LoadingState label="Loading academic record..." rows={4} />
      : recordQuery.isError ? <ErrorState message="Unable to load the academic record." onRetry={() => void recordQuery.refetch()} />
        : recordQuery.data?.terms.length === 0 ? <EmptyState icon="file" title="No academic record" description="Grades and course history will appear here." />
          : (
            <div className="space-y-5">
              {recordQuery.data?.terms.map((term) => (
                <section key={term.academic_term.id} className="card overflow-hidden" aria-labelledby={`term-${term.academic_term.id}`}>
                  <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-stone-100 bg-stone-50/70 px-5 py-3.5">
                    <h3 id={`term-${term.academic_term.id}`} className="font-semibold text-stone-900">{term.academic_term.name}</h3>
                    <span className="text-sm text-stone-600">{term.academic_term.code} · {term.enrollments.length} {term.enrollments.length === 1 ? 'course' : 'courses'}</span>
                  </header>
                  <div className="overflow-x-auto">
                    <table className="data-table">
                      <thead><tr><th scope="col">Course</th><th scope="col">Grade</th><th scope="col">Status</th></tr></thead>
                      <tbody>
                        {term.enrollments.map((enrollment) => {
                          const course = enrollmentCourse(enrollment)
                          const gradeStatus = enrollment.grade?.status ?? enrollment.status
                          return <tr key={enrollment.id}>
                            <td><span className="block font-semibold text-stone-900">{course?.course_code ?? '—'}</span><span className="cell-muted block">{course?.title ?? ''}</span></td>
                            <td className="text-base font-semibold text-stone-900">{enrollment.grade?.letter_grade ?? enrollment.grade?.numeric_grade ?? '—'}</td>
                            <td><StatusBadge status={gradeStatus} /></td>
                          </tr>
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>
              ))}
            </div>
          )

  const overviewPanel = (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="card p-6" aria-labelledby="personal-heading">
        <h2 id="personal-heading" className="text-lg font-semibold text-stone-900">Personal information</h2>
        <dl className="mt-5 grid gap-x-6 gap-y-4 sm:grid-cols-2">
          <Detail label="Date of birth">{formatDate(student.date_of_birth)}</Detail>
          <Detail label="Gender">{student.gender ? humanize(student.gender) : '—'}</Detail>
          <Detail label="Phone">{displayValue(student.phone)}</Detail>
          <Detail label="Email">{displayValue(email)}</Detail>
          <Detail label="Address" wide>{displayValue(student.address)}</Detail>
        </dl>
      </section>

      <section className="card p-6" aria-labelledby="academic-heading">
        <h2 id="academic-heading" className="text-lg font-semibold text-stone-900">Academic information</h2>
        <dl className="mt-5 grid gap-x-6 gap-y-4 sm:grid-cols-2">
          <Detail label="Program" wide>{student.program ? [student.program.code, student.program.name].filter(Boolean).join(' · ') : '—'}</Detail>
          <Detail label="Admission date">{formatDate(student.admission_date)}</Detail>
          <Detail label="Expected graduation">{formatDate(student.expected_graduation_date)}</Detail>
          <Detail label="Cumulative GPA">{displayValue(student.cumulative_gpa)}</Detail>
          <Detail label="Total units">{totalUnits}</Detail>
        </dl>
      </section>
    </div>
  )

  return (
    <section className="space-y-6">
      <Link to={isOwnRecord ? '/dashboard' : '/students'} className="-ml-1 inline-flex items-center gap-1.5 rounded-md px-1 py-0.5 text-sm font-medium text-stone-600 transition hover:text-brand-700">
        <Icon name="arrowLeft" size={16} />
        {isOwnRecord ? 'Back to dashboard' : 'Back to students'}
      </Link>

      <header className="card flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex min-w-0 items-center gap-4">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-xl font-semibold text-brand-800" aria-hidden="true">
            {initialsOf(`${student.first_name} ${student.last_name}`)}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h1 className="text-2xl font-semibold tracking-tight text-stone-900">{fullName}</h1>
              <StatusBadge status={student.status} />
            </div>
            <p className="mt-1 flex flex-wrap gap-x-2 text-[15px] text-stone-600">
              <span className="tabular-nums">{student.student_number}</span>
              <span aria-hidden="true">·</span>
              <span>{student.program?.code ?? 'No program'}</span>
              <span aria-hidden="true">·</span>
              <span>Year {student.year_level}</span>
            </p>
          </div>
        </div>
        {(canManage || canDeactivate) && (
          <div className="flex shrink-0 gap-2">
            {canManage && <Link className="btn-secondary" to={`/students/${student.id}/edit`}><Icon name="pencil" size={16} />Edit</Link>}
            {canDeactivate && (
              <Button variant="quiet-danger" onClick={() => setConfirming(true)}>
                Deactivate
              </Button>
            )}
          </div>
        )}
      </header>

      <Tabs
        label="Student record sections"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'overview', label: 'Overview', content: overviewPanel },
          { id: 'enrollments', label: 'Enrollments', count: enrollmentsQuery.data?.length, content: enrollmentsPanel },
          { id: 'record', label: 'Academic record', count: recordQuery.data?.terms.length, content: recordPanel },
        ]}
      />

      <ConfirmDialog
        open={confirming}
        title="Deactivate student?"
        message="This will mark the student as inactive."
        confirmLabel="Deactivate"
        loading={deleteStudent.isPending}
        onCancel={() => setConfirming(false)}
        onConfirm={handleDeactivate}
      />
    </section>
  )
}
