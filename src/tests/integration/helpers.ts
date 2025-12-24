import axios from 'axios'

// Environment configuration
// Using getters to allow dotenv to load before values are read
export function getTenantUrl() {
  return process.env.QASPHERE_TENANT_URL || 'https://e2eqas.eu1.qasphere.com'
}

export function getApiKey() {
  return process.env.QASPHERE_API_KEY || ''
}

function getTenantId() {
  return process.env.QASPHERE_TENANT_ID || 'eu1vweq68d'
}

function getAuthEmail() {
  return process.env.QASPHERE_AUTH_EMAIL || ''
}

function getAuthPassword() {
  return process.env.QASPHERE_AUTH_PASSWORD || ''
}

// Validate required environment variables
export function validateEnvVars() {
  const missing: string[] = []
  if (!getApiKey()) missing.push('QASPHERE_API_KEY')
  if (!getAuthEmail()) missing.push('QASPHERE_AUTH_EMAIL')
  if (!getAuthPassword()) missing.push('QASPHERE_AUTH_PASSWORD')
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
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
      `${getTenantUrl()}/api/auth/login`,
      {
        tenantId: getTenantId(),
        email: getAuthEmail(),
        password: getAuthPassword(),
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
      `${getTenantUrl()}/api/project`,
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
    await axios.delete(`${getTenantUrl()}/api/project/${projectId}`, {
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
    Authorization: `ApiKey ${getApiKey()}`,
    'Content-Type': 'application/json',
  }
}

// Create a test folder within a project
export async function createTestFolder(projectCode: string, path: string[]) {
  const response = await axios.post(
    `${getTenantUrl()}/api/public/v0/project/${projectCode}/folder/bulk-upsert`,
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
