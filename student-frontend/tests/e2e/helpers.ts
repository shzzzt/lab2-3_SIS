import type { Page, Route } from '@playwright/test'

export type TestRole = 'registrar' | 'student'

const users = {
  registrar: {
    id: 1,
    first_name: 'Ada',
    last_name: 'Admin',
    name: 'Ada Admin',
    email: 'registrar@example.com',
    role: 'registrar',
    status: 'active',
  },
  student: {
    id: 2,
    first_name: 'Sam',
    last_name: 'Student',
    name: 'Sam Student',
    email: 'student@example.com',
    role: 'student',
    status: 'active',
  },
} as const

const json = (route: Route, body: unknown, status = 200) =>
  route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })

export async function mockAuthentication(page: Page, role: TestRole | null): Promise<void> {
  let currentRole = role
  await page.route('**/api/v1/branding', (route) => json(route, { data: { institution_name: 'Student Information', theme: 'teal', logo: null } }))
  await page.route('**/system-info', (route) => json(route, { data: { institution_name: 'Student Information', support_email: '' } }))

  // Dashboard requests use the fake token too; keep them off the live API.
  await page.route((url) => url.pathname.startsWith('/api/v1/') && url.searchParams.get('per_page') === '1',
    (route) => json(route, paginated([])))

  await page.route('**/auth/login', async (route) => {
    const credentials = route.request().postDataJSON() as { email: string }
    currentRole = credentials.email === users.student.email ? 'student' : 'registrar'
    await json(route, { access_token: `${currentRole}-token`, token_type: 'bearer', expires_in: 3600 })
  })

  await page.route('**/auth/me', async (route) => {
    if (currentRole === null) {
      await json(route, { message: 'Unauthenticated.' }, 401)
      return
    }

    await json(route, users[currentRole])
  })

  await page.route('**/auth/logout', async (route) => {
    currentRole = null
    await json(route, { message: 'Successfully logged out.' })
  })
}

export async function login(page: Page, role: TestRole): Promise<void> {
  await mockAuthentication(page, null)
  await page.goto('/login')
  await page.getByLabel('Email').fill(users[role].email)
  await page.getByLabel('Password').fill('password')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL('**/dashboard')
}

export const paginated = (data: unknown[]) => ({
  success: true,
  message: 'Records retrieved successfully.',
  data,
  meta: { current_page: 1, per_page: 20, total: data.length, last_page: 1 },
})
