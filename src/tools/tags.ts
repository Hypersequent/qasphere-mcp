import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp'
import axios from 'axios'
import { z } from 'zod'
import { QASPHERE_API_KEY, QASPHERE_TENANT_URL } from '../config.js'

export const registerTools = (server: McpServer) => {
  server.tool(
    'list_test_cases_tags',
    'List all tags defined within a specific QA Sphere project.',
    {
      projectCode: z
        .string()
        .regex(/^[A-Z0-9]+$/, 'Project code must be in format PROJECT_CODE (e.g., BDI)')
        .describe('Project code identifier (e.g., BDI)'),
    },
    async ({ projectCode }: { projectCode: string }) => {
      try {
        const url = `${QASPHERE_TENANT_URL}/api/public/v0/project/${projectCode}/tag`

        const response = await axios.get<{
          tags: Array<{ id: number; title: string }>
        }>(url, {
          headers: {
            Authorization: `ApiKey ${QASPHERE_API_KEY}`,
            'Content-Type': 'application/json',
          },
        })

        const tagsData = response.data

        // Basic validation of response
        if (!tagsData || !Array.isArray(tagsData.tags)) {
          throw new Error('Invalid response: expected an object with a "tags" array')
        }

        // if array is non-empty check if object has id and title fields
        if (tagsData.tags.length > 0) {
          const firstTag = tagsData.tags[0]
          if (firstTag.id === undefined || !firstTag.title) {
            throw new Error('Invalid tag data: missing required fields (id or title)')
          }
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(tagsData), // Use standard stringify
            },
          ],
        }
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 404) {
            throw new Error(`Project with identifier '${projectCode}' not found.`)
          }
          throw new Error(
            `Failed to fetch project tags: ${error.response?.data?.message || error.message}`
          )
        }
        throw error
      }
    }
  )
}
