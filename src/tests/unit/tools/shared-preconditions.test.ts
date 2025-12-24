import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { MockedAxios } from '../../setup.js'
import axios from 'axios'
import {
  mockSharedPreconditions,
  mockSharedPrecondition,
  mockSharedPreconditionsWithCount,
} from '../../fixtures/sharedPreconditions.js'

vi.mock('axios')
vi.mock('../../../config.js', () => ({
  QASPHERE_TENANT_URL: 'https://test.qasphere.com',
  QASPHERE_API_KEY: 'test-api-key',
}))

const mockedAxios = axios as unknown as MockedAxios

describe('Shared Preconditions Tools Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('list_shared_preconditions', () => {
    it('should return shared preconditions on success', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockSharedPreconditions })

      const { registerTools } = await import('../../../tools/shared-preconditions.js')
      const mockServer = {
        tool: vi.fn(),
      } as any

      registerTools(mockServer)
      const handler = mockServer.tool.mock.calls.find(
        (call: any) => call[0] === 'list_shared_preconditions'
      )?.[3]

      const response = await handler({ projectCode: 'BDI' })

      expect(response.content[0].type).toBe('text')
      const result = JSON.parse(response.content[0].text)
      expect(result).toHaveLength(2)
      expect(result[0].id).toBe(1)
      expect(result[0].title).toBe('User is logged in')
    })

    it('should include test case counts when requested', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockSharedPreconditionsWithCount })

      const { registerTools } = await import('../../../tools/shared-preconditions.js')
      const mockServer = {
        tool: vi.fn(),
      } as any

      registerTools(mockServer)
      const handler = mockServer.tool.mock.calls.find(
        (call: any) => call[0] === 'list_shared_preconditions'
      )?.[3]

      const response = await handler({ projectCode: 'BDI', include: 'tcaseCount' })

      const result = JSON.parse(response.content[0].text)
      expect(result[0]).toHaveProperty('tcaseCount')
      expect(result[0].tcaseCount).toBe(15)
    })

    it('should throw error when sortOrder is specified without sortField', async () => {
      const { registerTools } = await import('../../../tools/shared-preconditions.js')
      const mockServer = {
        tool: vi.fn(),
      } as any

      registerTools(mockServer)
      const handler = mockServer.tool.mock.calls.find(
        (call: any) => call[0] === 'list_shared_preconditions'
      )?.[3]

      await expect(handler({ projectCode: 'BDI', sortOrder: 'asc' })).rejects.toThrow(
        'sortOrder can only be specified when sortField is provided.'
      )
    })
  })

  describe('get_shared_precondition', () => {
    it('should return precondition details on success', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockSharedPrecondition })

      const { registerTools } = await import('../../../tools/shared-preconditions.js')
      const mockServer = {
        tool: vi.fn(),
      } as any

      registerTools(mockServer)
      const handler = mockServer.tool.mock.calls.find(
        (call: any) => call[0] === 'get_shared_precondition'
      )?.[3]

      const response = await handler({ projectCode: 'BDI', sharedPreconditionId: 1 })

      expect(response.content[0].type).toBe('text')
      const result = JSON.parse(response.content[0].text)
      expect(result.id).toBe(1)
      expect(result.title).toBe('User is logged in')
      expect(result.text).toContain('authenticated')
    })

    it('should throw error on 404', async () => {
      mockedAxios.get.mockRejectedValue({
        isAxiosError: true,
        response: { status: 404 },
        message: 'Not found',
      })
      mockedAxios.isAxiosError.mockReturnValue(true)

      const { registerTools } = await import('../../../tools/shared-preconditions.js')
      const mockServer = {
        tool: vi.fn(),
      } as any

      registerTools(mockServer)
      const handler = mockServer.tool.mock.calls.find(
        (call: any) => call[0] === 'get_shared_precondition'
      )?.[3]

      await expect(handler({ projectCode: 'BDI', sharedPreconditionId: 999 })).rejects.toThrow(
        'Project or shared precondition not found'
      )
    })
  })
})
