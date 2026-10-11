import { Link } from 'react-router-dom'
import Icon from '../components/ui/Icon'

export default function NotFoundPage() {
  return (
    <section className="flex min-h-[60vh] items-center justify-center py-10">
      <div className="card max-w-md px-8 py-10 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100">
          <Icon name="search" size={26} />
        </span>
        <p className="mt-5 text-sm font-semibold text-brand-700">Error 404</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-stone-900">Page not found.</h1>
        <p className="mt-3 text-stone-600">The page may have moved, or the link might be mistyped. Let&apos;s get you back on track.</p>
        <Link className="btn-primary mt-7" to="/dashboard">
          <Icon name="arrowLeft" size={16} />
          Back to dashboard
        </Link>
      </div>
    </section>
  )
}
