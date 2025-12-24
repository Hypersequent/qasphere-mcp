import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import axios from 'axios'
import {
  getTenantUrl,
  getApiHeaders,
  login,
  createTestProject,
  deleteTestProject,
  generateProjectCode,
  createTestFolder,
} from './helpers.js'

describe('Requirements API Integration Tests', () => {
  let sessionToken: string
  let testProjectCode: string
  let testProjectId: string
  let testFolderId: number
  let requirementId: string

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

    // Create a test folder
    const folderIds = await createTestFolder(testProjectCode, ['[MCP-TEST] Integration Tests'])
    testFolderId = folderIds[0]

    // Create a test case with a requirement
    await axios.post(
      `${getTenantUrl()}/api/public/v0/project/${testProjectCode}/tcase`,
      {
        title: `[MCP-TEST] Requirement Test ${Date.now()}`,
        type: 'standalone',
        folderId: testFolderId,
        priority: 'medium',
        requirements: [
          {
            text: '[MCP-TEST] Requirement',
            url: 'https://example.com/req-123',
          },
        ],
      },
      {
        headers: getApiHeaders(),
      }
    )
  })

  afterAll(async () => {
    // Clean up the test project (only if it was created)
    if (sessionToken && testProjectId) {
      await deleteTestProject(sessionToken, testProjectId)
    }
  })

  describe('list_requirements', () => {
    it('should return requirement list', async () => {
      const response = await axios.get(
        `${getTenantUrl()}/api/public/v0/project/${testProjectCode}/tcase/requirements`,
        {
          headers: getApiHeaders(),
        }
      )

      expect(response.status).toBe(200)
      expect(Array.isArray(response.data)).toBe(true)
      expect(response.data.length).toBeGreaterThan(0)

      // Find our test requirement
      const testReq = response.data.find((req: any) => req.text === '[MCP-TEST] Requirement')
      expect(testReq).toBeDefined()
      expect(testReq).toHaveProperty('id')
      expect(testReq).toHaveProperty('url')
      requirementId = testReq.id
    })

    it('should include test case count when requested', async () => {
      const response = await axios.get(
        `${getTenantUrl()}/api/public/v0/project/${testProjectCode}/tcase/requirements`,
        {
          params: { include: 'tcaseCount' },
          headers: getApiHeaders(),
        }
      )

      expect(response.status).toBe(200)
      if (response.data.length > 0) {
        const firstReq = response.data[0]
        expect(firstReq).toHaveProperty('tcaseCount')
        expect(typeof firstReq.tcaseCount).toBe('number')
      }
    })
  })

  describe('filter test cases by requirement', () => {
    it('should return linked test cases', async () => {
      const response = await axios.get(
        `${getTenantUrl()}/api/public/v0/project/${testProjectCode}/tcase`,
        {
          params: { requirementIds: [requirementId] },
          headers: getApiHeaders(),
        }
      )

      expect(response.status).toBe(200)
      expect(response.data.data.length).toBeGreaterThan(0)

      // Verify all returned test cases have the requirement
      for (const testCase of response.data.data) {
        const tcResponse = await axios.get(
          `${getTenantUrl()}/api/public/v0/project/${testProjectCode}/tcase/${testCase.seq}`,
          {
            params: { include: ['requirements'] },
            headers: getApiHeaders(),
          }
        )

        expect(tcResponse.data.requirements).toBeDefined()
        const hasRequirement = tcResponse.data.requirements.some(
          (req: any) => req.id === requirementId
        )
        expect(hasRequirement).toBe(true)
      }
    })
  })
})
