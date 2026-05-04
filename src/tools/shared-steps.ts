import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp'
import { ApiError, apiQuery } from '../api.js'
import {
  getSharedStepInputSchema,
  getSharedStepOutputSchema,
  listSharedStepsInputSchema,
  listSharedStepsOutputSchema,
  testStepSchemaShape,
} from '../schemas.js'

export const registerTools = (server: McpServer) => {
  server.registerTool(
    'list_shared_steps',
    {
      title: 'List Shared Steps',
      description:
        'List reusable shared steps for a project. Supports sorting by title or creation date and can include test case usage counts. Use the returned `id` as `sharedStepId` when referencing a shared step from create_test_case / update_test_case.',
      inputSchema: listSharedStepsInputSchema.shape,
      outputSchema: listSharedStepsOutputSchema.shape,
    },
    async ({ projectCode, sortField, sortOrder, include }) => {
      try {
        const result = await apiQuery(`/api/public/v0/project/${projectCode}/shared-step`, {
          schema: listSharedStepsOutputSchema,
          query: { sortField, sortOrder, include },
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
          if (error.status === 404) throw new Error(`Project with code '${projectCode}' not found.`)
          if (error.status === 500)
            throw new Error('Internal server error while fetching shared steps')
          throw new Error(`Failed to fetch shared steps: ${message}`)
        }
        throw error
      }
    }
  )

  server.registerTool(
    'get_shared_step',
    {
      title: 'Get Shared Step',
      description: 'Fetch details for a single shared step by ID.',
      inputSchema: getSharedStepInputSchema.shape,
      outputSchema: testStepSchemaShape,
    },
    async ({ projectCode, sharedStepId }) => {
      try {
        const result = await apiQuery(
          `/api/public/v0/project/${projectCode}/shared-step/${sharedStepId}`,
          { schema: getSharedStepOutputSchema }
        )
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
          if (error.status === 404)
            throw new Error(
              `Project or shared step not found: ${message || `Shared step ${sharedStepId}`}`
            )
          if (error.status === 500)
            throw new Error('Internal server error while fetching shared step')
          throw new Error(`Failed to fetch shared step: ${message}`)
        }
        throw error
      }
    }
  )
}
