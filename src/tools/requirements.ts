import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp'
import axios from 'axios'
import { z, ZodError } from 'zod'
import { QASPHERE_API_KEY, QASPHERE_TENANT_URL } from '../config.js'
import { projectCodeSchema } from '../schemas.js'

const requirementIntegrationLinkSchema = z.object({
  issueId: z.string(),
  issueTitle: z.string(),
  issueUrl: z.string(),
  remoteLinkId: z.number(),
})

const requirementSchema = z.object({
  id: z.string(),
  text: z.string(),
  url: z.string(),
  integrationLink: requirementIntegrationLinkSchema.optional(),
  tcaseCount: z.number().optional(),
})

const requirementsListResponseSchema = z.object({
  requirements: z.array(requirementSchema),
})

export const registerTools = (server: McpServer) => {
  server.tool(
    'list_requirements',
    'List requirements linked to test cases in a project. Requirements are references to external documentation or specifications (like Jira issues) that test cases verify. Use this tool to find requirement IDs when you need to filter test cases by requirement using list_test_cases with requirementIds parameter.',
    {
      projectCode: projectCodeSchema,
      sortField: z.enum(['created_at', 'text']).optional().describe('Field to sort results by'),
      sortOrder: z
        .enum(['asc', 'desc'])
        .optional()
        .describe('Sort direction (ascending or descending). Requires sortField.'),
      include: z
        .enum(['tcaseCount'])
        .optional()
        .describe(
          'Include optional fields like the number of test cases linked to each requirement'
        ),
    },
    async ({ projectCode, sortField, sortOrder, include }) => {
      try {
        if (sortOrder && !sortField) {
          throw new Error('sortOrder can only be specified when sortField is provided.')
        }

        const params = new URLSearchParams()
        if (sortField) params.append('sortField', sortField)
        if (sortOrder) params.append('sortOrder', sortOrder)
        if (include) params.append('include', include)

        const url = `${QASPHERE_TENANT_URL}/api/public/v0/project/${projectCode}/requirement`

        const response = await axios.get(url, {
          params,
          headers: {
            Authorization: `ApiKey ${QASPHERE_API_KEY}`,
            'Content-Type': 'application/json',
          },
        })

        const requirementsResponse = requirementsListResponseSchema.parse(response.data)

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(requirementsResponse),
            },
          ],
        }
      } catch (error: unknown) {
        if (error instanceof ZodError) {
          throw new Error(`Invalid response data: ${error.errors.map((e) => e.message).join(', ')}`)
        }
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
            throw new Error(`Project with code '${projectCode}' not found.`)
          }
          if (status === 500) {
            throw new Error('Internal server error while fetching requirements')
          }

          throw new Error(`Failed to fetch requirements: ${message}`)
        }
        throw error
      }
    }
  )
}
