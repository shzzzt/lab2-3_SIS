import { allowed } from '../utils/permissions'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  useDeleteStudent,
  useStudentsList,
} from '../hooks/useStudents'
import { usePrograms } from '../hooks/usePrograms'
import type { StudentListParams } from '../api/students'
import Button from '../components/ui/Button'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import Select from '../components/ui/Select'
import FilterBar from '../components/ui/FilterBar'
import Icon from '../components/ui/Icon'
import StatusBadge from '../components/ui/StatusBadge'
import PageHeader from '../components/layout/PageHeader'
import EmptyState from '../components/feedback/EmptyState'
import ErrorState from '../components/feedback/ErrorState'
import LoadingState from '../components/feedback/LoadingState'
import Pagination from '../components/ui/Pagination'

const studentStatuses = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'on_leave', label: 'On leave' },
  { value: 'graduated', label: 'Graduated' },
  { value: 'withdrawn', label: 'Withdrawn' },
  { value: 'dismissed', label: 'Dismissed' },
]

const sortOptions = [
  { value: 'last_name', label: 'Last name (A-Z)' },
  { value: '-last_name', label: 'Last name (Z-A)' },
  { value: 'student_number', label: 'Student number (A-Z)' },
  { value: '-student_number', label: 'Student number (Z-A)' },
]

/** Program picker for the filter panel; it only loads programs once the panel opens. */
function ProgramFilter({ value, onChange, enabled }: { value: string; onChange: (value: string) => void; enabled: boolean }) {
  const programs = usePrograms(enabled)
  return (
    <Select label="Program" value={value} onChange={(event) => onChange(event.target.value)} help={programs.isError ? 'Programs could not be loaded.' : undefined}>
      <option value="">{programs.isLoading ? 'Loading programs…' : 'All programs'}</option>
      {programs.data?.map((program) => <option key={program.id} value={program.id}>{program.code} · {program.name}</option>)}
    </Select>
  )
}

export default function StudentsListPage() {
  const { user } = useAuth()
  const canManage = user?.role === 'registrar' && allowed(user, 'students', true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [programId, setProgramId] = useState('')
  const [yearLevel, setYearLevel] = useState('')
  const [status, setStatus] = useState('')
  const [sort, setSort] = useState('last_name')
  const [page, setPage] = useState(1)
  const [studentToDelete, setStudentToDelete] = useState<number | null>(null)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search.trim())
    }, 350)

    return () => window.clearTimeout(timeoutId)
  }, [search])

  const params = useMemo<StudentListParams>(() => ({
    search: debouncedSearch || undefined,
    program_id: programId ? Number(programId) : undefined,
    year_level: yearLevel ? Number(yearLevel) : undefined,
    status: status || undefined,
    sort,
    page,
    per_page: 20,
  }), [debouncedSearch, page, programId, sort, status, yearLevel])

  const studentsQuery = useStudentsList(params)
  const deleteStudent = useDeleteStudent()
  const students = studentsQuery.data?.data.data ?? []
  const meta = studentsQuery.data?.data.meta
  const activeFilters = [programId, yearLevel, status].filter(Boolean).length + (sort !== 'last_name' ? 1 : 0)

  const handleConfirmDelete = (): void => {
    if (studentToDelete === null) {
      return
    }

    deleteStudent.mutate(studentToDelete, {
      onSuccess: () => setStudentToDelete(null),
    })
  }

  const clearFilters = (): void => {
    setSearch(''); setProgramId(''); setYearLevel(''); setStatus(''); setSort('last_name'); setPage(1)
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title="Students"
        description="Find a student, open their record, or add someone new."
        actions={canManage && (
          <Link className="btn-primary" to="/students/new">
            <Icon name="plus" size={17} />
            Add student
          </Link>
        )}
      />

      <FilterBar
        search={{ label: 'Search students', value: search, placeholder: 'Search by name or student number', onChange: (value) => { setSearch(value); setPage(1) } }}
        inline={(
          <Select label="Status" hideLabel value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }}>
            {studentStatuses.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </Select>
        )}
        advanced={<>
          <ProgramFilter value={programId} enabled={allowed(user, 'programs')} onChange={(value) => { setProgramId(value); setPage(1) }} />
          <Select label="Year level" value={yearLevel} onChange={(event) => { setYearLevel(event.target.value); setPage(1) }}>
            <option value="">Any year</option>
            {[1, 2, 3, 4, 5].map((year) => <option key={year} value={year}>Year {year}</option>)}
          </Select>
          <Select label="Sort by" value={sort} onChange={(event) => { setSort(event.target.value); setPage(1) }}>
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </Select>
        </>}
        activeCount={activeFilters}
        onClear={clearFilters}
      />

      {studentsQuery.isLoading ? (
        <LoadingState label="Loading students..." rows={6} />
      ) : studentsQuery.isError ? (
        <ErrorState message="Unable to load students." onRetry={() => void studentsQuery.refetch()} />
      ) : students.length === 0 ? (
        <EmptyState
          icon="students"
          title="No students found"
          description={debouncedSearch || activeFilters > 0 ? 'Try a different search or clear the filters.' : 'Student records you add will appear here.'}
          action={canManage && !debouncedSearch && activeFilters === 0 ? <Link className="btn-primary" to="/students/new"><Icon name="plus" size={17} />Add student</Link> : undefined}
        />
      ) : (
        <>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Student number</th>
                  <th scope="col">Program</th>
                  <th scope="col">Year</th>
                  <th scope="col">Status</th>
                  {canManage && <th scope="col" className="text-right"><span className="sr-only">Actions</span></th>}
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id}>
                    <td className="whitespace-nowrap">
                      <Link className="font-semibold text-stone-900 hover:text-brand-700 hover:underline" to={`/students/${student.id}`}>
                        {student.first_name} {student.last_name}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap tabular-nums">{student.student_number}</td>
                    <td>{student.program?.code ?? '—'}</td>
                    <td>{student.year_level}</td>
                    <td><StatusBadge status={student.status} /></td>
                    {canManage && (
                      <td className="cell-actions">
                        <div className="inline-flex items-center gap-1">
                          <Link className="btn-ghost btn-sm" to={`/students/${student.id}/edit`}>
                            Edit
                          </Link>
                          <Button variant="quiet-danger" size="sm" onClick={() => setStudentToDelete(student.id)}>
                            Deactivate
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {meta && (
            <Pagination
              currentPage={meta.current_page}
              lastPage={meta.last_page}
              total={meta.total}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      <ConfirmDialog
        open={studentToDelete !== null}
        title="Deactivate student?"
        message="This will mark the student as inactive."
        confirmLabel="Deactivate"
        onConfirm={handleConfirmDelete}
        onCancel={() => setStudentToDelete(null)}
        loading={deleteStudent.isPending}
      />
    </section>
  )
}
