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

describe('Tags API Integration Tests', () => {
  let sessionToken: string
  let testProjectCode: string
  let testProjectId: string
  let testFolderId: number

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
  })

  afterAll(async () => {
    // Clean up the test project (only if it was created)
    if (sessionToken && testProjectId) {
      await deleteTestProject(sessionToken, testProjectId)
    }
  })

  describe('list_test_cases_tags', () => {
    it('should return tag list', async () => {
      const response = await axios.get(
        `${getTenantUrl()}/api/public/v0/project/${testProjectCode}/tag`,
        {
          headers: getApiHeaders(),
        }
      )

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('tags')
      expect(Array.isArray(response.data.tags)).toBe(true)
    })

    it('should reflect created tags after test case creation', async () => {
      const tagName = `mcp-integration-${Date.now()}`

      // Create a test case with a tag
      await axios.post(
        `${getTenantUrl()}/api/public/v0/project/${testProjectCode}/tcase`,
        {
          title: `[MCP-TEST] Tag Test ${Date.now()}`,
          type: 'standalone',
          folderId: testFolderId,
          priority: 'medium',
          tags: [tagName],
        },
        {
          headers: getApiHeaders(),
        }
      )

      // List tags
      const response = await axios.get(
        `${getTenantUrl()}/api/public/v0/project/${testProjectCode}/tag`,
        {
          headers: getApiHeaders(),
        }
      )

      expect(response.status).toBe(200)
      const createdTag = response.data.tags.find((tag: any) => tag.title === tagName)
      expect(createdTag).toBeDefined()
      expect(createdTag).toHaveProperty('id')
      expect(createdTag).toHaveProperty('title')
    })
  })
})
