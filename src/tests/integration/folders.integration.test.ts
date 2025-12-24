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

describe('Folder API Integration Tests', () => {
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

  describe('list_folders', () => {
    it('should return folder list with pagination', async () => {
      const response = await axios.get(
        `${TENANT_URL}/api/public/v0/project/${testProjectCode}/tcase/folders`,
        {
          headers: getApiHeaders(),
        }
      )

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('data')
      expect(response.data).toHaveProperty('total')
      expect(response.data).toHaveProperty('page')
      expect(response.data).toHaveProperty('limit')
      expect(Array.isArray(response.data.data)).toBe(true)
    })

    it('should respect pagination parameters', async () => {
      // First create some folders
      await axios.post(
        `${TENANT_URL}/api/public/v0/project/${testProjectCode}/tcase/folder/bulk`,
        {
          folders: [
            { path: ['[MCP-TEST] Folder 1'] },
            { path: ['[MCP-TEST] Folder 2'] },
            { path: ['[MCP-TEST] Folder 3'] },
            { path: ['[MCP-TEST] Folder 4'] },
            { path: ['[MCP-TEST] Folder 5'] },
            { path: ['[MCP-TEST] Folder 6'] },
          ],
        },
        {
          headers: getApiHeaders(),
        }
      )

      const response = await axios.get(
        `${TENANT_URL}/api/public/v0/project/${testProjectCode}/tcase/folders`,
        {
          params: { page: 1, limit: 5 },
          headers: getApiHeaders(),
        }
      )

      expect(response.status).toBe(200)
      expect(response.data.page).toBe(1)
      expect(response.data.limit).toBe(5)
      expect(response.data.data.length).toBeLessThanOrEqual(5)
    })
  })

  describe('upsert_folders', () => {
    it('should create single folder', async () => {
      const response = await axios.post(
        `${TENANT_URL}/api/public/v0/project/${testProjectCode}/tcase/folder/bulk`,
        {
          folders: [{ path: ['[MCP-TEST] Single Folder'] }],
        },
        {
          headers: getApiHeaders(),
        }
      )

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('ids')
      expect(Array.isArray(response.data.ids)).toBe(true)
      expect(response.data.ids.length).toBe(1)
      expect(response.data.ids[0].length).toBe(1)
      expect(typeof response.data.ids[0][0]).toBe('number')
    })

    it('should create nested folders', async () => {
      const response = await axios.post(
        `${TENANT_URL}/api/public/v0/project/${testProjectCode}/tcase/folder/bulk`,
        {
          folders: [{ path: ['[MCP-TEST] A', '[MCP-TEST] B', '[MCP-TEST] C'] }],
        },
        {
          headers: getApiHeaders(),
        }
      )

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('ids')
      expect(response.data.ids.length).toBe(1)
      expect(response.data.ids[0].length).toBe(3)

      // Verify each level has a valid ID
      for (const id of response.data.ids[0]) {
        expect(typeof id).toBe('number')
        expect(id).toBeGreaterThan(0)
      }
    })

    it('should update folder comment without creating duplicate', async () => {
      const folderPath = ['[MCP-TEST] Update Test']

      // Create folder
      const createResponse = await axios.post(
        `${TENANT_URL}/api/public/v0/project/${testProjectCode}/tcase/folder/bulk`,
        {
          folders: [{ path: folderPath, comment: 'Initial comment' }],
        },
        {
          headers: getApiHeaders(),
        }
      )

      const folderId = createResponse.data.ids[0][0]

      // Update folder comment
      const updateResponse = await axios.post(
        `${TENANT_URL}/api/public/v0/project/${testProjectCode}/tcase/folder/bulk`,
        {
          folders: [{ path: folderPath, comment: 'Updated comment' }],
        },
        {
          headers: getApiHeaders(),
        }
      )

      expect(updateResponse.status).toBe(200)
      // Should return the same folder ID (not create a new one)
      expect(updateResponse.data.ids[0][0]).toBe(folderId)
    })
  })
})
