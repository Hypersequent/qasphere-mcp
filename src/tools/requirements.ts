import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp'
import { ApiError, apiQuery } from '../api.js'
import { listRequirementsInputSchema, listRequirementsOutputSchema } from '../schemas.js'

export const registerTools = (server: McpServer) => {
  server.registerTool(
    'list_requirements',
    {
      title: 'List Requirements',
      description:
        'List requirements linked to test cases in a project. Requirements are references to external documentation or specifications (like Jira issues) that test cases verify. Use this tool to find requirement IDs when you need to filter test cases by requirement using list_test_cases with the `requirementIds` parameter.',
      inputSchema: listRequirementsInputSchema.shape,
      outputSchema: listRequirementsOutputSchema.shape,
    },
    async ({ projectCode, sortField, sortOrder, include }) => {
      try {
        const result = await apiQuery(`/api/public/v0/project/${projectCode}/requirement`, {
          schema: listRequirementsOutputSchema,
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
            throw new Error('Internal server error while fetching requirements')
          throw new Error(`Failed to fetch requirements: ${message}`)
        }
        throw error
      }
    }
  )
}
