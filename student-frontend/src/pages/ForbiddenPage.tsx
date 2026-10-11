import { Link } from 'react-router-dom'
import Icon from '../components/ui/Icon'

export default function ForbiddenPage() {
  return (
    <section className="flex min-h-[60vh] items-center justify-center py-10">
      <div className="card max-w-md px-8 py-10 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200">
          <Icon name="lock" size={26} />
        </span>
        <p className="mt-5 text-sm font-semibold text-amber-800">Error 403</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-stone-900">Access forbidden</h1>
        <p className="mt-3 text-stone-600">You don&apos;t have permission to view this page. If you think you should, ask your administrator to check your role.</p>
        <Link className="btn-primary mt-7" to="/dashboard">
          <Icon name="arrowLeft" size={16} />
          Back to dashboard
        </Link>
      </div>
    </section>
  )
}
