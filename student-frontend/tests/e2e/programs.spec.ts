import { expect, test } from '@playwright/test'
import { login } from './helpers'

const program = { id: 11, code: 'BSIT', name: 'Information Technology', department: 'Computing', degree_level: 'bachelor', total_credits: 140, status: 'active' }
const courses = Array.from({ length: 23 }, (_, index) => ({ id: index + 1, program_id: 11, course_code: `IT${String(index + 1).padStart(3, '0')}`, title: `Technology course ${index + 1}`, credits: 3, lecture_hours: 2, lab_hours: 1, status: 'active' }))
const otherCourse = { ...courses[0], id: 99, program_id: 22, course_code: 'CS999', title: 'Another program course' }

test.beforeEach(async ({ page }) => {
  await page.route('**/api/v1/programs?**', (route) => route.fulfill({ json: { data: [program] } }))
  await page.route('**/api/v1/programs/11', (route) => route.fulfill({ json: { data: program } }))
  await page.route('**/api/v1/courses?**', (route) => {
    const params = new URL(route.request().url()).searchParams
    let rows = [...courses, otherCourse]
    if (params.has('program_id')) rows = rows.filter((course) => course.program_id === Number(params.get('program_id')))
    if (params.get('search')) rows = rows.filter((course) => `${course.course_code} ${course.title}`.toLowerCase().includes(params.get('search')!.toLowerCase()))
    if (params.get('status')) rows = rows.filter((course) => course.status === params.get('status'))
    const pageNumber = Number(params.get('page') || 1)
    return route.fulfill({ json: { data: { data: rows.slice((pageNumber - 1) * 20, pageNumber * 20), current_page: pageNumber, per_page: 20, total: rows.length, last_page: Math.max(1, Math.ceil(rows.length / 20)) } } })
  })
  await login(page, 'registrar')
})

test('opens program details and keeps its courses scoped while paging and searching', async ({ page }) => {
  await page.getByRole('link', { name: 'Programs', exact: true }).click()
  await page.getByRole('link', { name: program.name, exact: true }).click()
  await expect(page).toHaveURL(/\/programs\/11$/)
  await expect(page.getByRole('heading', { name: program.name, exact: true })).toBeVisible()
  await expect(page.getByText('140', { exact: true })).toBeVisible()
  await expect(page.getByRole('cell', { name: 'IT001', exact: true })).toBeVisible()
  await expect(page.getByRole('cell', { name: otherCourse.title })).toHaveCount(0)
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await expect(page.getByRole('cell', { name: 'IT023', exact: true })).toBeVisible()
  await expect(page.getByRole('cell', { name: 'IT001', exact: true })).toHaveCount(0)
  await page.getByLabel('Search program courses').fill('IT002')
  await page.getByRole('button', { name: 'Search', exact: true }).click()
  await expect(page.getByRole('cell', { name: 'IT002', exact: true })).toBeVisible()
  await expect(page.getByText('Page 1 of 1')).toBeVisible()
  await page.getByLabel('Course status').selectOption('archived')
  await expect(page.getByRole('heading', { name: 'No matching courses' })).toBeVisible()
  await page.getByRole('button', { name: 'Clear filters' }).click()
  await expect(page.getByRole('cell', { name: 'IT001', exact: true })).toBeVisible()
  await page.getByRole('link', { name: 'Back to programs' }).click()
  await page.getByRole('link', { name: 'View BSIT program details' }).click()
  await expect(page).toHaveURL(/\/programs\/11$/)
})

test('handles programs without courses', async ({ page }) => {
  await page.route('**/api/v1/courses?**', (route) => route.fulfill({ json: { data: [] } }))
  await page.goto('/programs/11')
  await expect(page.getByRole('heading', { name: 'No courses assigned yet' })).toBeVisible()
})

test('respects read-only program access and denied course access', async ({ page }) => {
  let courseRequests = 0
  page.on('request', (request) => { if (request.url().includes('/api/v1/courses?') && new URL(request.url()).searchParams.get('program_id') === '11') courseRequests++ })
  await page.route('**/auth/me', (route) => route.fulfill({ json: { id: 1, first_name: 'Test', last_name: 'Registrar', email: 'registrar@example.com', role: 'registrar', status: 'active', permissions: { programs: 'read', courses: 'none' } } }))
  await page.goto('/programs/11')
  await expect(page.getByRole('heading', { name: program.name, exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Edit program' })).toHaveCount(0)
  await expect(page.getByText('Your account does not have permission to view courses.')).toBeVisible()
  expect(courseRequests).toBe(0)
})

test('shows a missing-program message instead of an unrelated course list', async ({ page }) => {
  await page.route('**/api/v1/programs/11', (route) => route.fulfill({ status: 404, json: { message: 'Not found' } }))
  await page.goto('/programs/11')
  await expect(page.getByText('Program not found.', { exact: true })).toBeVisible({ timeout: 15000 })
  await expect(page.getByRole('table')).toHaveCount(0)
})
