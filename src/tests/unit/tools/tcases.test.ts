import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { MockedAxios } from '../../setup.js'
import axios from 'axios'
import {
  mockTestCase,
  mockTestCasesList,
  mockTestCasesEmpty,
  mockCreateTestCaseResponse,
} from '../../fixtures/testcases.js'

vi.mock('axios')
vi.mock('../../../config.js', () => ({
  QASPHERE_TENANT_URL: 'https://test.qasphere.com',
  QASPHERE_API_KEY: 'test-api-key',
}))

const mockedAxios = axios as unknown as MockedAxios

describe('Test Case Tools Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('get_test_case', () => {
    it('should return test case with renamed keys on success', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockTestCase })

      const { registerTools } = await import('../../../tools/tcases.js')
      const mockServer = {
        tool: vi.fn(),
      } as any

      registerTools(mockServer)
      const handler = mockServer.tool.mock.calls.find(
        (call: any) => call[0] === 'get_test_case'
      )?.[3]

      const response = await handler({ marker: 'BDI-123' })

      expect(response.content[0].type).toBe('text')
      const result = JSON.parse(response.content[0].text)
      expect(result.steps[0]).toHaveProperty('action')
      expect(result.steps[0]).toHaveProperty('expected_result')
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://test.qasphere.com/api/public/v0/project/BDI/tcase/123',
        expect.objectContaining({
          headers: {
            Authorization: 'ApiKey test-api-key',
            'Content-Type': 'application/json',
          },
        })
      )
    })

    it('should throw error on 404', async () => {
      mockedAxios.get.mockRejectedValue({
        isAxiosError: true,
        response: { status: 404, data: { message: 'Not found' } },
        message: 'Request failed',
      })
      mockedAxios.isAxiosError.mockReturnValue(true)

      const { registerTools } = await import('../../../tools/tcases.js')
      const mockServer = {
        tool: vi.fn(),
      } as any

      registerTools(mockServer)
      const handler = mockServer.tool.mock.calls.find(
        (call: any) => call[0] === 'get_test_case'
      )?.[3]

      await expect(handler({ marker: 'BDI-999' })).rejects.toThrow('Failed to fetch test case')
    })
  })

  describe('list_test_cases', () => {
    it('should return paginated list on success', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockTestCasesList })

      const { registerTools } = await import('../../../tools/tcases.js')
      const mockServer = {
        tool: vi.fn(),
      } as any

      registerTools(mockServer)
      const handler = mockServer.tool.mock.calls.find(
        (call: any) => call[0] === 'list_test_cases'
      )?.[3]

      const response = await handler({ projectCode: 'BDI' })

      expect(response.content[0].type).toBe('text')
      const result = JSON.parse(response.content[0].text)
      expect(result.total).toBe(2)
      expect(result.page).toBe(1)
      expect(result.limit).toBe(20)
    })

    it('should pass correct query params with filters', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockTestCasesList })

      const { registerTools } = await import('../../../tools/tcases.js')
      const mockServer = {
        tool: vi.fn(),
      } as any

      registerTools(mockServer)
      const handler = mockServer.tool.mock.calls.find(
        (call: any) => call[0] === 'list_test_cases'
      )?.[3]

      await handler({
        projectCode: 'BDI',
        page: 2,
        limit: 50,
        priorities: ['high', 'medium'],
        tags: [1, 2],
        folders: [10],
      })

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://test.qasphere.com/api/public/v0/project/BDI/tcase',
        expect.objectContaining({
          params: expect.any(URLSearchParams),
        })
      )
    })

    it('should return empty data array when no results', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockTestCasesEmpty })

      const { registerTools } = await import('../../../tools/tcases.js')
      const mockServer = {
        tool: vi.fn(),
      } as any

      registerTools(mockServer)
      const handler = mockServer.tool.mock.calls.find(
        (call: any) => call[0] === 'list_test_cases'
      )?.[3]

      const response = await handler({ projectCode: 'BDI' })

      const result = JSON.parse(response.content[0].text)
      expect(result.data).toEqual([])
      expect(result.total).toBe(0)
    })
  })

  describe('create_test_case', () => {
    it('should return created test case on success', async () => {
      mockedAxios.post.mockResolvedValue({ data: mockCreateTestCaseResponse })

      const { registerTools } = await import('../../../tools/tcases.js')
      const mockServer = {
        tool: vi.fn(),
      } as any

      registerTools(mockServer)
      const handler = mockServer.tool.mock.calls.find(
        (call: any) => call[0] === 'create_test_case'
      )?.[3]

      const response = await handler({
        projectId: 'BDI',
        title: 'New Test',
        type: 'standalone',
        folderId: 1,
        priority: 'high',
      })

      expect(response.content[0].type).toBe('text')
      const result = JSON.parse(response.content[0].text)
      expect(result.tcase.id).toBe('uuid-new')
    })

    it('should throw validation error on 400', async () => {
      mockedAxios.post.mockRejectedValue({
        isAxiosError: true,
        response: { status: 400, data: { message: 'Invalid data' } },
        message: 'Request failed',
      })
      mockedAxios.isAxiosError.mockReturnValue(true)

      const { registerTools } = await import('../../../tools/tcases.js')
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
          title: '',
          type: 'standalone',
          folderId: 1,
          priority: 'high',
        })
      ).rejects.toThrow('Invalid request data')
    })

    it('should throw auth error on 401', async () => {
      mockedAxios.post.mockRejectedValue({
        isAxiosError: true,
        response: { status: 401, data: {} },
        message: 'Unauthorized',
      })
      mockedAxios.isAxiosError.mockReturnValue(true)

      const { registerTools } = await import('../../../tools/tcases.js')
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
      ).rejects.toThrow('Invalid or missing API key')
    })

    it('should throw permission error on 403', async () => {
      mockedAxios.post.mockRejectedValue({
        isAxiosError: true,
        response: { status: 403, data: {} },
        message: 'Forbidden',
      })
      mockedAxios.isAxiosError.mockReturnValue(true)

      const { registerTools } = await import('../../../tools/tcases.js')
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

  describe('update_test_case', () => {
    it('should return success message on update', async () => {
      mockedAxios.patch.mockResolvedValue({ data: { message: 'Test case updated successfully' } })

      const { registerTools } = await import('../../../tools/tcases.js')
      const mockServer = {
        tool: vi.fn(),
      } as any

      registerTools(mockServer)
      const handler = mockServer.tool.mock.calls.find(
        (call: any) => call[0] === 'update_test_case'
      )?.[3]

      const response = await handler({
        projectId: 'BDI',
        tcaseOrLegacyId: 'uuid-456',
        title: 'Updated Title',
      })

      expect(response.content[0].type).toBe('text')
      const result = JSON.parse(response.content[0].text)
      expect(result.message).toBe('Test case updated successfully')
    })

    it('should throw error on 404', async () => {
      mockedAxios.patch.mockRejectedValue({
        isAxiosError: true,
        response: { status: 404, data: { message: 'Not found' } },
        message: 'Not found',
      })
      mockedAxios.isAxiosError.mockReturnValue(true)

      const { registerTools } = await import('../../../tools/tcases.js')
      const mockServer = {
        tool: vi.fn(),
      } as any

      registerTools(mockServer)
      const handler = mockServer.tool.mock.calls.find(
        (call: any) => call[0] === 'update_test_case'
      )?.[3]

      await expect(
        handler({
          projectId: 'BDI',
          tcaseOrLegacyId: 'nonexistent',
          title: 'Updated',
        })
      ).rejects.toThrow('Project or test case not found')
    })
  })
})
