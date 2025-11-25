import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp'
import axios from 'axios'
import type { Project } from '../types.js'
import { QASPHERE_API_KEY, QASPHERE_TENANT_URL } from '../config.js'
import { projectCodeSchema } from '../schemas.js'

export const registerTools = (server: McpServer) => {
  server.tool(
    'get_project',
    `Get a project information from QA Sphere using a project code (e.g., BDI). You can extract PROJECT_CODE from URLs ${QASPHERE_TENANT_URL}/project/%PROJECT_CODE%/...`,
    {
      projectCode: projectCodeSchema,
    },
    async ({ projectCode }: { projectCode: string }) => {
      try {
        const response = await axios.get<Project>(
          `${QASPHERE_TENANT_URL}/api/public/v0/project/${projectCode}`,
          {
            headers: {
              Authorization: `ApiKey ${QASPHERE_API_KEY}`,
              'Content-Type': 'application/json',
            },
          }
        )

        const projectData = response.data
        if (!projectData.id || !projectData.title) {
          throw new Error('Invalid project data: missing required fields (id or title)')
        }

        return {
          content: [{ type: 'text', text: JSON.stringify(projectData) }],
        }
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 404) {
            throw new Error(`Project with code '${projectCode}' not found.`)
          }
          throw new Error(
            `Failed to fetch project: ${error.response?.data?.message || error.message}`
          )
        }
        throw error
      }
    }
  )

  server.tool(
    'list_projects',
    'Get a list of all projects from current QA Sphere TMS account (qasphere.com)',
    {},
    async () => {
      try {
        const response = await axios.get(`${QASPHERE_TENANT_URL}/api/public/v0/project`, {
          headers: {
            Authorization: `ApiKey ${QASPHERE_API_KEY}`,
            'Content-Type': 'application/json',
          },
        })

        const projectsData = response.data
        if (!Array.isArray(projectsData.projects)) {
          throw new Error('Invalid response: expected an array of projects')
        }

        // if array is non-empty check if object has id and title fields
        if (projectsData.projects.length > 0) {
          const firstProject = projectsData.projects[0]
          if (!firstProject.id || !firstProject.title) {
            throw new Error('Invalid project data: missing required fields (id or title)')
          }
        }

        return {
          content: [{ type: 'text', text: JSON.stringify(projectsData) }],
        }
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          throw new Error(
            `Failed to fetch projects: ${error.response?.data?.message || error.message}`
          )
        }
        throw error
      }
    }
  )
}
