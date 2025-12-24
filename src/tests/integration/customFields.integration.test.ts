import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import axios from 'axios'
import {
  TENANT_URL,
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
    // Clean up the test project
    await deleteTestProject(sessionToken, testProjectId)
  })

  describe('list_custom_fields', () => {
    it('should return field definitions', async () => {
      const response = await axios.get(
        `${TENANT_URL}/api/public/v0/project/${testProjectCode}/tcase/custom-fields`,
        {
          headers: getApiHeaders(),
        }
      )

      expect(response.status).toBe(200)
      expect(Array.isArray(response.data)).toBe(true)
    })

    it('should return fields with correct types', async () => {
      const response = await axios.get(
        `${TENANT_URL}/api/public/v0/project/${testProjectCode}/tcase/custom-fields`,
        {
          headers: getApiHeaders(),
        }
      )

      expect(response.status).toBe(200)

      // If there are custom fields, verify they have the expected structure
      if (response.data.length > 0) {
        const field = response.data[0]
        expect(field).toHaveProperty('id')
        expect(field).toHaveProperty('systemName')
        expect(field).toHaveProperty('title')
        expect(field).toHaveProperty('type')
        expect(['text', 'dropdown']).toContain(field.type)
      }
    })
  })
})
