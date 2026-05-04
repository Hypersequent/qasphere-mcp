import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp'
import { ApiError, apiQuery } from '../api.js'
import { listTestCasesTagsInputSchema, listTestCasesTagsOutputSchema } from '../schemas.js'

export const registerTools = (server: McpServer) => {
  server.registerTool(
    'list_test_cases_tags',
    {
      title: 'List Test Case Tags',
      description: 'List all tags defined within a specific QA Sphere project.',
      inputSchema: listTestCasesTagsInputSchema.shape,
      outputSchema: listTestCasesTagsOutputSchema.shape,
    },
    async ({ projectCode, sortField, sortOrder, include }) => {
      try {
        const result = await apiQuery(`/api/public/v0/project/${projectCode}/tag`, {
          schema: listTestCasesTagsOutputSchema,
          query: { sortField, sortOrder, include },
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
            throw new Error('Internal server error while fetching project tags')
          throw new Error(`Failed to fetch project tags: ${message}`)
        }
        throw error
      }
    }
  )
}
