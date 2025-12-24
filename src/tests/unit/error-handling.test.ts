import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { MockedAxios } from '../setup.js'
import axios from 'axios'

vi.mock('axios')
vi.mock('../../config.js', () => ({
  QASPHERE_TENANT_URL: 'https://test.qasphere.com',
  QASPHERE_API_KEY: 'test-api-key',
}))

const mockedAxios = axios as unknown as MockedAxios

describe('Error Handling Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Network errors', () => {
    it('should throw network error on connection refused', async () => {
      mockedAxios.get.mockRejectedValue({
        isAxiosError: true,
        code: 'ECONNREFUSED',
        message: 'connect ECONNREFUSED',
      })
      mockedAxios.isAxiosError.mockReturnValue(true)

      const { registerTools } = await import('../../tools/projects.js')
      const mockServer = {
        tool: vi.fn(),
      } as any

      registerTools(mockServer)
      const handler = mockServer.tool.mock.calls.find((call: any) => call[0] === 'get_project')?.[3]

      await expect(handler({ projectCode: 'BDI' })).rejects.toThrow('Failed to fetch project')
    })

    it('should throw timeout error on request timeout', async () => {
      mockedAxios.get.mockRejectedValue({
        isAxiosError: true,
        code: 'ECONNABORTED',
        message: 'timeout of 5000ms exceeded',
      })
      mockedAxios.isAxiosError.mockReturnValue(true)

      const { registerTools } = await import('../../tools/projects.js')
      const mockServer = {
        tool: vi.fn(),
      } as any

      registerTools(mockServer)
      const handler = mockServer.tool.mock.calls.find(
        (call: any) => call[0] === 'list_projects'
      )?.[3]

      await expect(handler()).rejects.toThrow('Failed to fetch projects')
    })
  })

  describe('Server errors', () => {
    it('should throw server error message on 500', async () => {
      mockedAxios.post.mockRejectedValue({
        isAxiosError: true,
        response: {
          status: 500,
          data: { message: 'Internal Server Error' },
        },
        message: 'Server error',
      })
      mockedAxios.isAxiosError.mockReturnValue(true)

      const { registerTools } = await import('../../tools/tcases.js')
      const mockServer = {
        tool: vi.fn(),
      } as any

      registerTools(mockServer)
      const handler = mockServer.tool.mock.calls.find(
        (call: any) => call[0] === 'create_test_case'
      )?.[3]

      await expect(
        handler({
          projectId: 'BDI',
          title: 'Test',
          type: 'standalone',
          folderId: 1,
          priority: 'high',
        })
      ).rejects.toThrow('Internal server error while creating test case')
    })
  })

  describe('Invalid JSON response', () => {
    it('should throw parsing error on malformed response', async () => {
      mockedAxios.get.mockRejectedValue({
        isAxiosError: true,
        message: 'Unexpected token < in JSON at position 0',
      })
      mockedAxios.isAxiosError.mockReturnValue(true)

      const { registerTools } = await import('../../tools/projects.js')
      const mockServer = {
        tool: vi.fn(),
      } as any

      registerTools(mockServer)
      const handler = mockServer.tool.mock.calls.find((call: any) => call[0] === 'get_project')?.[3]

      await expect(handler({ projectCode: 'BDI' })).rejects.toThrow()
    })
  })

  describe('Authentication errors', () => {
    it('should throw auth error on 401', async () => {
      mockedAxios.get.mockRejectedValue({
        isAxiosError: true,
        response: {
          status: 401,
          data: {},
        },
        message: 'Unauthorized',
      })
      mockedAxios.isAxiosError.mockReturnValue(true)

      const { registerTools } = await import('../../tools/customFields.js')
      const mockServer = {
        tool: vi.fn(),
      } as any

      registerTools(mockServer)
      const handler = mockServer.tool.mock.calls.find(
        (call: any) => call[0] === 'list_custom_fields'
      )?.[3]

      await expect(handler({ projectCode: 'BDI' })).rejects.toThrow('Invalid or missing API key')
    })

    it('should throw permission error on 403', async () => {
      mockedAxios.post.mockRejectedValue({
        isAxiosError: true,
        response: {
          status: 403,
          data: {},
        },
        message: 'Forbidden',
      })
      mockedAxios.isAxiosError.mockReturnValue(true)

      const { registerTools } = await import('../../tools/tcases.js')
      const mockServer = {
        tool: vi.fn(),
      } as any

      registerTools(mockServer)
      const handler = mockServer.tool.mock.calls.find(
        (call: any) => call[0] === 'create_test_case'
      )?.[3]

      await expect(
        handler({
          projectId: 'BDI',
          title: 'Test',
          type: 'standalone',
          folderId: 1,
          priority: 'high',
        })
      ).rejects.toThrow('Insufficient permissions or suspended tenant')
    })
  })
})
