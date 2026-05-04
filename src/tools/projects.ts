import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp'
import { ApiError, apiQuery } from '../api.js'
import { QASPHERE_TENANT_URL } from '../config.js'
import {
  getProjectInputSchema,
  getProjectOutputSchema,
  listProjectsInputSchema,
  listProjectsOutputSchema,
} from '../schemas.js'

export const registerTools = (server: McpServer) => {
  server.registerTool(
    'get_project',
    {
      title: 'Get Project',
      description: `Get a project information from QA Sphere using a project code (e.g., BDI). You can extract PROJECT_CODE from URLs ${QASPHERE_TENANT_URL}/project/%PROJECT_CODE%/...`,
      inputSchema: getProjectInputSchema.shape,
      outputSchema: getProjectOutputSchema.shape,
    },
    async ({ projectCode }) => {
      try {
        const project = await apiQuery(`/api/public/v0/project/${projectCode}`, {
          schema: getProjectOutputSchema,
        })
        return {
          content: [{ type: 'text', text: JSON.stringify(project) }],
          structuredContent: project,
        }
      } catch (error: unknown) {
        if (error instanceof ApiError) {
          const message = error.message
          if (error.status === 401) throw new Error('Invalid or missing API key')
          if (error.status === 403) throw new Error('Insufficient permissions or suspended tenant')
          if (error.status === 404) throw new Error(`Project with code '${projectCode}' not found.`)
          if (error.status === 500) throw new Error('Internal server error while fetching project')
          throw new Error(`Failed to fetch project: ${message}`)
        }
        throw error
      }
    }
  )

  server.registerTool(
    'list_projects',
    {
      title: 'List Projects',
      description: 'Get a list of all projects from current QA Sphere TMS account (qasphere.com)',
      inputSchema: listProjectsInputSchema.shape,
      outputSchema: listProjectsOutputSchema.shape,
    },
    async () => {
      try {
        const projects = await apiQuery('/api/public/v0/project', {
          schema: listProjectsOutputSchema,
        })
        return {
          content: [{ type: 'text', text: JSON.stringify(projects) }],
          structuredContent: projects,
        }
      } catch (error: unknown) {
        if (error instanceof ApiError) {
          const message = error.message
          if (error.status === 401) throw new Error('Invalid or missing API key')
          if (error.status === 403) throw new Error('Insufficient permissions or suspended tenant')
          if (error.status === 500) throw new Error('Internal server error while fetching projects')
          throw new Error(`Failed to fetch projects: ${message}`)
        }
        throw error
      }
    }
  )
}
