import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import Input from '../ui/Input'
import Select from '../ui/Select'
import { FormActions, FormSection } from '../ui/FormSection'
import { usePrograms } from '../../hooks/usePrograms'
const schema = z.object({ course_code: z.string().min(1).max(20), title: z.string().min(1), description: z.string().optional(), credits: z.coerce.number().int().min(0), lecture_hours: z.coerce.number().int().min(0), lab_hours: z.coerce.number().int().min(0), program_id: z.coerce.number().optional(), status: z.enum(['active', 'inactive', 'archived']) })
export type CourseFormValues = z.output<typeof schema>
type Props = { defaultValues?: Partial<CourseFormValues>; onSubmit: (data: CourseFormValues) => Promise<void>; submitLabel: string; isSubmitting: boolean; cancelTo?: string }
export default function CourseForm({ defaultValues, onSubmit, submitLabel, isSubmitting, cancelTo }: Props) {
  const programs = usePrograms()
  const { register, handleSubmit, formState: { errors } } = useForm<z.input<typeof schema>, unknown, CourseFormValues>({ resolver: zodResolver(schema), defaultValues })
  return <form className="card" onSubmit={handleSubmit(onSubmit)}>
    <FormSection title="Course details" description="The code and title students see on their records.">
      <Input label="Course code" required placeholder="e.g. IT101" error={errors.course_code?.message} {...register('course_code')} />
      <Select label="Program" error={errors.program_id?.message} {...register('program_id')}><option value="">No program</option>{programs.data?.map((p) => <option key={p.id} value={p.id}>{p.code} - {p.name}</option>)}</Select>
      <div className="sm:col-span-2"><Input label="Title" required placeholder="e.g. Introduction to Computing" error={errors.title?.message} {...register('title')} /></div>
      <div className="sm:col-span-2"><Input label="Description" help="A sentence or two about what the course covers." error={errors.description?.message} {...register('description')} /></div>
    </FormSection>
    <FormSection title="Load and status" description="Credit units, weekly contact hours, and availability.">
      <Input label="Credits" type="number" min={0} required error={errors.credits?.message} {...register('credits')} />
      <Select label="Status" required error={errors.status?.message} {...register('status')}><option value="active">Active</option><option value="inactive">Inactive</option><option value="archived">Archived</option></Select>
      <Input label="Lecture hours" type="number" min={0} required help="Per week." error={errors.lecture_hours?.message} {...register('lecture_hours')} />
      <Input label="Lab hours" type="number" min={0} required help="Per week." error={errors.lab_hours?.message} {...register('lab_hours')} />
    </FormSection>
    <FormActions submitLabel={submitLabel} isSubmitting={isSubmitting} cancelTo={cancelTo} />
  </form>
}
