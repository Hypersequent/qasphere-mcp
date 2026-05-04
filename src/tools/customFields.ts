import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp'
import { ApiError, apiQuery } from '../api.js'
import { listCustomFieldsInputSchema, listCustomFieldsOutputSchema } from '../schemas.js'

export const registerTools = (server: McpServer) => {
  server.registerTool(
    'list_custom_fields',
    {
      title: 'List Custom Fields',
      description:
        "List all custom fields available for a project. Useful when creating or updating test cases with custom field values — use the `systemName` property as the key on the `customFields` parameter of create_test_case / update_test_case. Only `enabled` fields should be used. Custom fields allow you to extend test cases with additional metadata specific to your organization's needs.",
      inputSchema: listCustomFieldsInputSchema.shape,
      outputSchema: listCustomFieldsOutputSchema.shape,
    },
    async ({ projectCode }) => {
      try {
        const result = await apiQuery(`/api/public/v0/project/${projectCode}/custom-field`, {
          schema: listCustomFieldsOutputSchema,
        })
        return {
          content: [{ type: 'text', text: JSON.stringify(result) }],
          structuredContent: result,
        }
      } catch (error: unknown) {
        if (error instanceof ApiError) {
          if (error.status === 401) throw new Error('Invalid or missing API key')
          if (error.status === 403) throw new Error('Insufficient permissions or suspended tenant')
          if (error.status === 404) throw new Error(`Project with code '${projectCode}' not found.`)
          if (error.status === 500) throw new Error('Internal server error')
          throw new Error(`Failed to fetch custom fields: ${error.message}`)
        }
        throw error
      }
    }
  )
}
