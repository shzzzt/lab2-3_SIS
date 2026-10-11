import { useNavigate } from 'react-router-dom'
import StudentForm, { type StudentFormValues } from '../components/students/StudentForm'
import PageHeader from '../components/layout/PageHeader'
import { useCreateStudent } from '../hooks/useStudents'
import type { StudentWriteData } from '../api/students'

export default function StudentCreatePage() {
  const navigate = useNavigate()
  const createStudent = useCreateStudent()

  const handleSubmit = async (data: StudentFormValues): Promise<void> => {
    const student = await createStudent.mutateAsync(data as StudentWriteData)

    navigate(`/students/${student.id}`, {
      replace: true,
      state: { toast: 'Student created successfully.' },
    })
  }

  return (
    <section className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        back={{ to: '/students', label: 'Back to students' }}
        title="Add a student"
        description="Create a student information record. You can add contact details now or later."
      />
      <StudentForm
        onSubmit={handleSubmit}
        submitLabel="Create student"
        isSubmitting={createStudent.isPending}
        cancelTo="/students"
      />
    </section>
  )
}
