import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import Input from '../ui/Input'
import Select from '../ui/Select'
import { FormActions, FormSection } from '../ui/FormSection'
const schema = z.object({ code: z.string().min(1).max(20), name: z.string().min(1), term_type: z.enum(['fall', 'spring', 'summer', 'winter', 'intersession']), academic_year: z.coerce.number().int().min(1900), start_date: z.string().date(), end_date: z.string().date(), registration_start: z.string().optional(), registration_end: z.string().optional(), status: z.enum(['planned', 'open', 'closed', 'archived']) })
export type TermFormValues = z.output<typeof schema>
type Props = { defaultValues?: Partial<TermFormValues>; onSubmit: (data: TermFormValues) => Promise<void>; submitLabel: string; isSubmitting: boolean; cancelTo?: string }
export default function TermForm({ defaultValues, onSubmit, submitLabel, isSubmitting, cancelTo }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<z.input<typeof schema>, unknown, TermFormValues>({ resolver: zodResolver(schema), defaultValues })
  return <form className="card" onSubmit={handleSubmit(onSubmit)}>
    <FormSection title="Term details" description="How this term is named and when it falls in the school year.">
      <Input label="Code" required placeholder="e.g. 2026-1S" error={errors.code?.message} {...register('code')} />
      <Input label="Name" required placeholder="e.g. First Semester 2026" error={errors.name?.message} {...register('name')} />
      <Select label="Term type" required error={errors.term_type?.message} {...register('term_type')}><option value="fall">Fall</option><option value="spring">Spring</option><option value="summer">Summer</option><option value="winter">Winter</option><option value="intersession">Intersession</option></Select>
      <Input label="Academic year" type="number" required placeholder="e.g. 2026" error={errors.academic_year?.message} {...register('academic_year')} />
    </FormSection>
    <FormSection title="Dates" description="When classes run, and the window for registering.">
      <Input label="Start date" type="date" required error={errors.start_date?.message} {...register('start_date')} />
      <Input label="End date" type="date" required error={errors.end_date?.message} {...register('end_date')} />
      <Input label="Registration start" type="date" error={errors.registration_start?.message} {...register('registration_start')} />
      <Input label="Registration end" type="date" error={errors.registration_end?.message} {...register('registration_end')} />
    </FormSection>
    <FormSection title="Status" description="Planned terms are not yet open for enrollment.">
      <Select label="Status" required error={errors.status?.message} {...register('status')}><option value="planned">Planned</option><option value="open">Open</option><option value="closed">Closed</option><option value="archived">Archived</option></Select>
    </FormSection>
    <FormActions submitLabel={submitLabel} isSubmitting={isSubmitting} cancelTo={cancelTo} />
  </form>
}
