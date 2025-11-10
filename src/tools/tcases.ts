import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp'
import axios from 'axios'
import { z } from 'zod'
import { JSONStringify } from '../utils.js'
import type { TestCase, TestCasesListResponse } from '../types.js'
import { QASPHERE_API_KEY, QASPHERE_TENANT_URL } from '../config.js'

export const registerTools = (server: McpServer) => {
  server.tool(
    'get_test_case',
    `Get a test case from QA Sphere using a marker in the format PROJECT_CODE-SEQUENCE (e.g., BDI-123). You can use URLs like: ${QASPHERE_TENANT_URL}/project/%PROJECT_CODE%/tcase/%SEQUENCE%?any Extract %PROJECT_CODE% and %SEQUENCE% from the URL and use them as the marker.`,
    {
      marker: z
        .string()
        .regex(
          /^[A-Z0-9]{2,5}-\d+$/,
          'Marker must be in format PROJECT_CODE-SEQUENCE (e.g., BDI-123). Project code must be 2 to 5 characters in format PROJECT_CODE (e.g., BDI). Sequence must be a number.'
        )
        .describe('Test case marker in format PROJECT_CODE-SEQUENCE (e.g., BDI-123)'),
    },
    async ({ marker }: { marker: string }) => {
      try {
        const [projectId, sequence] = marker.split('-')
        const response = await axios.get<TestCase>(
          `${QASPHERE_TENANT_URL}/api/public/v0/project/${projectId}/tcase/${sequence}`,
          {
            headers: {
              Authorization: `ApiKey ${QASPHERE_API_KEY}`,
              'Content-Type': 'application/json',
            },
          }
        )

        const testCase = response.data

        // Sanity check for required fields
        if (!testCase.id || !testCase.title || testCase.version) {
          throw new Error('Invalid test case data: missing required fields (id, title, or version)')
        }

        return {
          content: [
            {
              type: 'text',
              text: JSONStringify(testCase, {
                comment: 'precondition',
                steps: { description: 'action', expected: 'expected_result' },
              }),
            },
          ],
        }
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          throw new Error(
            `Failed to fetch test case: ${error.response?.data?.message || error.message}`
          )
        }
        throw error
      }
    }
  )

  server.tool(
    'list_test_cases',
    'List test cases from a project in QA Sphere. Supports pagination and various filtering options. Usually it makes sense to call get_project tool first to get the project context.',
    {
      projectCode: z
        .string()
        .regex(
          /^[A-Z0-9]{2,5}$/,
          'Project code must be 2 to 5 characters in format PROJECT_CODE (e.g., BDI)'
        )
        .describe('Project code identifier (e.g., BDI)'),
      page: z.number().optional().describe('Page number for pagination'),
      limit: z.number().optional().default(20).describe('Number of items per page'),
      sortField: z
        .enum([
          'id',
          'seq',
          'folder_id',
          'author_id',
          'pos',
          'title',
          'priority',
          'created_at',
          'updated_at',
          'legacy_id',
        ])
        .optional()
        .describe('Field to sort results by'),
      sortOrder: z
        .enum(['asc', 'desc'])
        .optional()
        .describe('Sort direction (ascending or descending)'),
      search: z.string().optional().describe('Search term to filter test cases'),
      include: z
        .array(z.enum(['steps', 'tags', 'project', 'folder', 'path']))
        .optional()
        .describe('Related data to include in the response'),
      folders: z.array(z.number()).optional().describe('Filter by folder IDs'),
      tags: z.array(z.number()).optional().describe('Filter by tag IDs'),
      priorities: z
        .array(z.enum(['high', 'medium', 'low']))
        .optional()
        .describe('Filter by priority levels'),
      draft: z.boolean().optional().describe('Filter draft vs published test cases'),
    },
    async ({
      projectCode,
      page,
      limit = 20,
      sortField,
      sortOrder,
      search,
      include,
      folders,
      tags,
      priorities,
      draft,
    }) => {
      try {
        // Build query parameters
        const params = new URLSearchParams()

        if (page !== undefined) params.append('page', page.toString())
        if (limit !== undefined) params.append('limit', limit.toString())
        if (sortField) params.append('sortField', sortField)
        if (sortOrder) params.append('sortOrder', sortOrder)
        if (search) params.append('search', search)

        // Add array parameters
        if (include) include.forEach((item) => params.append('include', item))
        if (folders) folders.forEach((item) => params.append('folders', item.toString()))
        if (tags) tags.forEach((item) => params.append('tags', item.toString()))
        if (priorities) priorities.forEach((item) => params.append('priorities', item))

        if (draft !== undefined) params.append('draft', draft.toString())

        const url = `${QASPHERE_TENANT_URL}/api/public/v0/project/${projectCode}/tcase`

        const response = await axios.get<TestCasesListResponse>(url, {
          params,
          headers: {
            Authorization: `ApiKey ${QASPHERE_API_KEY}`,
            'Content-Type': 'application/json',
          },
        })

        const testCasesList = response.data

        // Basic validation of response
        if (!testCasesList || !Array.isArray(testCasesList.data)) {
          throw new Error('Invalid response: expected a list of test cases')
        }

        // check for other fields from TestCasesListResponse
        if (
          testCasesList.total === undefined ||
          testCasesList.page === undefined ||
          testCasesList.limit === undefined
        ) {
          throw new Error('Invalid response: missing required fields (total, page, or limit)')
        }

        // if array is non-empty check if object has id and title fields
        if (testCasesList.data.length > 0) {
          const firstTestCase = testCasesList.data[0]
          if (!firstTestCase.id || !firstTestCase.title) {
            throw new Error('Invalid test case data: missing required fields (id or title)')
          }
        }

        return {
          content: [
            {
              type: 'text',
              text: JSONStringify(testCasesList, {
                data: {
                  comment: 'precondition',
                  steps: {
                    description: 'action',
                    expected: 'expected_result',
                  },
                },
              }),
            },
          ],
        }
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 404) {
            throw new Error(`Project with code '${projectCode}' not found.`)
          }
          throw new Error(
            `Failed to fetch test cases: ${error.response?.data?.message || error.message}`
          )
        }
        throw error
      }
    }
  )
}
