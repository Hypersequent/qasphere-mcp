import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp'
import axios from 'axios'
import { z } from 'zod'
import type { TestFolderListResponse } from '../types.js'
import { QASPHERE_API_KEY, QASPHERE_TENANT_URL } from '../config.js'

export const registerTools = (server: McpServer) => {
  server.tool(
    'list_folders',
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
}
