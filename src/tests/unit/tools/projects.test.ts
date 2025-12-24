import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { MockedAxios } from '../../setup.js'
import axios from 'axios'
import { mockProject, mockProjects, mockProjectsEmpty } from '../../fixtures/projects.js'

vi.mock('axios')
vi.mock('../../../config.js', () => ({
  QASPHERE_TENANT_URL: 'https://test.qasphere.com',
  QASPHERE_API_KEY: 'test-api-key',
}))

const mockedAxios = axios as unknown as MockedAxios

describe('Project Tools Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('get_project', () => {
    it('should return project JSON on success', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockProject })

      const { registerTools } = await import('../../../tools/projects.js')
      const mockServer = {
        tool: vi.fn((name, desc, schema, handler) => {
          if (name === 'get_project') {
            return handler({ projectCode: 'TST' })
          }
        }),
      } as any

      const result = await registerTools(mockServer)
      const getProjectHandler = mockServer.tool.mock.calls.find(
        (call: any) => call[0] === 'get_project'
      )?.[3]

      const response = await getProjectHandler({ projectCode: 'TST' })

      expect(response).toEqual({
        content: [{ type: 'text', text: JSON.stringify(mockProject) }],
      })
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://test.qasphere.com/api/public/v0/project/TST',
        {
          headers: {
            Authorization: 'ApiKey test-api-key',
            'Content-Type': 'application/json',
          },
        }
      )
    })

    it('should throw error on 404', async () => {
      mockedAxios.get.mockRejectedValue({
        isAxiosError: true,
        response: { status: 404 },
      })
      mockedAxios.isAxiosError.mockReturnValue(true)

      const { registerTools } = await import('../../../tools/projects.js')
      const mockServer = {
        tool: vi.fn(),
      } as any

      registerTools(mockServer)
      const getProjectHandler = mockServer.tool.mock.calls.find(
        (call: any) => call[0] === 'get_project'
      )?.[3]

      await expect(getProjectHandler({ projectCode: 'NOTFOUND' })).rejects.toThrow(
        "Project with code 'NOTFOUND' not found."
      )
    })

    it('should throw validation error on invalid response', async () => {
      mockedAxios.get.mockResolvedValue({ data: { id: 'test' } })

      const { registerTools } = await import('../../../tools/projects.js')
      const mockServer = {
        tool: vi.fn(),
      } as any

      registerTools(mockServer)
      const getProjectHandler = mockServer.tool.mock.calls.find(
        (call: any) => call[0] === 'get_project'
      )?.[3]

      await expect(getProjectHandler({ projectCode: 'TST' })).rejects.toThrow(
        'Invalid project data: missing required fields (id or title)'
      )
    })
  })

  describe('list_projects', () => {
    it('should return array of projects on success', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockProjects })

      const { registerTools } = await import('../../../tools/projects.js')
      const mockServer = {
        tool: vi.fn(),
      } as any

      registerTools(mockServer)
      const listProjectsHandler = mockServer.tool.mock.calls.find(
        (call: any) => call[0] === 'list_projects'
      )?.[3]

      const response = await listProjectsHandler()

      expect(response).toEqual({
        content: [{ type: 'text', text: JSON.stringify(mockProjects) }],
      })
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://test.qasphere.com/api/public/v0/project',
        {
          headers: {
            Authorization: 'ApiKey test-api-key',
            'Content-Type': 'application/json',
          },
        }
      )
    })

    it('should return empty array when no projects', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockProjectsEmpty })

      const { registerTools } = await import('../../../tools/projects.js')
      const mockServer = {
        tool: vi.fn(),
      } as any

      registerTools(mockServer)
      const listProjectsHandler = mockServer.tool.mock.calls.find(
        (call: any) => call[0] === 'list_projects'
      )?.[3]

      const response = await listProjectsHandler()

      expect(response).toEqual({
        content: [{ type: 'text', text: JSON.stringify(mockProjectsEmpty) }],
      })
    })

    it('should throw validation error when response is not an array', async () => {
      mockedAxios.get.mockResolvedValue({ data: { projects: 'not-an-array' } })

      const { registerTools } = await import('../../../tools/projects.js')
      const mockServer = {
        tool: vi.fn(),
      } as any

      registerTools(mockServer)
      const listProjectsHandler = mockServer.tool.mock.calls.find(
        (call: any) => call[0] === 'list_projects'
      )?.[3]

      await expect(listProjectsHandler()).rejects.toThrow(
        'Invalid response: expected an array of projects'
      )
    })
  })
})
