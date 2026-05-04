import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp'
import { ApiError, apiQuery } from '../api.js'
import { QASPHERE_TENANT_URL } from '../config.js'
import {
  type CreateTestCaseInput,
  createTestCaseInputSchema,
  createTestCaseOutputSchema,
  getTestCaseInputSchema,
  getTestCaseOutputSchema,
  listTestCasesInputSchema,
  listTestCasesOutputSchema,
  type UpdateTestCaseInput,
  updateTestCaseInputSchema,
  updateTestCaseOutputSchema,
} from '../schemas.js'

export const registerTools = (server: McpServer) => {
  server.registerTool(
    'get_test_case',
    {
      title: 'Get Test Case',
      description: `Get a test case from QA Sphere using a marker in the format PROJECT_CODE-SEQUENCE (e.g., BDI-123). You can use URLs like: ${QASPHERE_TENANT_URL}/project/%PROJECT_CODE%/tcase/%SEQUENCE%?any Extract %PROJECT_CODE% and %SEQUENCE% from the URL and use them as the marker.`,
      inputSchema: getTestCaseInputSchema.shape,
      outputSchema: getTestCaseOutputSchema.shape,
    },
    async ({ marker }) => {
      try {
        const [projectCode, sequence] = marker.split('-')
        const testCase = await apiQuery(`/api/public/v0/project/${projectCode}/tcase/${sequence}`, {
          schema: getTestCaseOutputSchema,
        })
        return {
          content: [{ type: 'text', text: JSON.stringify(testCase) }],
          structuredContent: testCase,
        }
      } catch (error: unknown) {
        if (error instanceof ApiError) {
          const message = error.message
          if (error.status === 401) throw new Error('Invalid or missing API key')
          if (error.status === 403) throw new Error('Insufficient permissions or suspended tenant')
          if (error.status === 404) throw new Error(`Test case '${marker}' not found.`)
          if (error.status === 500)
            throw new Error('Internal server error while fetching test case')
          throw new Error(`Failed to fetch test case: ${message}`)
        }
        throw error
      }
    }
  )

  server.registerTool(
    'list_test_cases',
    {
      title: 'List Test Cases',
      description:
        'List test cases from a project in QA Sphere. Supports pagination and various filtering options. Usually it makes sense to call get_project tool first to get the project context.',
      inputSchema: listTestCasesInputSchema.shape,
      outputSchema: listTestCasesOutputSchema.shape,
    },
    async ({
      projectCode,
      page,
      limit,
      sortField,
      sortOrder,
      search,
      include,
      folders,
      tags,
      types,
      priorities,
      templateTCaseIds,
      requirementIds,
      customFields,
      draft,
    }) => {
      try {
        const query: Record<string, string | number | boolean | string[] | number[] | undefined> = {
          page,
          limit,
          sortField,
          sortOrder,
          search,
          include,
          folders,
          tags,
          types,
          priorities,
          templateTCaseIds,
          requirementIds,
          draft,
        }
        if (customFields) {
          for (const [field, values] of Object.entries(customFields)) {
            query[`cf_${field}`] = values
          }
        }
        const result = await apiQuery(`/api/public/v0/project/${projectCode}/tcase`, {
          schema: listTestCasesOutputSchema,
          query,
        })
        return {
          content: [{ type: 'text', text: JSON.stringify(result) }],
          structuredContent: result,
        }
      } catch (error: unknown) {
        if (error instanceof ApiError) {
          const message = error.message
          if (error.status === 401) throw new Error('Invalid or missing API key')
          if (error.status === 403) throw new Error('Insufficient permissions or suspended tenant')
          if (error.status === 404) throw new Error(`Project with code '${projectCode}' not found.`)
          if (error.status === 500)
            throw new Error('Internal server error while fetching test cases')
          throw new Error(`Failed to fetch test cases: ${message}`)
        }
        throw error
      }
    }
  )

  server.registerTool(
    'create_test_case',
    {
      title: 'Create Test Case',
      description:
        'Create a new test case in QA Sphere. Supports both standalone and template test cases with various options like steps, tags, requirements, and parameter values for templates.',
      inputSchema: createTestCaseInputSchema.shape,
      outputSchema: createTestCaseOutputSchema.shape,
    },
    async ({ projectCode, ...rest }) => {
      try {
        const body: Omit<CreateTestCaseInput, 'projectCode'> = rest
        const result = await apiQuery(`/api/public/v0/project/${projectCode}/tcase`, {
          schema: createTestCaseOutputSchema,
          method: 'POST',
          body,
        })
        return {
          content: [{ type: 'text', text: JSON.stringify(result) }],
          structuredContent: result,
        }
      } catch (error: unknown) {
        if (error instanceof ApiError) {
          const message = error.message
          if (error.status === 400) throw new Error(`Invalid request data: ${message}`)
          if (error.status === 401) throw new Error('Invalid or missing API key')
          if (error.status === 403) throw new Error('Insufficient permissions or suspended tenant')
          if (error.status === 404) throw new Error(`Project or folder not found: ${message}`)
          if (error.status === 409)
            throw new Error(`Position conflict or duplicate requirement: ${message}`)
          if (error.status === 500)
            throw new Error('Internal server error while creating test case')
          throw new Error(`Failed to create test case: ${message}`)
        }
        throw error
      }
    }
  )

  server.registerTool(
    'update_test_case',
    {
      title: 'Update Test Case',
      description:
        'Update an existing test case in QA Sphere. Only users with role User or higher are allowed to update test cases. Optional fields can be omitted to keep the current value.',
      inputSchema: updateTestCaseInputSchema.shape,
      outputSchema: updateTestCaseOutputSchema.shape,
    },
    async ({ projectCode, tcaseOrLegacyId, ...rest }) => {
      try {
        const body: Omit<UpdateTestCaseInput, 'projectCode' | 'tcaseOrLegacyId'> = rest
        const result = await apiQuery(
          `/api/public/v0/project/${projectCode}/tcase/${tcaseOrLegacyId}`,
          {
            schema: updateTestCaseOutputSchema,
            method: 'PATCH',
            body,
          }
        )
        return {
          content: [{ type: 'text', text: JSON.stringify(result) }],
          structuredContent: result,
        }
      } catch (error: unknown) {
        if (error instanceof ApiError) {
          const message = error.message
          if (error.status === 400)
            throw new Error(
              `Invalid request data or converting a published test case to draft: ${message}`
            )
          if (error.status === 401) throw new Error('Invalid or missing API key')
          if (error.status === 403) throw new Error('Insufficient permissions or suspended tenant')
          if (error.status === 404) throw new Error(`Project or test case not found: ${message}`)
          if (error.status === 500)
            throw new Error('Internal server error while updating test case')
          throw new Error(`Failed to update test case: ${message}`)
        }
        throw error
      }
    }
  )
}
