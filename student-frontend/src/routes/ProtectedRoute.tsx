import { allowed, routeModule } from '../utils/permissions'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import type { Role } from '../types'
import LoadingState from '../components/feedback/LoadingState'

export type { Role } from '../types'

type ProtectedRouteProps = {
  roles?: Role[]
}

export default function ProtectedRoute({ roles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <LoadingState label="Loading..." />
      </div>
    )
  }

  if (user === null) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (user.mfa_required && !user.mfa_enabled && location.pathname !== '/profile') {
    return <Navigate to="/profile#security" replace />
  }
  const module = routeModule(location.pathname)
  if (module && !allowed(user, module, /\/(new|edit)$/.test(location.pathname))) return <Navigate to="/forbidden" replace />

  if (roles !== undefined && !roles.includes(user.role)) {
    return <Navigate to="/forbidden" replace />
  }

  return <Outlet />
}
