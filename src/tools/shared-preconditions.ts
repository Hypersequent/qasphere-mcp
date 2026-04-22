import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp'
import { ApiError, apiQuery } from '../api.js'
import {
  getSharedPreconditionInputSchema,
  getSharedPreconditionOutputSchema,
  listSharedPreconditionsInputSchema,
  listSharedPreconditionsOutputSchema,
} from '../schemas.js'

export const registerTools = (server: McpServer) => {
  server.registerTool(
    'list_shared_preconditions',
    {
      title: 'List Shared Preconditions',
      description:
        'List reusable shared preconditions for a project. Supports sorting by title or creation date and can include test case usage counts. Use the returned `id` as `sharedPreconditionId` when referencing a shared precondition from create_test_case / update_test_case.',
      inputSchema: listSharedPreconditionsInputSchema.shape,
      outputSchema: listSharedPreconditionsOutputSchema.shape,
    },
    async ({ projectCode, sortField, sortOrder, include }) => {
      try {
        const sharedPreconditions = await apiQuery(
          `/api/public/v0/project/${projectCode}/shared-precondition`,
          {
            schema: listSharedPreconditionsOutputSchema.shape.sharedPreconditions,
            query: { sortField, sortOrder, include },
          }
        )
        const result = { sharedPreconditions }
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
            throw new Error('Internal server error while fetching shared preconditions')
          throw new Error(`Failed to fetch shared preconditions: ${message}`)
        }
        throw error
      }
    }
  )

  server.registerTool(
    'get_shared_precondition',
    {
      title: 'Get Shared Precondition',
      description: 'Fetch details for a single shared precondition by ID.',
      inputSchema: getSharedPreconditionInputSchema.shape,
      outputSchema: getSharedPreconditionOutputSchema.shape,
    },
    async ({ projectCode, sharedPreconditionId }) => {
      try {
        const result = await apiQuery(
          `/api/public/v0/project/${projectCode}/shared-precondition/${sharedPreconditionId}`,
          { schema: getSharedPreconditionOutputSchema }
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
              `Project or shared precondition not found: ${message || `Shared precondition ${sharedPreconditionId}`}`
            )
          if (error.status === 500)
            throw new Error('Internal server error while fetching shared precondition')
          throw new Error(`Failed to fetch shared precondition: ${message}`)
        }
        throw error
      }
    }
  )
}
