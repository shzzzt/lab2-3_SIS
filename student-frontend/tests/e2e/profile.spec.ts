import { expect, test } from '@playwright/test'

for (const role of ['admin', 'registrar', 'faculty', 'student']) {
  test(`${role} profile shows account details and contains MFA`, async ({ page }, testInfo) => {
    test.skip(process.env.E2E_API_TESTS !== '1', 'Requires the seeded local API.')
    if (role === 'student') await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/login')
    await page.getByLabel('Email').fill(`${role}@example.com`)
    await page.getByLabel('Password').fill('password')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page).toHaveURL(/\/dashboard$/)
    await page.goto('/profile')
    await expect(page.getByRole('heading', { name: 'My profile' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Personal details' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Role & access' })).toBeVisible()
    await expect(page.getByRole('main').getByText(`${role}@example.com`, { exact: true }).first()).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Security & sign-in' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Start MFA setup' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'My security', exact: true })).toHaveCount(0)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await page.screenshot({ path: `test-results/profile-${role}.png`, fullPage: true })
    await testInfo.attach('profile', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' })
    await page.goto('/security')
    await expect(page).toHaveURL(/\/profile#security$/)
    await expect(page.getByRole('heading', { name: 'Security & sign-in' })).toBeVisible()
  })
}
