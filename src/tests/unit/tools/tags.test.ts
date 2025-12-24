import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { MockedAxios } from '../../setup.js'
import axios from 'axios'
import { mockTags, mockTagsEmpty } from '../../fixtures/tags.js'

vi.mock('axios')
vi.mock('../../../config.js', () => ({
  QASPHERE_TENANT_URL: 'https://test.qasphere.com',
  QASPHERE_API_KEY: 'test-api-key',
}))

const mockedAxios = axios as unknown as MockedAxios

describe('Tags Tools Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('list_test_cases_tags', () => {
    it('should return tag list on success', async () => {
      mockedAxios.get.mockResolvedValue({ data: { tags: mockTags.data } })

      const { registerTools } = await import('../../../tools/tags.js')
      const mockServer = {
        tool: vi.fn(),
      } as any

      registerTools(mockServer)
      const handler = mockServer.tool.mock.calls.find(
        (call: any) => call[0] === 'list_test_cases_tags'
      )?.[3]

      const response = await handler({ projectCode: 'BDI' })

      expect(response.content[0].type).toBe('text')
      const result = JSON.parse(response.content[0].text)
      expect(result.tags).toHaveLength(2)
      expect(result.tags[0].id).toBe(1)
      expect(result.tags[0].title).toBe('smoke')
    })

    it('should return empty array when no tags', async () => {
      mockedAxios.get.mockResolvedValue({ data: { tags: [] } })

      const { registerTools } = await import('../../../tools/tags.js')
      const mockServer = {
        tool: vi.fn(),
      } as any

      registerTools(mockServer)
      const handler = mockServer.tool.mock.calls.find(
        (call: any) => call[0] === 'list_test_cases_tags'
      )?.[3]

      const response = await handler({ projectCode: 'BDI' })

      const result = JSON.parse(response.content[0].text)
      expect(result.tags).toEqual([])
    })

    it('should throw error on 404', async () => {
      mockedAxios.get.mockRejectedValue({
        isAxiosError: true,
        response: { status: 404 },
        message: 'Not found',
      })
      mockedAxios.isAxiosError.mockReturnValue(true)

      const { registerTools } = await import('../../../tools/tags.js')
      const mockServer = {
        tool: vi.fn(),
      } as any

      registerTools(mockServer)
      const handler = mockServer.tool.mock.calls.find(
        (call: any) => call[0] === 'list_test_cases_tags'
      )?.[3]

      await expect(handler({ projectCode: 'NOTFOUND' })).rejects.toThrow(
        "Project with identifier 'NOTFOUND' not found."
      )
    })
  })
})
