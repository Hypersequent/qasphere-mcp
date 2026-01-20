import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import axios from 'axios'
import {
  getTenantUrl,
  getApiHeaders,
  login,
  createTestProject,
  deleteTestProject,
  generateProjectCode,
} from './helpers.js'

describe('Custom Fields API Integration Tests', () => {
  let sessionToken: string
  let testProjectCode: string
  let testProjectId: string

  beforeAll(async () => {
    // Login and create test project
    sessionToken = await login()
    testProjectCode = generateProjectCode()
    const project = await createTestProject(
      sessionToken,
      testProjectCode,
      `[MCP-TEST] ${testProjectCode}`
    )
    testProjectId = project.id
  })

  afterAll(async () => {
    // Clean up the test project (only if it was created)
    if (sessionToken && testProjectId) {
      await deleteTestProject(sessionToken, testProjectId)
    }
  })

  describe('list_custom_fields', () => {
    it('should return field definitions', async () => {
      const response = await axios.get(
        `${getTenantUrl()}/api/public/v0/project/${testProjectCode}/custom-field`,
        {
          headers: getApiHeaders(),
        }
      )

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('customFields')
      expect(Array.isArray(response.data.customFields)).toBe(true)
    })

    it('should return fields with correct types', async () => {
      const response = await axios.get(
        `${getTenantUrl()}/api/public/v0/project/${testProjectCode}/custom-field`,
        {
          headers: getApiHeaders(),
        }
      )

      expect(response.status).toBe(200)

      // If there are custom fields, verify they have the expected structure
      const customFields = response.data.customFields
      if (customFields.length > 0) {
        const field = customFields[0]
        expect(field).toHaveProperty('id')
        expect(field).toHaveProperty('systemName')
        expect(field).toHaveProperty('name')
        expect(field).toHaveProperty('type')
        expect(['text', 'dropdown']).toContain(field.type)
      }
    })
  })
})
