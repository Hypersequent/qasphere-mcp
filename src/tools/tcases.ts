import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp'
import axios from 'axios'
import { z } from 'zod'
import type {
  TestCase,
  TestCasesListResponse,
  CreateTestCaseRequest,
  CreateTestCaseResponse,
  UpdateTestCaseRequest,
  UpdateTestCaseResponse,
} from '../types.js'
import { QASPHERE_API_KEY, QASPHERE_TENANT_URL } from '../config.js'
import { JSONStringify } from '../utils.js'
import { projectCodeSchema } from '../schemas.js'

export const registerTools = (server: McpServer) => {
  server.tool(
    'get_test_case',
    `Get a test case from QA Sphere using a marker in the format PROJECT_CODE-SEQUENCE (e.g., BDI-123). You can use URLs like: ${QASPHERE_TENANT_URL}/project/%PROJECT_CODE%/tcase/%SEQUENCE%?any Extract %PROJECT_CODE% and %SEQUENCE% from the URL and use them as the marker.`,
    {
      marker: testCaseMarkerSchema,
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
        if (!testCase.id || !testCase.title || !testCase.version) {
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
      projectCode: projectCodeSchema,
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

  server.tool(
    'create_test_case',
    'Create a new test case in QA Sphere. Supports both standalone and template test cases with various options like steps, tags, requirements, and parameter values for templates.',
    {
      projectId: projectCodeSchema,
      title: z
        .string()
        .min(1, 'Title must be at least 1 character')
        .max(511, 'Title must be at most 511 characters')
        .describe('Test case title'),
      type: z
        .enum(['standalone', 'template'])
        .describe('Type of test case (standalone or template)'),
      folderId: z
        .number()
        .int()
        .positive('Folder ID must be a positive integer')
        .describe(
          'ID of the folder where the test case will be placed. Use bulk_upsert_folders tool to create new folders or get existing folders.'
        ),
      priority: z.enum(['high', 'medium', 'low']).describe('Test case priority'),
      pos: z
        .number()
        .int()
        .min(0, 'Position must be non-negative')
        .optional()
        .describe('Position within the folder (0-based index)'),
      comment: z.string().optional().describe('Test case precondition (HTML format)'),
      steps: z
        .array(
          z.object({
            sharedStepId: z
              .number()
              .int()
              .positive()
              .optional()
              .describe('Unique identifier of the shared step'),
            description: z.string().optional().describe('Details of steps (HTML format)'),
            expected: z.string().optional().describe('Expected result from the step (HTML format)'),
          })
        )
        .optional()
        .describe('List of test case steps'),
      tags: z
        .array(z.string().max(255, 'Tag title must be at most 255 characters'))
        .optional()
        .describe('List of tag titles'),
      requirements: z
        .array(
          z.object({
            text: z
              .string()
              .min(1, 'Requirement text must be at least 1 character')
              .max(255, 'Requirement text must be at most 255 characters')
              .describe('Title of the requirement'),
            url: z
              .string()
              .min(1, 'Requirement URL must be at least 1 character')
              .max(255, 'Requirement URL must be at most 255 characters')
              .url('Requirement URL must be a valid URL')
              .describe('URL of the requirement'),
          })
        )
        .optional()
        .describe('Test case requirements'),
      links: z
        .array(
          z.object({
            text: z
              .string()
              .min(1, 'Link text must be at least 1 character')
              .max(255, 'Link text must be at most 255 characters')
              .describe('Title of the link'),
            url: z
              .string()
              .min(1, 'Link URL must be at least 1 character')
              .max(255, 'Link URL must be at most 255 characters')
              .url('Link URL must be a valid URL')
              .describe('URL of the link'),
          })
        )
        .optional()
        .describe('Additional links relevant to the test case'),
      customFields: tcaseCustomFieldParamSchema,
      parameterValues: z
        .array(
          z.object({
            values: z
              .record(z.string())
              .describe('Values for the parameters in the template test case'),
          })
        )
        .optional()
        .describe('Values to substitute for parameters in template test cases'),
      filledTCaseTitleSuffixParams: z
        .array(z.string())
        .optional()
        .describe('Parameters to append to filled test case titles'),
      isDraft: z.boolean().optional().default(false).describe('Whether to create as draft'),
    },
    async ({ projectId, ...tcaseParams }) => {
      try {
        const requestData: CreateTestCaseRequest = {
          ...tcaseParams,
        }

        const response = await axios.post<CreateTestCaseResponse>(
          `${QASPHERE_TENANT_URL}/api/public/v0/project/${projectId}/tcase`,
          requestData,
          {
            headers: {
              Authorization: `ApiKey ${QASPHERE_API_KEY}`,
              'Content-Type': 'application/json',
            },
          }
        )

        const result = response.data

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result),
            },
          ],
        }
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          const status = error.response?.status
          const message = error.response?.data?.message || error.message

          if (status === 400) {
            throw new Error(`Invalid request data: ${message}`)
          }
          if (status === 401) {
            throw new Error('Invalid or missing API key')
          }
          if (status === 403) {
            throw new Error('Insufficient permissions or suspended tenant')
          }
          if (status === 404) {
            throw new Error(`Project or folder not found: ${message}`)
          }
          if (status === 409) {
            throw new Error(`Position conflict or duplicate requirement: ${message}`)
          }
          if (status === 500) {
            throw new Error('Internal server error while creating test case')
          }

          throw new Error(`Failed to create test case: ${message}`)
        }
        throw error
      }
    }
  )

  server.tool(
    'update_test_case',
    'Update an existing test case in QA Sphere. Only users with role User or higher are allowed to update test cases. Optional fields can be omitted to keep the current value.',
    {
      projectId: projectCodeSchema,
      tcaseOrLegacyId: z
        .string()
        .describe('Test case identifier (can be one of test case UUID, sequence or legacy ID)'),
      title: z
        .string()
        .min(1, 'Title must be at least 1 character')
        .max(511, 'Title must be at most 511 characters')
        .optional()
        .describe('Test case title'),
      priority: z.enum(['high', 'medium', 'low']).optional().describe('Test case priority'),
      comment: z.string().optional().describe('Test case precondition (HTML format)'),
      isDraft: z
        .boolean()
        .optional()
        .describe(
          'To publish a draft test case. A published test case cannot be converted to draft'
        ),
      steps: z
        .array(
          z.object({
            sharedStepId: z
              .number()
              .int()
              .positive()
              .optional()
              .describe('Unique identifier of the shared step'),
            description: z.string().optional().describe('Details of steps (HTML format)'),
            expected: z.string().optional().describe('Expected result from the step (HTML format)'),
          })
        )
        .optional()
        .describe('List of test case steps'),
      tags: z
        .array(z.string().max(255, 'Tag title must be at most 255 characters'))
        .optional()
        .describe('List of tag titles'),
      requirements: z
        .array(
          z.object({
            text: z
              .string()
              .min(1, 'Requirement text must be at least 1 character')
              .max(255, 'Requirement text must be at most 255 characters')
              .describe('Title of the requirement'),
            url: z
              .string()
              .min(1, 'Requirement URL must be at least 1 character')
              .max(255, 'Requirement URL must be at most 255 characters')
              .url('Requirement URL must be a valid URL')
              .describe('URL of the requirement'),
          })
        )
        .optional()
        .describe('Test case requirements'),
      links: z
        .array(
          z.object({
            text: z
              .string()
              .min(1, 'Link text must be at least 1 character')
              .max(255, 'Link text must be at most 255 characters')
              .describe('Title of the link'),
            url: z
              .string()
              .min(1, 'Link URL must be at least 1 character')
              .max(255, 'Link URL must be at most 255 characters')
              .url('Link URL must be a valid URL')
              .describe('URL of the link'),
          })
        )
        .optional()
        .describe('Additional links relevant to the test case'),
      customFields: tcaseCustomFieldParamSchema,
      parameterValues: z
        .array(
          z.object({
            tcaseId: z
              .string()
              .optional()
              .describe('Should be specified to update existing filled test case'),
            values: z
              .record(z.string())
              .describe('Values for the parameters in the template test case'),
          })
        )
        .optional()
        .describe('Values to substitute for parameters in template test cases'),
    },
    async ({ projectId, tcaseOrLegacyId, ...updateParams }) => {
      try {
        const requestData: UpdateTestCaseRequest = {
          ...updateParams,
        }

        const response = await axios.patch<UpdateTestCaseResponse>(
          `${QASPHERE_TENANT_URL}/api/public/v0/project/${projectId}/tcase/${tcaseOrLegacyId}`,
          requestData,
          {
            headers: {
              Authorization: `ApiKey ${QASPHERE_API_KEY}`,
              'Content-Type': 'application/json',
            },
          }
        )

        const result = response.data

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result),
            },
          ],
        }
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          const status = error.response?.status
          const message = error.response?.data?.message || error.message

          if (status === 400) {
            throw new Error(
              `Invalid request data or converting a published test case to draft: ${message}`
            )
          }
          if (status === 401) {
            throw new Error('Invalid or missing API key')
          }
          if (status === 403) {
            throw new Error('Insufficient permissions or suspended tenant')
          }
          if (status === 404) {
            throw new Error(`Project or test case not found: ${message}`)
          }
          if (status === 500) {
            throw new Error('Internal server error while updating test case')
          }

          throw new Error(`Failed to update test case: ${message}`)
        }
        throw error
      }
    }
  )
}

const tcaseCustomFieldParamSchema = z
  .record(
    z.string(),
    z.object({
      value: z
        .string()
        .optional()
        .describe(
          "The actual value for the field. For text fields: any string value. For dropdown fields: must match one of the option value strings from the field's options array."
        ),
      isDefault: z
        .boolean()
        .optional()
        .describe(
          "Boolean indicating whether to use the field's default value (if true, the value field is ignored)"
        ),
    })
  )
  .optional()
  .describe(
    'Custom field values. Use the systemName property from custom fields as the key. Only enabled fields should be used. Use list_custom_fields tool to get the custom fields.'
  )

const testCaseMarkerSchema = z
  .string()
  .regex(
    /^[A-Z0-9]{2,5}-\d+$/,
    'Marker must be in format PROJECT_CODE-SEQUENCE (e.g., BDI-123). Project code must be 2 to 5 characters in format PROJECT_CODE (e.g., BDI). Sequence must be a number.'
  )
  .describe('Test case marker in format PROJECT_CODE-SEQUENCE (e.g., BDI-123)')
