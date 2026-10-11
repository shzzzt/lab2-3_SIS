import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import Input from '../ui/Input'
import Select from '../ui/Select'
import { FormActions, FormSection } from '../ui/FormSection'

const schema = z.object({ code: z.string().min(1).max(20), name: z.string().min(1), department: z.string().optional(), degree_level: z.enum(['certificate', 'associate', 'bachelor', 'master', 'doctorate']), total_credits: z.coerce.number().int().min(0).optional(), status: z.enum(['active', 'inactive', 'archived']) })
export type ProgramFormValues = z.output<typeof schema>
type Props = { defaultValues?: Partial<ProgramFormValues>; onSubmit: (data: ProgramFormValues) => Promise<void>; submitLabel: string; isSubmitting: boolean; cancelTo?: string }
export default function ProgramForm({ defaultValues, onSubmit, submitLabel, isSubmitting, cancelTo }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<z.input<typeof schema>, unknown, ProgramFormValues>({ resolver: zodResolver(schema), defaultValues })
  return <form className="card" onSubmit={handleSubmit(onSubmit)}>
    <FormSection title="Program details" description="How the program is identified across the system.">
      <Input label="Code" required placeholder="e.g. BSIT" help="A short code, up to 20 characters." error={errors.code?.message} {...register('code')} />
      <Input label="Department" placeholder="e.g. College of Computing" error={errors.department?.message} {...register('department')} />
      <div className="sm:col-span-2"><Input label="Name" required placeholder="e.g. Bachelor of Science in Information Technology" error={errors.name?.message} {...register('name')} /></div>
    </FormSection>
    <FormSection title="Requirements and status" description="Degree level, credits needed to finish, and whether it is offered.">
      <Select label="Degree level" required error={errors.degree_level?.message} {...register('degree_level')}><option value="bachelor">Bachelor</option><option value="certificate">Certificate</option><option value="associate">Associate</option><option value="master">Master</option><option value="doctorate">Doctorate</option></Select>
      <Input label="Total credits" type="number" min={0} help="Credits required to graduate." error={errors.total_credits?.message} {...register('total_credits')} />
      <Select label="Status" required error={errors.status?.message} {...register('status')}><option value="active">Active</option><option value="inactive">Inactive</option><option value="archived">Archived</option></Select>
    </FormSection>
    <FormActions submitLabel={submitLabel} isSubmitting={isSubmitting} cancelTo={cancelTo} />
  </form>
}
