import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { MockedAxios } from '../../setup.js'
import axios from 'axios'
import { mockFolders, mockUpsertFoldersResponse } from '../../fixtures/folders.js'

vi.mock('axios')
vi.mock('../../../config.js', () => ({
  QASPHERE_TENANT_URL: 'https://test.qasphere.com',
  QASPHERE_API_KEY: 'test-api-key',
}))

const mockedAxios = axios as unknown as MockedAxios

describe('Folder Tools Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('list_folders', () => {
    it('should return folder list on success', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockFolders })

      const { registerTools } = await import('../../../tools/folders.js')
      const mockServer = {
        tool: vi.fn(),
      } as any

      registerTools(mockServer)
      const handler = mockServer.tool.mock.calls.find(
        (call: any) => call[0] === 'list_folders'
      )?.[3]

      const response = await handler({ projectCode: 'BDI' })

      expect(response.content[0].type).toBe('text')
      const result = JSON.parse(response.content[0].text)
      expect(result.total).toBe(2)
      expect(result.data.length).toBe(2)
    })

    it('should pass correct query params with pagination', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockFolders })

      const { registerTools } = await import('../../../tools/folders.js')
      const mockServer = {
        tool: vi.fn(),
      } as any

      registerTools(mockServer)
      const handler = mockServer.tool.mock.calls.find(
        (call: any) => call[0] === 'list_folders'
      )?.[3]

      await handler({
        projectCode: 'BDI',
        page: 2,
        limit: 50,
        sortField: 'title',
        sortOrder: 'asc',
      })

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://test.qasphere.com/api/public/v0/project/BDI/tcase/folders',
        expect.objectContaining({
          params: expect.any(URLSearchParams),
        })
      )
    })

    it('should throw error on 404', async () => {
      mockedAxios.get.mockRejectedValue({
        isAxiosError: true,
        response: { status: 404, data: {} },
        message: 'Not found',
      })
      mockedAxios.isAxiosError.mockReturnValue(true)

      const { registerTools } = await import('../../../tools/folders.js')
      const mockServer = {
        tool: vi.fn(),
      } as any

      registerTools(mockServer)
      const handler = mockServer.tool.mock.calls.find(
        (call: any) => call[0] === 'list_folders'
      )?.[3]

      await expect(handler({ projectCode: 'NOTFOUND' })).rejects.toThrow(
        "Project with code 'NOTFOUND' not found."
      )
    })
  })

  describe('upsert_folders', () => {
    it('should return folder IDs on success', async () => {
      mockedAxios.post.mockResolvedValue({ data: { ids: mockUpsertFoldersResponse } })

      const { registerTools } = await import('../../../tools/folders.js')
      const mockServer = {
        tool: vi.fn(),
      } as any

      registerTools(mockServer)
      const handler = mockServer.tool.mock.calls.find(
        (call: any) => call[0] === 'upsert_folders'
      )?.[3]

      const response = await handler({
        projectCode: 'BDI',
        folders: [{ path: ['Folder1'] }, { path: ['Folder1', 'Folder2'] }],
      })

      expect(response.content[0].type).toBe('text')
      const result = JSON.parse(response.content[0].text)
      expect(result.ids).toEqual(mockUpsertFoldersResponse)
    })

    it('should throw validation error when folder name contains slash', async () => {
      const { registerTools } = await import('../../../tools/folders.js')
      const mockServer = {
        tool: vi.fn(),
      } as any

      registerTools(mockServer)
      const handler = mockServer.tool.mock.calls.find(
        (call: any) => call[0] === 'upsert_folders'
      )?.[3]

      await expect(
        handler({
          projectCode: 'BDI',
          folders: [{ path: ['Folder/Name'] }],
        })
      ).rejects.toThrow('Folder names cannot contain forward slash (/) characters')
    })

    it('should throw validation error when folder name is empty', async () => {
      const { registerTools } = await import('../../../tools/folders.js')
      const mockServer = {
        tool: vi.fn(),
      } as any

      registerTools(mockServer)
      const handler = mockServer.tool.mock.calls.find(
        (call: any) => call[0] === 'upsert_folders'
      )?.[3]

      await expect(
        handler({
          projectCode: 'BDI',
          folders: [{ path: ['  '] }],
        })
      ).rejects.toThrow('Folder names cannot be empty strings')
    })

    it('should throw error on 400', async () => {
      mockedAxios.post.mockRejectedValue({
        isAxiosError: true,
        response: { status: 400, data: { message: 'Invalid request' } },
        message: 'Bad request',
      })
      mockedAxios.isAxiosError.mockReturnValue(true)

      const { registerTools } = await import('../../../tools/folders.js')
      const mockServer = {
        tool: vi.fn(),
      } as any

      registerTools(mockServer)
      const handler = mockServer.tool.mock.calls.find(
        (call: any) => call[0] === 'upsert_folders'
      )?.[3]

      await expect(
        handler({
          projectCode: 'BDI',
          folders: [{ path: ['Valid'] }],
        })
      ).rejects.toThrow('Invalid request')
    })
  })
})
