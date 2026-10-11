import type { User } from '../types'

export function allowed(user: User | null, module: string, manage = false): boolean {
  if (!user) return false
  // Older fixtures omit permissions; backend responses always include them.
  if (!user.permissions) return true
  const level = user.permissions[module] ?? 'none'
  return manage ? level === 'manage' : level !== 'none'
}

export function routeModule(path: string): string | null {
  const part = path.split('/')[1]
  if (part === 'admin') return ({ users: 'accounts', settings: 'settings', security: 'security', 'audit-logs': 'audit' } as Record<string, string>)[path.split('/')[2]] ?? null
  return ({ students: 'students', programs: 'programs', courses: 'courses', terms: 'academic-terms', offerings: 'course-offerings', enrollments: 'enrollments', grades: 'grades' } as Record<string, string>)[part] ?? null
}
