import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { MockedAxios } from '../../setup.js'
import axios from 'axios'
import { mockCustomFields } from '../../fixtures/customFields.js'

vi.mock('axios')
vi.mock('../../../config.js', () => ({
  QASPHERE_TENANT_URL: 'https://test.qasphere.com',
  QASPHERE_API_KEY: 'test-api-key',
}))

const mockedAxios = axios as unknown as MockedAxios

describe('Custom Fields Tools Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('list_custom_fields', () => {
    it('should return field definitions on success', async () => {
      mockedAxios.get.mockResolvedValue({ data: { customFields: mockCustomFields.data } })

      const { registerTools } = await import('../../../tools/customFields.js')
      const mockServer = {
        tool: vi.fn(),
      } as any

      registerTools(mockServer)
      const handler = mockServer.tool.mock.calls.find(
        (call: any) => call[0] === 'list_custom_fields'
      )?.[3]

      const response = await handler({ projectCode: 'BDI' })

      expect(response.content[0].type).toBe('text')
      const result = JSON.parse(response.content[0].text)
      expect(result).toHaveLength(2)
      expect(result[0].systemName).toBe('test_environment')
    })

    it('should include dropdown options when present', async () => {
      mockedAxios.get.mockResolvedValue({ data: { customFields: mockCustomFields.data } })

      const { registerTools } = await import('../../../tools/customFields.js')
      const mockServer = {
        tool: vi.fn(),
      } as any

      registerTools(mockServer)
      const handler = mockServer.tool.mock.calls.find(
        (call: any) => call[0] === 'list_custom_fields'
      )?.[3]

      const response = await handler({ projectCode: 'BDI' })

      const result = JSON.parse(response.content[0].text)
      const dropdownField = result.find((f: any) => f.type === 'dropdown')
      expect(dropdownField.options).toHaveLength(3)
      expect(dropdownField.options[0]).toHaveProperty('value')
      expect(dropdownField.options[0]).toHaveProperty('label')
    })

    it('should throw error on 404', async () => {
      mockedAxios.get.mockRejectedValue({
        isAxiosError: true,
        response: { status: 404 },
        message: 'Not found',
      })
      mockedAxios.isAxiosError.mockReturnValue(true)

      const { registerTools } = await import('../../../tools/customFields.js')
      const mockServer = {
        tool: vi.fn(),
      } as any

      registerTools(mockServer)
      const handler = mockServer.tool.mock.calls.find(
        (call: any) => call[0] === 'list_custom_fields'
      )?.[3]

      await expect(handler({ projectCode: 'NOTFOUND' })).rejects.toThrow(
        "Project with code 'NOTFOUND' not found."
      )
    })

    it('should throw error on 401', async () => {
      mockedAxios.get.mockRejectedValue({
        isAxiosError: true,
        response: { status: 401 },
        message: 'Unauthorized',
      })
      mockedAxios.isAxiosError.mockReturnValue(true)

      const { registerTools } = await import('../../../tools/customFields.js')
      const mockServer = {
        tool: vi.fn(),
      } as any

      registerTools(mockServer)
      const handler = mockServer.tool.mock.calls.find(
        (call: any) => call[0] === 'list_custom_fields'
      )?.[3]

      await expect(handler({ projectCode: 'BDI' })).rejects.toThrow('Invalid or missing API key')
    })
  })
})
