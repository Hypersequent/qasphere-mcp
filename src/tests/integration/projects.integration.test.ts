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

describe('Project API Integration Tests', () => {
  let sessionToken: string
  let testProjectCode: string
  let testProjectId: string

  beforeAll(async () => {
    // Create a test project (login happens automatically in createTestProject)
    sessionToken = await login() // This is cached, only logs in once
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

  describe('list_projects', () => {
    it('should return array with at least 1 project', async () => {
      const response = await axios.get(`${getTenantUrl()}/api/public/v0/project`, {
        headers: getApiHeaders(),
      })

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('projects')
      expect(Array.isArray(response.data.projects)).toBe(true)
      expect(response.data.projects.length).toBeGreaterThan(0)

      // Verify the test project is in the list
      const testProject = response.data.projects.find((p: any) => p.code === testProjectCode)
      expect(testProject).toBeDefined()
      expect(testProject.id).toBe(testProjectId)
    })
  })

  describe('get_project', () => {
    it('should return project with matching code', async () => {
      const response = await axios.get(
        `${getTenantUrl()}/api/public/v0/project/${testProjectCode}`,
        {
          headers: getApiHeaders(),
        }
      )

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('id')
      expect(response.data).toHaveProperty('code')
      expect(response.data).toHaveProperty('title')
      expect(response.data.code).toBe(testProjectCode)
      expect(response.data.id).toBe(testProjectId)
    })

    it('should throw 404 error for non-existent project', async () => {
      await expect(
        axios.get(`${getTenantUrl()}/api/public/v0/project/XXXNONEXISTENT`, {
          headers: getApiHeaders(),
        })
      ).rejects.toMatchObject({
        response: {
          status: 404,
        },
      })
    })
  })
})
