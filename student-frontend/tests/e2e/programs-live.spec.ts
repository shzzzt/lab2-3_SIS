import { expect, test } from '@playwright/test'

test('registrar opens real programs and sees only their assigned courses', async ({ page }, testInfo) => {
  test.skip(process.env.E2E_API_TESTS !== '1', 'Requires the seeded local API.')
  await page.goto('/login')
  await page.getByLabel('Email').fill('registrar@example.com')
  await page.getByLabel('Password').fill('password')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL(/\/dashboard$/)
  const token = await page.evaluate(() => localStorage.getItem('auth_token'))
  const headers = { Authorization: `Bearer ${token}` }
  const response = await page.request.get('http://127.0.0.1:8000/api/v1/programs?per_page=100', { headers })
  expect(response.ok()).toBe(true)
  const programs = (await response.json()).data.data as { id: number; name: string; code: string }[]
  expect(programs.length).toBeGreaterThan(1)
  for (const program of programs.slice(0, 2)) {
    await page.goto('/programs')
    await page.getByRole('link', { name: program.name, exact: true }).click()
    await expect(page).toHaveURL(new RegExp(`/programs/${program.id}$`))
    await expect(page.getByRole('heading', { name: program.name, exact: true })).toBeVisible()
    const coursesResponse = await page.request.get(`http://127.0.0.1:8000/api/v1/courses?program_id=${program.id}&per_page=20`, { headers })
    expect(coursesResponse.ok()).toBe(true)
    const courses = (await coursesResponse.json()).data.data as { program_id: number; course_code: string }[]
    expect(courses.length).toBeGreaterThan(0)
    await expect(page.locator('tbody tr')).toHaveCount(courses.length)
    for (const course of courses) {
      expect(course.program_id).toBe(program.id)
      await expect(page.getByRole('cell', { name: course.course_code, exact: true })).toBeVisible()
    }
    await testInfo.attach(`program-${program.code}`, { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' })
  }
})
