import axios from 'axios'

// Environment configuration
export const TENANT_URL = process.env.QASPHERE_TENANT_URL || 'https://e2eqas.eu1.qasphere.com'
export const API_KEY = process.env.QASPHERE_API_KEY || ''

// Auth credentials for internal API
const TENANT_ID = 'eu1vweq68d'
const AUTH_EMAIL = 'satvik+e2eqasphere@hypersequent.com'
const AUTH_PASSWORD = process.env.QASPHERE_AUTH_PASSWORD || 'drk-brz7ABF9ken8hcf'

if (!API_KEY) {
  throw new Error('QASPHERE_API_KEY environment variable is required for integration tests')
}

// Shared session token for all tests
let sharedSessionToken: string | null = null

// Login to get session token (cached)
export async function login(): Promise<string> {
  if (sharedSessionToken) {
    return sharedSessionToken
  }

  try {
    const response = await axios.post(
      `${TENANT_URL}/api/auth/login`,
      {
        tenantId: TENANT_ID,
        email: AUTH_EMAIL,
        password: AUTH_PASSWORD,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
    const token: string = response.data.token
    sharedSessionToken = token
    return token
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Failed to login: ${error.response?.data?.message || error.message}`)
    }
    throw error
  }
}

// Get the current session token (must call login() first)
export function getSessionToken(): string {
  if (!sharedSessionToken) {
    throw new Error('Session token not available. Call login() first.')
  }
  return sharedSessionToken
}

// Generate a random project code for testing
export function generateProjectCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = 'T'
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// Create a test project using internal API
export async function createTestProject(sessionToken: string, code: string, title: string) {
  try {
    const response = await axios.post(
      `${TENANT_URL}/api/project`,
      {
        code,
        title,
        description: `[MCP-TEST] Integration test project created at ${new Date().toISOString()}`,
      },
      {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          'Content-Type': 'application/json',
        },
      }
    )
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        `Failed to create test project: ${error.response?.data?.message || error.message}`
      )
    }
    throw error
  }
}

// Delete a test project using internal API
export async function deleteTestProject(sessionToken: string, projectId: string) {
  try {
    await axios.delete(`${TENANT_URL}/api/project/${projectId}`, {
      headers: {
        Authorization: `Bearer ${sessionToken}`,
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // Only warn if it's not a 404 (project already deleted)
      if (error.response?.status !== 404) {
        console.warn(
          `Failed to delete test project ${projectId}:`,
          error.response?.data?.message || error.message
        )
      }
    }
  }
}

// Get API headers
export function getApiHeaders() {
  return {
    Authorization: `ApiKey ${API_KEY}`,
    'Content-Type': 'application/json',
  }
}

// Create a test folder within a project
export async function createTestFolder(projectCode: string, path: string[]) {
  const response = await axios.post(
    `${TENANT_URL}/api/public/v0/project/${projectCode}/folder/bulk-upsert`,
    {
      folders: [{ path }],
    },
    {
      headers: getApiHeaders(),
    }
  )
  return response.data.folders[0]
}

// Sleep helper for rate limiting
export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
