import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp'
import axios from 'axios'
import { z } from 'zod'
import { QASPHERE_API_KEY, QASPHERE_TENANT_URL } from '../config.js'
import { projectCodeSchema } from '../schemas.js'
import type { SharedStep, SharedStepListResponse } from '../types.js'

const sharedStepIdSchema = z
  .number()
  .int()
  .positive('Shared step ID must be a positive integer')
  .describe('Identifier of the shared step')

export const registerTools = (server: McpServer) => {
  server.tool(
    'list_shared_steps',
    'List reusable shared steps for a project. Supports sorting by title or creation date and can include test case usage counts.',
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
          'Include optional fields like the number of test cases referencing each shared step'
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

        const url = `${QASPHERE_TENANT_URL}/api/public/v0/project/${projectCode}/shared-step`

        const response = await axios.get<SharedStepListResponse>(url, {
          params,
          headers: {
            Authorization: `ApiKey ${QASPHERE_API_KEY}`,
            'Content-Type': 'application/json',
          },
        })

        const sharedSteps = response.data

        if (!sharedSteps || !Array.isArray(sharedSteps.sharedSteps)) {
          throw new Error('Invalid response: expected an object with a "sharedSteps" array')
        }

        if (sharedSteps.sharedSteps.length > 0) {
          const first = sharedSteps.sharedSteps[0]
          if (!first.id || !first.title || !Array.isArray(first.subSteps)) {
            throw new Error(
              'Invalid shared step data: missing required fields (id, title, or subSteps)'
            )
          }
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(sharedSteps),
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
            throw new Error('Internal server error while fetching shared steps')
          }

          throw new Error(`Failed to fetch shared steps: ${message}`)
        }
        throw error
      }
    }
  )

  server.tool(
    'get_shared_step',
    'Fetch details for a single shared step by ID.',
    {
      projectCode: projectCodeSchema,
      sharedStepId: sharedStepIdSchema,
    },
    async ({ projectCode, sharedStepId }) => {
      try {
        const url = `${QASPHERE_TENANT_URL}/api/public/v0/project/${projectCode}/shared-step/${sharedStepId}`

        const response = await axios.get<SharedStep>(url, {
          headers: {
            Authorization: `ApiKey ${QASPHERE_API_KEY}`,
            'Content-Type': 'application/json',
          },
        })

        const sharedStep = response.data

        if (!sharedStep.id || !sharedStep.title || !Array.isArray(sharedStep.subSteps)) {
          throw new Error(
            'Invalid shared step data: missing required fields (id, title, or subSteps)'
          )
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(sharedStep),
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
              `Project or shared step not found: ${message || `Shared step ${sharedStepId}`}`
            )
          }
          if (status === 500) {
            throw new Error('Internal server error while fetching shared step')
          }

          throw new Error(`Failed to fetch shared step: ${message}`)
        }
        throw error
      }
    }
  )
}
