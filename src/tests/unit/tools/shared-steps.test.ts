import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { MockedAxios } from '../../setup.js'
import axios from 'axios'
import {
  mockSharedSteps,
  mockSharedStep,
  mockSharedStepsWithCount,
} from '../../fixtures/sharedSteps.js'

vi.mock('axios')
vi.mock('../../../config.js', () => ({
  QASPHERE_TENANT_URL: 'https://test.qasphere.com',
  QASPHERE_API_KEY: 'test-api-key',
}))

const mockedAxios = axios as unknown as MockedAxios

describe('Shared Steps Tools Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('list_shared_steps', () => {
    it('should return shared steps on success', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockSharedSteps })

      const { registerTools } = await import('../../../tools/shared-steps.js')
      const mockServer = {
        tool: vi.fn(),
      } as any

      registerTools(mockServer)
      const handler = mockServer.tool.mock.calls.find(
        (call: any) => call[0] === 'list_shared_steps'
      )?.[3]

      const response = await handler({ projectCode: 'BDI' })

      expect(response.content[0].type).toBe('text')
      const result = JSON.parse(response.content[0].text)
      expect(result.sharedSteps).toHaveLength(2)
      expect(result.sharedSteps[0].id).toBe(1)
      expect(result.sharedSteps[0].title).toBe('Login Step')
    })

    it('should include test case counts when requested', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockSharedStepsWithCount })

      const { registerTools } = await import('../../../tools/shared-steps.js')
      const mockServer = {
        tool: vi.fn(),
      } as any

      registerTools(mockServer)
      const handler = mockServer.tool.mock.calls.find(
        (call: any) => call[0] === 'list_shared_steps'
      )?.[3]

      const response = await handler({ projectCode: 'BDI', include: 'tcaseCount' })

      const result = JSON.parse(response.content[0].text)
      expect(result.sharedSteps[0]).toHaveProperty('tcaseCount')
      expect(result.sharedSteps[0].tcaseCount).toBe(10)
    })

    it('should throw error when sortOrder is specified without sortField', async () => {
      const { registerTools } = await import('../../../tools/shared-steps.js')
      const mockServer = {
        tool: vi.fn(),
      } as any

      registerTools(mockServer)
      const handler = mockServer.tool.mock.calls.find(
        (call: any) => call[0] === 'list_shared_steps'
      )?.[3]

      await expect(handler({ projectCode: 'BDI', sortOrder: 'asc' })).rejects.toThrow(
        'sortOrder can only be specified when sortField is provided.'
      )
    })
  })

  describe('get_shared_step', () => {
    it('should return step details on success', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockSharedStep })

      const { registerTools } = await import('../../../tools/shared-steps.js')
      const mockServer = {
        tool: vi.fn(),
      } as any

      registerTools(mockServer)
      const handler = mockServer.tool.mock.calls.find(
        (call: any) => call[0] === 'get_shared_step'
      )?.[3]

      const response = await handler({ projectCode: 'BDI', sharedStepId: 1 })

      expect(response.content[0].type).toBe('text')
      const result = JSON.parse(response.content[0].text)
      expect(result.id).toBe(1)
      expect(result.title).toBe('Login Step')
      expect(result.subSteps).toHaveLength(2)
    })

    it('should throw error on 404', async () => {
      mockedAxios.get.mockRejectedValue({
        isAxiosError: true,
        response: { status: 404 },
        message: 'Not found',
      })
      mockedAxios.isAxiosError.mockReturnValue(true)

      const { registerTools } = await import('../../../tools/shared-steps.js')
      const mockServer = {
        tool: vi.fn(),
      } as any

      registerTools(mockServer)
      const handler = mockServer.tool.mock.calls.find(
        (call: any) => call[0] === 'get_shared_step'
      )?.[3]

      await expect(handler({ projectCode: 'BDI', sharedStepId: 999 })).rejects.toThrow(
        'Project or shared step not found'
      )
    })
  })
})
