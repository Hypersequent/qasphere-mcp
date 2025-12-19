import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp'
import axios from 'axios'
import { z } from 'zod'
import { QASPHERE_API_KEY, QASPHERE_TENANT_URL } from '../config.js'
import { projectCodeSchema } from '../schemas.js'
import type { SharedPrecondition, SharedPreconditionListResponse } from '../types.js'

const sharedPreconditionIdSchema = z
  .number()
  .int()
  .positive('Shared precondition ID must be a positive integer')
  .describe('Identifier of the shared precondition')

export const registerTools = (server: McpServer) => {
  server.tool(
    'list_shared_preconditions',
    'List reusable shared preconditions for a project. Supports sorting by title or creation date and can include test case usage counts.',
    {
      projectCode: projectCodeSchema,
      sortField: z.enum(['created_at', 'title']).optional().describe('Field to sort results by'),
      sortOrder: z
        .enum(['asc', 'desc'])
        .optional()
        .describe('Sort direction (ascending or descending). Requires sortField.'),
      include: z
        .enum(['tcaseCount'])
        .optional()
        .describe(
          'Include optional fields like the number of test cases referencing each precondition'
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

        const url = `${QASPHERE_TENANT_URL}/api/public/v0/project/${projectCode}/shared-precondition`

        const response = await axios.get<SharedPreconditionListResponse>(url, {
          params,
          headers: {
            Authorization: `ApiKey ${QASPHERE_API_KEY}`,
            'Content-Type': 'application/json',
          },
        })

        const sharedPreconditions = response.data

        if (!Array.isArray(sharedPreconditions)) {
          throw new Error('Invalid response: expected an array of shared preconditions')
        }

        if (sharedPreconditions.length > 0) {
          const first = sharedPreconditions[0]
          if (first.id === undefined || !first.title || !first.text) {
            throw new Error(
              'Invalid shared precondition data: missing required fields (id, title, or text)'
            )
          }
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(sharedPreconditions),
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
            throw new Error(`Project with code '${projectCode}' not found.`)
          }
          if (status === 500) {
            throw new Error('Internal server error while fetching shared preconditions')
          }

          throw new Error(`Failed to fetch shared preconditions: ${message}`)
        }
        throw error
      }
    }
  )

  server.tool(
    'get_shared_precondition',
    'Fetch details for a single shared precondition by ID.',
    {
      projectCode: projectCodeSchema,
      sharedPreconditionId: sharedPreconditionIdSchema,
    },
    async ({ projectCode, sharedPreconditionId }) => {
      try {
        const url = `${QASPHERE_TENANT_URL}/api/public/v0/project/${projectCode}/shared-precondition/${sharedPreconditionId}`

        const response = await axios.get<SharedPrecondition>(url, {
          headers: {
            Authorization: `ApiKey ${QASPHERE_API_KEY}`,
            'Content-Type': 'application/json',
          },
        })

        const sharedPrecondition = response.data

        if (!sharedPrecondition.id || !sharedPrecondition.title || !sharedPrecondition.text) {
          throw new Error(
            'Invalid shared precondition data: missing required fields (id, title, or text)'
          )
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(sharedPrecondition),
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
            throw new Error(
              `Project or shared precondition not found: ${message || `Shared precondition ${sharedPreconditionId}`}`
            )
          }
          if (status === 500) {
            throw new Error('Internal server error while fetching shared precondition')
          }

          throw new Error(`Failed to fetch shared precondition: ${message}`)
        }
        throw error
      }
    }
  )
}
