import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('Config Module Tests', () => {
  let originalEnv: NodeJS.ProcessEnv

  beforeEach(() => {
    originalEnv = { ...process.env }
  })

  afterEach(() => {
    process.env = originalEnv
    vi.resetModules()
  })

  describe('URL normalization', () => {
    it('should add https:// prefix when protocol is missing', async () => {
      process.env.QASPHERE_TENANT_URL = 'tenant.qasphere.com'
      process.env.QASPHERE_API_KEY = 'test-key'

      const config = await import('../../config.js')
      expect(config.QASPHERE_TENANT_URL).toBe('https://tenant.qasphere.com')
    })

    it('should keep http:// as-is', async () => {
      process.env.QASPHERE_TENANT_URL = 'http://tenant.qasphere.com'
      process.env.QASPHERE_API_KEY = 'test-key'

      const config = await import('../../config.js')
      expect(config.QASPHERE_TENANT_URL).toBe('http://tenant.qasphere.com')
    })

    it('should keep https:// as-is', async () => {
      process.env.QASPHERE_TENANT_URL = 'https://tenant.qasphere.com'
      process.env.QASPHERE_API_KEY = 'test-key'

      const config = await import('../../config.js')
      expect(config.QASPHERE_TENANT_URL).toBe('https://tenant.qasphere.com')
    })

    it('should remove trailing slash', async () => {
      process.env.QASPHERE_TENANT_URL = 'https://tenant.qasphere.com/'
      process.env.QASPHERE_API_KEY = 'test-key'

      const config = await import('../../config.js')
      expect(config.QASPHERE_TENANT_URL).toBe('https://tenant.qasphere.com')
    })

    it('should normalize mixed case protocol', async () => {
      process.env.QASPHERE_TENANT_URL = 'HTTPS://tenant.qasphere.com'
      process.env.QASPHERE_API_KEY = 'test-key'

      const config = await import('../../config.js')
      expect(config.QASPHERE_TENANT_URL).toBe('HTTPS://tenant.qasphere.com')
    })
  })

  describe('API key', () => {
    it('should export the API key from environment', async () => {
      process.env.QASPHERE_TENANT_URL = 'https://tenant.qasphere.com'
      process.env.QASPHERE_API_KEY = 'my-secret-key'

      const config = await import('../../config.js')
      expect(config.QASPHERE_API_KEY).toBe('my-secret-key')
    })
  })
})
