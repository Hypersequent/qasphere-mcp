import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp'
import axios from 'axios'
import { z } from 'zod'
import type {
  TestFolderListResponse,
  BulkUpsertFoldersRequest,
  BulkUpsertFoldersResponse,
} from '../types'
import { QASPHERE_API_KEY, QASPHERE_TENANT_URL } from '../config'

export const registerTools = (server: McpServer) => {
  server.tool(
    'list_test_cases_folders',
    'List folders for test cases within a specific QA Sphere project. Allows pagination and sorting.',
    {
      projectCode: z
        .string()
        .regex(/^[A-Z0-9]+$/, 'Project code must be in format PROJECT_CODE (e.g., BDI)')
        .describe('Project code identifier (e.g., BDI)'),
      page: z.number().optional().describe('Page number for pagination'),
      limit: z.number().optional().default(100).describe('Number of items per page'),
      sortField: z
        .enum(['id', 'project_id', 'title', 'pos', 'parent_id', 'created_at', 'updated_at'])
        .optional()
        .describe('Field to sort results by'),
      sortOrder: z
        .enum(['asc', 'desc'])
        .optional()
        .describe('Sort direction (ascending or descending)'),
    },
    async ({ projectCode, page, limit = 100, sortField, sortOrder }) => {
      try {
        // Build query parameters
        const params = new URLSearchParams()

        if (page !== undefined) params.append('page', page.toString())
        if (limit !== undefined) params.append('limit', limit.toString())
        if (sortField) params.append('sortField', sortField)
        if (sortOrder) params.append('sortOrder', sortOrder)

        const url = `${QASPHERE_TENANT_URL}/api/public/v0/project/${projectCode}/tcase/folders`

        const response = await axios.get<TestFolderListResponse>(url, {
          params,
          headers: {
            Authorization: `ApiKey ${QASPHERE_API_KEY}`,
            'Content-Type': 'application/json',
          },
        })

        const folderList = response.data

        // Basic validation of response
        if (!folderList || !Array.isArray(folderList.data)) {
          throw new Error('Invalid response: expected a list of folders')
        }

        // check for other fields from TestFolderListResponse
        if (
          folderList.total === undefined ||
          folderList.page === undefined ||
          folderList.limit === undefined
        ) {
          throw new Error('Invalid response: missing required fields (total, page, or limit)')
        }

        // if array is non-empty check if object has id and title fields
        if (folderList.data.length > 0) {
          const firstFolder = folderList.data[0]
          if (firstFolder.id === undefined || !firstFolder.title) {
            throw new Error('Invalid folder data: missing required fields (id or title)')
          }
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(folderList), // Use standard stringify, no special mapping needed for folders
            },
          ],
        }
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 404) {
            throw new Error(`Project with code '${projectCode}' not found.`)
          }
          throw new Error(
            `Failed to fetch test case folders: ${error.response?.data?.message || error.message}`
          )
        }
        throw error
      }
    }
  )

  server.tool(
    'bulk_upsert_folders',
    "Creates or updates multiple folders in a single request using folder path hierarchies. Automatically creates nested folder structures and updates existing folders' comments.",
    {
      projectCode: z
        .string()
        .regex(/^[A-Z0-9]+$/, 'Project code must be in format PROJECT_CODE (e.g., BDI)')
        .describe('Project code identifier (e.g., BDI)'),
      folders: z
        .array(
          z.object({
            path: z
              .array(z.string().min(1).max(255))
              .min(1)
              .describe('Array of folder names representing the hierarchy'),
            comment: z
              .string()
              .optional()
              .describe(
                'Additional notes or description for the leaf folder (HTML format). Set null or omit to keep existing comment of an existing folder.'
              ),
          })
        )
        .min(1)
        .describe('Array of folder requests to create or update'),
    },
    async ({ projectCode, folders }) => {
      try {
        // Validate folder paths
        for (const folder of folders) {
          for (const folderName of folder.path) {
            if (folderName.includes('/')) {
              throw new Error('Folder names cannot contain forward slash (/) characters')
            }
            if (folderName.trim() === '') {
              throw new Error('Folder names cannot be empty strings')
            }
          }
        }

        const requestBody: BulkUpsertFoldersRequest = {
          folders: folders.map((folder) => ({
            path: folder.path,
            comment: folder.comment,
          })),
        }

        const url = `${QASPHERE_TENANT_URL}/api/public/v0/project/${projectCode}/tcase/folder/bulk`

        const response = await axios.post<BulkUpsertFoldersResponse>(url, requestBody, {
          headers: {
            Authorization: `ApiKey ${QASPHERE_API_KEY}`,
            'Content-Type': 'application/json',
          },
        })

        const result = response.data

        // Basic validation of response
        if (!result || !Array.isArray(result.ids)) {
          throw new Error('Invalid response: expected an array of folder ID arrays')
        }

        // Validate that the number of returned ID arrays matches the number of input folders
        if (result.ids.length !== folders.length) {
          throw new Error(
            `Invalid response: expected ${folders.length} folder ID arrays, got ${result.ids.length}`
          )
        }

        // Validate that each ID array has the correct length
        for (let i = 0; i < result.ids.length; i++) {
          const idArray = result.ids[i]
          const expectedLength = folders[i].path.length
          if (!Array.isArray(idArray) || idArray.length !== expectedLength) {
            throw new Error(
              `Invalid response: folder ${i} expected ${expectedLength} IDs, got ${idArray?.length || 0}`
            )
          }
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        }
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 400) {
            throw new Error(
              `Invalid request: ${error.response?.data?.message || 'Invalid request body or folder path format'}`
            )
          }
          if (error.response?.status === 401) {
            throw new Error('Invalid or missing API key')
          }
          if (error.response?.status === 403) {
            throw new Error('Insufficient permissions or suspended tenant')
          }
          if (error.response?.status === 404) {
            throw new Error(`Project with code '${projectCode}' not found`)
          }
          if (error.response?.status === 500) {
            throw new Error('Internal server error')
          }
          throw new Error(
            `Failed to bulk upsert folders: ${error.response?.data?.message || error.message}`
          )
        }
        throw error
      }
    }
  )
}
