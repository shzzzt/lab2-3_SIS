import { createHmac } from 'node:crypto'
import { expect, test } from '@playwright/test'

// Independent TOTP generator for the browser test; the server uses OTPHP.
function totp(secret: string) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  const bits = [...secret].map((char) => alphabet.indexOf(char).toString(2).padStart(5, '0')).join('')
  const key = Buffer.from(bits.match(/.{8}/g)!.map((byte) => parseInt(byte, 2)))
  const counter = Buffer.alloc(8)
  counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000)))
  const digest = createHmac('sha1', key).update(counter).digest()
  const offset = digest[digest.length - 1] & 15
  return ((digest.readUInt32BE(offset) & 0x7fffffff) % 1000000).toString().padStart(6, '0')
}

test('enrolls MFA, requires a second factor on login, and consumes a recovery code', async ({ page, request }) => {
  test.skip(process.env.E2E_API_TESTS !== '1', 'Requires seeded local API.')
  test.setTimeout(90000)
  const api = 'http://127.0.0.1:8000/api/v1'
  const adminLogin = await request.post(`${api}/auth/login`, { data: { email: 'admin@example.com', password: 'password' } })
  expect(adminLogin.status()).toBe(200)
  const adminToken = (await adminLogin.json()).access_token
  const headers = { Authorization: `Bearer ${adminToken}` }
  const account = { first_name: 'MFA', last_name: 'Browser Test', email: `mfa-test-${Date.now()}@example.com`, password: 'Browser-test-password-2026', role: 'student', status: 'active' }
  const created = await request.post(`${api}/admin/users`, { headers, data: account })
  expect(created.status()).toBe(201)
  const id = (await created.json()).data.id
  try {
    await page.goto('/login')
    await page.getByLabel('Email').fill(account.email)
    await page.getByLabel('Password').fill(account.password)
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page).toHaveURL(/\/dashboard$/)
    await page.getByRole('link', { name: 'Profile' }).click()
    await page.getByLabel('Current password').fill(account.password)
    await page.getByRole('button', { name: 'Start MFA setup' }).click()
    await expect(page.getByRole('heading', { name: 'Connect your authenticator' })).toBeVisible()
    const secret = await page.locator('code').innerText()
    await page.getByLabel('Authenticator code').fill(totp(secret))
    await page.getByRole('button', { name: 'Enable MFA', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Save your recovery codes' })).toBeVisible()
    const recovery = await page.getByRole('region', { name: 'Recovery codes' }).getByRole('listitem').first().innerText()
    await page.getByRole('button', { name: 'I have saved my codes' }).click()
    await page.getByRole('button', { name: 'Sign out' }).click()
    await page.getByLabel('Email').fill(account.email)
    await page.getByLabel('Password').fill(account.password)
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page.getByLabel('Authenticator or recovery code')).toBeVisible()
    await expect(page).toHaveURL(/\/login$/)
    await page.getByLabel('Authenticator or recovery code').fill(recovery)
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page).toHaveURL(/\/dashboard$/)
    await page.getByRole('link', { name: 'Profile' }).click()
    await expect(page.getByText('7 recovery codes remaining.')).toBeVisible()
  } finally {
    const response = await request.patch(`${api}/admin/users/${id}`, { headers, data: { ...account, status: 'inactive' } })
    expect(response.status()).toBe(200)
  }
})
