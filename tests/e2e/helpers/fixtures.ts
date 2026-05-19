import 'dotenv/config'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'

const envSchema = z.object({
  QASPHERE_E2E_TENANT_URL: z.string().min(1),
  QASPHERE_E2E_API_KEY: z.string().min(1),
  QASPHERE_E2E_PROJECT_CODE: z.string().min(1),
})

const result = envSchema.safeParse(process.env)
if (!result.success) {
  const missing = result.error.issues.map((issue) => issue.path.join('.')).join(', ')
  throw new Error(
    `Missing required env vars for e2e tests: ${missing}.\n` +
      'Create a .env file in the repo root or set them in CI.'
  )
}

export const env = result.data

export const NONCE = randomUUID()

export const E2E_PREFIX = '[E2E-TEST]'

export function uniqueTitle(suffix: string): string {
  return `${E2E_PREFIX} ${suffix} ${NONCE}`
}

export function uniqueFolderPath(suffix: string): string[] {
  return [`${E2E_PREFIX} ${suffix} ${NONCE}`]
}

// A syntactically valid project code (regex: ^[A-Z0-9]{2,5}$) used for
// "not found" assertions. If a project with this code happens to exist in
// the target tenant, those assertions will fail — pick a different code here.
export const UNLIKELY_PROJECT_CODE = 'Z9999'
