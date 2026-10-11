import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import { useEffect } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import type { StudentStatus } from '../../types'
import { studentSchema, type StudentFormErrors, type StudentFormInput, type StudentFormValues } from './studentSchema'
export type { StudentFormErrors, StudentFormInput, StudentFormValues } from './studentSchema'
import { FormActions, FormSection } from '../ui/FormSection'
import Input from '../ui/Input'
import Select from '../ui/Select'
import ErrorState from '../feedback/ErrorState'
import LoadingState from '../feedback/LoadingState'
import { usePrograms } from '../../hooks/usePrograms'

type StudentFormProps = {
  defaultValues?: Partial<StudentFormInput>
  onSubmit: (data: StudentFormValues) => Promise<void>
  submitLabel: string
  isSubmitting: boolean
  serverErrors?: StudentFormErrors
  cancelTo?: string
}

const statuses: Array<{ value: StudentStatus; label: string }> = [
  { value: 'active', label: 'Active' },
  { value: 'on_leave', label: 'On leave' },
  { value: 'graduated', label: 'Graduated' },
  { value: 'withdrawn', label: 'Withdrawn' },
]

export default function StudentForm({
  defaultValues,
  onSubmit,
  submitLabel,
  isSubmitting,
  serverErrors,
  cancelTo,
}: StudentFormProps) {
  const programsQuery = usePrograms()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<StudentFormInput, unknown, StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues,
  })

  useEffect(() => {
    if (!serverErrors) {
      return
    }

    Object.entries(serverErrors).forEach(([field, messages]) => {
      setError(field as keyof StudentFormValues, {
        type: 'server',
        message: messages[0],
      })
    })
  }, [serverErrors, setError])

  const submit: SubmitHandler<StudentFormValues> = async (data) => {
    try {
      await onSubmit(data)
    } catch (error: unknown) {
      if (axios.isAxiosError<{ errors?: StudentFormErrors; message?: string }>(error)) {
        const responseData = error.response?.data
        const fieldErrors = responseData?.errors

        if (fieldErrors) {
          Object.entries(fieldErrors).forEach(([field, messages]) => {
            setError(field as keyof StudentFormValues, {
              type: 'server',
              message: messages[0],
            })
          })
        }

        if (!fieldErrors && responseData?.message) {
          setError('root.server', { type: 'server', message: responseData.message })
        }
      }
    }
  }

  if (programsQuery.isLoading) {
    return <div className="card"><LoadingState label="Loading programs..." /></div>
  }

  if (programsQuery.isError) {
    return <ErrorState message="Unable to load programs." onRetry={() => void programsQuery.refetch()} />
  }

  return (
    <form className="card" onSubmit={handleSubmit(submit)}>
      {errors.root?.server?.message && (
        <div className="alert-error mx-5 mt-5 sm:mx-7" role="alert">
          {errors.root.server.message}
        </div>
      )}

      <FormSection title="Basic details" description="The student's name and school ID.">
        <Input label="Student number" required placeholder="e.g. 2026-0001" error={errors.student_number?.message} {...register('student_number')} />
        <Input label="First name" required error={errors.first_name?.message} {...register('first_name')} />
        <Input label="Middle name" error={errors.middle_name?.message} {...register('middle_name')} />
        <Input label="Last name" required error={errors.last_name?.message} {...register('last_name')} />
      </FormSection>

      <FormSection title="Academic details" description="Where the student is in their studies.">
        <div className="sm:col-span-2">
          <Select label="Program" required error={errors.program_id?.message} {...register('program_id')}>
            <option value="">Select a program</option>
            {programsQuery.data?.map((program) => (
              <option key={program.id} value={program.id}>{program.code} - {program.name}</option>
            ))}
          </Select>
        </div>
        <Input label="Year level" type="number" min={1} max={6} required error={errors.year_level?.message} {...register('year_level')} />
        <Select label="Status" required error={errors.status?.message} {...register('status')}>
          {statuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
        </Select>
        <Input label="Admission date" type="date" required error={errors.admission_date?.message} {...register('admission_date')} />
        <Input label="Expected graduation date" type="date" error={errors.expected_graduation_date?.message} {...register('expected_graduation_date')} />
        <Input label="Cumulative GPA" type="number" min={0} max={4} step="0.01" help="On a 0–4 scale. Leave blank if not yet available." error={errors.cumulative_gpa?.message} {...register('cumulative_gpa')} />
      </FormSection>

      <FormSection title="Personal and contact" description="Optional details used for records and contact.">
        <Input label="Date of birth" type="date" error={errors.date_of_birth?.message} {...register('date_of_birth')} />
        <Select label="Gender" error={errors.gender?.message} {...register('gender')}>
          <option value="">Prefer not to say</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
          <option value="prefer_not_to_say">Prefer not to say</option>
        </Select>
        <Input label="Phone" type="tel" error={errors.phone?.message} {...register('phone')} />
        <div className="sm:col-span-2">
          <Input label="Address" error={errors.address?.message} {...register('address')} />
        </div>
      </FormSection>

      <FormActions submitLabel={submitLabel} isSubmitting={isSubmitting} cancelTo={cancelTo} />
    </form>
  )
}
