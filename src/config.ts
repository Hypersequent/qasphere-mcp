import dotenv from 'dotenv'

dotenv.config()

// Validate required environment variables
const requiredEnvVars = ['QASPHERE_TENANT_URL', 'QASPHERE_API_KEY']
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Error: Missing required environment variable: ${envVar}`)
    process.exit(1)
  }
}

export const QASPHERE_TENANT_URL = ((url: string) => {
  let tenantUrl = url
  if (
    !tenantUrl.toLowerCase().startsWith('http://') &&
    !tenantUrl.toLowerCase().startsWith('https://')
  ) {
    tenantUrl = `https://${tenantUrl}`
  }
  if (tenantUrl.endsWith('/')) {
    tenantUrl = tenantUrl.slice(0, -1)
  }
  return tenantUrl
})(process.env.QASPHERE_TENANT_URL!)

export const QASPHERE_API_KEY = process.env.QASPHERE_API_KEY!
