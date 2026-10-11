import ProgramDetailPage from './pages/ProgramDetailPage'
import SecurityPolicyPage from './pages/SecurityPolicyPage'
import AuditLogsPage from './pages/AuditLogsPage'
import AdminPage from './pages/AdminPage'
import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import ProtectedRoute from './routes/ProtectedRoute'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import { BrandingProvider } from './contexts/BrandingContext'
import LoadingState from './components/feedback/LoadingState'
import LoginPage from './pages/LoginPage'
import ForbiddenPage from './pages/ForbiddenPage'
import NotFoundPage from './pages/NotFoundPage'
import DashboardPage from './pages/DashboardPage'
import ProfilePage from './pages/ProfilePage'
import StudentsListPage from './pages/StudentsListPage'
import StudentDetailPage from './pages/StudentDetailPage'
import StudentCreatePage from './pages/StudentCreatePage'
import StudentEditPage from './pages/StudentEditPage'
import ProgramsListPage from './pages/ProgramsListPage'
import ProgramFormPage from './pages/ProgramFormPage'
import CoursesListPage from './pages/CoursesListPage'
import CourseFormPage from './pages/CourseFormPage'
import TermsListPage from './pages/TermsListPage'
import TermFormPage from './pages/TermFormPage'
import OfferingsListPage from './pages/OfferingsListPage'
import OfferingDetailPage from './pages/OfferingDetailPage'
import OfferingFormPage from './pages/OfferingFormPage'
import GradesListPage from './pages/GradesListPage'
import EnrollmentsPage from './pages/EnrollmentsPage'

type PublicOnlyProps = { children: ReactNode }

function PublicOnly({ children }: PublicOnlyProps) {
  const { user, isLoading } = useAuth()

  if (isLoading) return <div className="flex min-h-screen items-center justify-center bg-canvas"><LoadingState label="Loading..." /></div>
  return user ? <Navigate to="/dashboard" replace /> : children
}

export default function App() {
  return (
    <BrandingProvider>
    <ToastProvider>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<PublicOnly><LoginPage /></PublicOnly>} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route path="/security" element={<Navigate to="/profile#security" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route element={<ProtectedRoute roles={['registrar']} />}>
                <Route path="/students" element={<StudentsListPage />} />
              </Route>
              <Route element={<ProtectedRoute roles={['registrar']} />}>
                <Route path="/students/new" element={<StudentCreatePage />} />
                <Route path="/students/:id/edit" element={<StudentEditPage />} />
                <Route path="/programs" element={<ProgramsListPage />} />
                <Route path="/programs/:id" element={<ProgramDetailPage />} />
                <Route path="/programs/new" element={<ProgramFormPage />} />
                <Route path="/programs/:id/edit" element={<ProgramFormPage />} />
                <Route path="/courses" element={<CoursesListPage />} />
                <Route path="/courses/new" element={<CourseFormPage />} />
                <Route path="/courses/:id/edit" element={<CourseFormPage />} />
                <Route path="/terms" element={<TermsListPage />} />
                <Route path="/terms/new" element={<TermFormPage />} />
                <Route path="/terms/:id/edit" element={<TermFormPage />} />
                <Route path="/offerings/new" element={<OfferingFormPage />} />
                <Route path="/offerings/:id/edit" element={<OfferingFormPage />} />
                <Route path="/academic-terms/*" element={<Navigate to="/terms" replace />} />
                <Route path="/course-offerings/*" element={<Navigate to="/offerings" replace />} />
              </Route>
              <Route element={<ProtectedRoute roles={['registrar', 'faculty', 'instructor', 'student']} />}>
                <Route path="/offerings" element={<OfferingsListPage />} />
              </Route>
              <Route element={<ProtectedRoute roles={['registrar', 'faculty', 'instructor']} />}>
                <Route path="/offerings/:id" element={<OfferingDetailPage />} />
              </Route>
              <Route element={<ProtectedRoute roles={['registrar', 'student']} />}>
                <Route path="/students/:id" element={<StudentDetailPage />} />
              </Route>
              <Route element={<ProtectedRoute roles={['registrar', 'faculty', 'instructor', 'student']} />}>
                <Route path="/enrollments" element={<EnrollmentsPage />} />
                <Route path="/grades" element={<GradesListPage />} />
              </Route>
              <Route element={<ProtectedRoute roles={['admin']} />}>
                <Route path="/admin/security" element={<SecurityPolicyPage />} />
                <Route path="/admin/audit-logs" element={<AuditLogsPage />} />
                <Route path="/admin/users" element={<AdminPage />} />
                <Route path="/admin/settings" element={<AdminPage settingsOnly />} />
              </Route>
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/forbidden" element={<ForbiddenPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </ToastProvider>
    </BrandingProvider>
  )
}
