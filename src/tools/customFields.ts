import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp'
import axios from 'axios'
import { QASPHERE_API_KEY, QASPHERE_TENANT_URL } from '../config.js'
import type { CustomFieldsResponse } from '../types.js'
import { projectCodeSchema } from '../schemas.js'

export const registerTools = (server: McpServer) => {
  server.tool(
    'list_custom_fields',
    "List all custom fields available for a project. This endpoint is useful when creating or updating test cases that include custom field values. Custom fields allow you to extend test cases with additional metadata specific to your organization's needs.",
    {
      projectCode: projectCodeSchema,
    },
    async ({ projectCode }: { projectCode: string }) => {
      try {
        const response = await axios.get<CustomFieldsResponse>(
          `${QASPHERE_TENANT_URL}/api/public/v0/project/${projectCode}/custom-field`,
          {
            headers: {
              Authorization: `ApiKey ${QASPHERE_API_KEY}`,
              'Content-Type': 'application/json',
            },
          }
        )

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data.customFields),
            },
          ],
        }
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          switch (error.response?.status) {
            case 404:
              throw new Error(`Project with code '${projectCode}' not found.`)
            case 401:
              throw new Error('Invalid or missing API key')
            case 403:
              throw new Error('Insufficient permissions or suspended tenant')
            default:
              throw new Error(
                `Failed to fetch custom fields: ${error.response?.data?.message || error.message}`
              )
          }
        }
        throw error
      }
    }
  )
}
