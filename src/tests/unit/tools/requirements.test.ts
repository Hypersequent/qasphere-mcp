import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { MockedAxios } from '../../setup.js'
import axios from 'axios'
import { mockRequirements, mockRequirementsWithCount } from '../../fixtures/requirements.js'

vi.mock('axios')
vi.mock('../../../config.js', () => ({
  QASPHERE_TENANT_URL: 'https://test.qasphere.com',
  QASPHERE_API_KEY: 'test-api-key',
}))

const mockedAxios = axios as unknown as MockedAxios

describe('Requirements Tools Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('list_requirements', () => {
    it('should return requirements on success', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockRequirements })

      const { registerTools } = await import('../../../tools/requirements.js')
      const mockServer = {
        tool: vi.fn(),
      } as any

      registerTools(mockServer)
      const handler = mockServer.tool.mock.calls.find(
        (call: any) => call[0] === 'list_requirements'
      )?.[3]

      const response = await handler({ projectCode: 'BDI' })

      expect(response.content[0].type).toBe('text')
      const result = JSON.parse(response.content[0].text)
      expect(result.requirements).toHaveLength(2)
      expect(result.requirements[0].id).toBe('req-1')
      expect(result.requirements[0].text).toBe('User Authentication')
    })

    it('should include test case counts when requested', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockRequirementsWithCount })

      const { registerTools } = await import('../../../tools/requirements.js')
      const mockServer = {
        tool: vi.fn(),
      } as any

      registerTools(mockServer)
      const handler = mockServer.tool.mock.calls.find(
        (call: any) => call[0] === 'list_requirements'
      )?.[3]

      const response = await handler({ projectCode: 'BDI', include: 'tcaseCount' })

      const result = JSON.parse(response.content[0].text)
      expect(result.requirements[0]).toHaveProperty('tcaseCount')
      expect(result.requirements[0].tcaseCount).toBe(5)
    })

    it('should pass sort parameters correctly', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockRequirements })

      const { registerTools } = await import('../../../tools/requirements.js')
      const mockServer = {
        tool: vi.fn(),
      } as any

      registerTools(mockServer)
      const handler = mockServer.tool.mock.calls.find(
        (call: any) => call[0] === 'list_requirements'
      )?.[3]

      await handler({ projectCode: 'BDI', sortField: 'text', sortOrder: 'asc' })

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://test.qasphere.com/api/public/v0/project/BDI/requirement',
        expect.objectContaining({
          params: expect.any(URLSearchParams),
        })
      )
    })

    it('should throw error when sortOrder is specified without sortField', async () => {
      const { registerTools } = await import('../../../tools/requirements.js')
      const mockServer = {
        tool: vi.fn(),
      } as any

      registerTools(mockServer)
      const handler = mockServer.tool.mock.calls.find(
        (call: any) => call[0] === 'list_requirements'
      )?.[3]

      await expect(handler({ projectCode: 'BDI', sortOrder: 'asc' })).rejects.toThrow(
        'sortOrder can only be specified when sortField is provided.'
      )
    })

    it('should throw error on 404', async () => {
      mockedAxios.get.mockRejectedValue({
        isAxiosError: true,
        response: { status: 404 },
        message: 'Not found',
      })
      mockedAxios.isAxiosError.mockReturnValue(true)

      const { registerTools } = await import('../../../tools/requirements.js')
      const mockServer = {
        tool: vi.fn(),
      } as any

      registerTools(mockServer)
      const handler = mockServer.tool.mock.calls.find(
        (call: any) => call[0] === 'list_requirements'
      )?.[3]

      await expect(handler({ projectCode: 'NOTFOUND' })).rejects.toThrow(
        "Project with code 'NOTFOUND' not found."
      )
    })
  })
})
