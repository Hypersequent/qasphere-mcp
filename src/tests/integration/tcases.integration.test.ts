import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import axios from 'axios'
import {
  TENANT_URL,
  getApiHeaders,
  login,
  createTestProject,
  deleteTestProject,
  generateProjectCode,
  createTestFolder,
} from './helpers.js'

describe('Test Case API Integration Tests', () => {
  let sessionToken: string
  let testProjectCode: string
  let testProjectId: string
  let testFolderId: number
  let createdTestCaseSeq: number

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
    // Clean up the test project
    await deleteTestProject(sessionToken, testProjectId)
  })

  describe('list_test_cases', () => {
    it('should return paginated list', async () => {
      const response = await axios.get(
        `${TENANT_URL}/api/public/v0/project/${testProjectCode}/tcase`,
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

    it('should filter by search term', async () => {
      // Create a test case with unique title
      const uniqueTitle = `[MCP-TEST] Unique ${Date.now()}`
      await axios.post(
        `${TENANT_URL}/api/public/v0/project/${testProjectCode}/tcase`,
        {
          title: uniqueTitle,
          type: 'standalone',
          folderId: testFolderId,
          priority: 'medium',
        },
        {
          headers: getApiHeaders(),
        }
      )

      const response = await axios.get(
        `${TENANT_URL}/api/public/v0/project/${testProjectCode}/tcase`,
        {
          params: { search: uniqueTitle },
          headers: getApiHeaders(),
        }
      )

      expect(response.status).toBe(200)
      expect(response.data.data.length).toBeGreaterThan(0)
      expect(response.data.data[0].title).toBe(uniqueTitle)
    })

    it('should filter by priority', async () => {
      // Create a high priority test case
      await axios.post(
        `${TENANT_URL}/api/public/v0/project/${testProjectCode}/tcase`,
        {
          title: `[MCP-TEST] High Priority ${Date.now()}`,
          type: 'standalone',
          folderId: testFolderId,
          priority: 'high',
        },
        {
          headers: getApiHeaders(),
        }
      )

      const response = await axios.get(
        `${TENANT_URL}/api/public/v0/project/${testProjectCode}/tcase`,
        {
          params: { priorities: ['high'] },
          headers: getApiHeaders(),
        }
      )

      expect(response.status).toBe(200)
      if (response.data.data.length > 0) {
        expect(response.data.data.every((tc: any) => tc.priority === 'high')).toBe(true)
      }
    })

    it('should include steps and tags when requested', async () => {
      const response = await axios.get(
        `${TENANT_URL}/api/public/v0/project/${testProjectCode}/tcase`,
        {
          params: { include: ['steps', 'tags'] },
          headers: getApiHeaders(),
        }
      )

      expect(response.status).toBe(200)
      if (response.data.data.length > 0) {
        const firstCase = response.data.data[0]
        expect(firstCase).toHaveProperty('steps')
        expect(firstCase).toHaveProperty('tags')
      }
    })
  })

  describe('create_test_case', () => {
    it('should create standalone test case', async () => {
      const response = await axios.post(
        `${TENANT_URL}/api/public/v0/project/${testProjectCode}/tcase`,
        {
          title: `[MCP-TEST] Standalone ${Date.now()}`,
          type: 'standalone',
          folderId: testFolderId,
          priority: 'medium',
        },
        {
          headers: getApiHeaders(),
        }
      )

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('tcaseId')
      expect(response.data).toHaveProperty('seq')
      createdTestCaseSeq = response.data.seq
    })

    it('should create test case with steps', async () => {
      const response = await axios.post(
        `${TENANT_URL}/api/public/v0/project/${testProjectCode}/tcase`,
        {
          title: `[MCP-TEST] With Steps ${Date.now()}`,
          type: 'standalone',
          folderId: testFolderId,
          priority: 'low',
          steps: [
            {
              description: '<p>Step 1: Open application</p>',
              expected: '<p>Application opens successfully</p>',
            },
            {
              description: '<p>Step 2: Login</p>',
              expected: '<p>User is logged in</p>',
            },
          ],
        },
        {
          headers: getApiHeaders(),
        }
      )

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('tcaseId')

      // Verify steps were saved
      const getResponse = await axios.get(
        `${TENANT_URL}/api/public/v0/project/${testProjectCode}/tcase/${response.data.seq}`,
        {
          headers: getApiHeaders(),
        }
      )

      expect(getResponse.data.steps).toBeDefined()
      expect(getResponse.data.steps.length).toBe(2)
    })

    it('should create test case with tags', async () => {
      const tagName = `mcp-test-${Date.now()}`
      const response = await axios.post(
        `${TENANT_URL}/api/public/v0/project/${testProjectCode}/tcase`,
        {
          title: `[MCP-TEST] With Tags ${Date.now()}`,
          type: 'standalone',
          folderId: testFolderId,
          priority: 'medium',
          tags: [tagName],
        },
        {
          headers: getApiHeaders(),
        }
      )

      expect(response.status).toBe(200)

      // Verify tags were created/linked
      const getResponse = await axios.get(
        `${TENANT_URL}/api/public/v0/project/${testProjectCode}/tcase/${response.data.seq}`,
        {
          params: { include: ['tags'] },
          headers: getApiHeaders(),
        }
      )

      expect(getResponse.data.tags).toBeDefined()
      expect(getResponse.data.tags.some((t: any) => t.title === tagName)).toBe(true)
    })
  })

  describe('get_test_case', () => {
    it('should return full test case by marker', async () => {
      const marker = `${testProjectCode}-${createdTestCaseSeq}`
      const response = await axios.get(
        `${TENANT_URL}/api/public/v0/project/${testProjectCode}/tcase/${createdTestCaseSeq}`,
        {
          headers: getApiHeaders(),
        }
      )

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('id')
      expect(response.data).toHaveProperty('title')
      expect(response.data).toHaveProperty('version')
      expect(response.data.seq).toBe(createdTestCaseSeq)
    })

    it('should throw 404 for non-existent test case', async () => {
      await expect(
        axios.get(`${TENANT_URL}/api/public/v0/project/${testProjectCode}/tcase/999999`, {
          headers: getApiHeaders(),
        })
      ).rejects.toMatchObject({
        response: {
          status: 404,
        },
      })
    })
  })

  describe('update_test_case', () => {
    it('should update test case title', async () => {
      const newTitle = `[MCP-TEST] Updated Title ${Date.now()}`
      const response = await axios.patch(
        `${TENANT_URL}/api/public/v0/project/${testProjectCode}/tcase/${createdTestCaseSeq}`,
        {
          title: newTitle,
        },
        {
          headers: getApiHeaders(),
        }
      )

      expect(response.status).toBe(200)

      // Verify title was updated
      const getResponse = await axios.get(
        `${TENANT_URL}/api/public/v0/project/${testProjectCode}/tcase/${createdTestCaseSeq}`,
        {
          headers: getApiHeaders(),
        }
      )

      expect(getResponse.data.title).toBe(newTitle)
    })

    it('should update test case priority', async () => {
      const response = await axios.patch(
        `${TENANT_URL}/api/public/v0/project/${testProjectCode}/tcase/${createdTestCaseSeq}`,
        {
          priority: 'high',
        },
        {
          headers: getApiHeaders(),
        }
      )

      expect(response.status).toBe(200)

      // Verify priority was updated
      const getResponse = await axios.get(
        `${TENANT_URL}/api/public/v0/project/${testProjectCode}/tcase/${createdTestCaseSeq}`,
        {
          headers: getApiHeaders(),
        }
      )

      expect(getResponse.data.priority).toBe('high')
    })
  })
})
