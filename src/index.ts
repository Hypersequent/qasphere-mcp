#!/usr/bin/env node

import type { Project, TestCase, TestCasesListResponse, TestFolderListResponse } from './types.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { LoggingTransport } from './LoggingTransport.js'
import { JSONStringify } from './utils.js'
import dotenv from 'dotenv'
import axios from 'axios'
import { z } from 'zod'

dotenv.config()

// Validate required environment variables
const requiredEnvVars = ['QASPHERE_TENANT_URL', 'QASPHERE_API_KEY']
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Error: Missing required environment variable: ${envVar}`)
    process.exit(1)
  }
}

const QASPHERE_TENANT_URL = ((url: string) => {
  let tenantUrl = url
  if (
    !tenantUrl.toLowerCase().startsWith('http://') &&
    !tenantUrl.toLowerCase().startsWith('https://')
  ) {
    tenantUrl = `https://${tenantUrl}`
  }
  if (tenantUrl.endsWith('/')) {
    tenantUrl = tenantUrl.slice(0, -1)
  }
  return tenantUrl
})(process.env.QASPHERE_TENANT_URL!)

const QASPHERE_API_KEY = process.env.QASPHERE_API_KEY!

// Create MCP server
const server = new McpServer({
  name: 'qasphere-mcp',
  version: process.env.npm_package_version || '0.0.0',
  description: 'QA Sphere MCP server for fetching test cases and projects.',
})

// Add the get_test_case tool
server.tool(
  'get_test_case',
  `Get a test case from QA Sphere using a marker in the format PROJECT_CODE-SEQUENCE (e.g., BDI-123). You can use URLs like: ${QASPHERE_TENANT_URL}/project/%PROJECT_CODE%/tcase/%SEQUENCE%?any Extract %PROJECT_CODE% and %SEQUENCE% from the URL and use them as the marker.`,
  {
    marker: z
      .string()
      .regex(/^[A-Z0-9]+-\d+$/, 'Marker must be in format PROJECT_CODE-SEQUENCE (e.g., BDI-123)')
      .describe('Test case marker in format PROJECT_CODE-SEQUENCE (e.g., BDI-123)'),
  },
  async ({ marker }: { marker: string }) => {
    try {
      const [projectId, sequence] = marker.split('-')
      const response = await axios.get<TestCase>(
        `${QASPHERE_TENANT_URL}/api/public/v0/project/${projectId}/tcase/${sequence}`,
        {
          headers: {
            Authorization: `ApiKey ${QASPHERE_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      )

      const testCase = response.data

      // Sanity check for required fields
      if (!testCase.id || !testCase.title || !testCase.version === undefined) {
        throw new Error('Invalid test case data: missing required fields (id, title, or version)')
      }

      return {
        content: [
          {
            type: 'text',
            text: JSONStringify(testCase, {
              comment: 'precondition',
              steps: { description: 'action', expected: 'expected_result' },
            }),
          },
        ],
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Failed to fetch test case: ${error.response?.data?.message || error.message}`
        )
      }
      throw error
    }
  }
)

server.tool(
  'get_project',
  `Get a project information from QA Sphere using a project code (e.g., BDI). You can extract PROJECT_CODE from URLs ${QASPHERE_TENANT_URL}/project/%PROJECT_CODE%/...`,
  {
    projectCode: z
      .string()
      .regex(/^[A-Z0-9]+$/, 'Marker must be in format PROJECT_CODE (e.g., BDI)')
      .describe('Project code identifier (e.g., BDI)'),
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

server.tool(
  'list_test_cases',
  'List test cases from a project in QA Sphere. Supports pagination and various filtering options. Usually it makes sense to call get_project tool first to get the project context.',
  {
    projectCode: z
      .string()
      .regex(/^[A-Z0-9]+$/, 'Project code must be in format PROJECT_CODE (e.g., BDI)')
      .describe('Project code identifier (e.g., BDI)'),
    page: z.number().optional().describe('Page number for pagination'),
    limit: z.number().optional().default(20).describe('Number of items per page'),
    sortField: z
      .enum([
        'id',
        'seq',
        'folder_id',
        'author_id',
        'pos',
        'title',
        'priority',
        'created_at',
        'updated_at',
        'legacy_id',
      ])
      .optional()
      .describe('Field to sort results by'),
    sortOrder: z
      .enum(['asc', 'desc'])
      .optional()
      .describe('Sort direction (ascending or descending)'),
    search: z.string().optional().describe('Search term to filter test cases'),
    include: z
      .array(z.enum(['steps', 'tags', 'project', 'folder', 'path']))
      .optional()
      .describe('Related data to include in the response'),
    folders: z.array(z.number()).optional().describe('Filter by folder IDs'),
    tags: z.array(z.number()).optional().describe('Filter by tag IDs'),
    priorities: z
      .array(z.enum(['high', 'medium', 'low']))
      .optional()
      .describe('Filter by priority levels'),
    draft: z.boolean().optional().describe('Filter draft vs published test cases'),
  },
  async ({
    projectCode,
    page,
    limit = 20,
    sortField,
    sortOrder,
    search,
    include,
    folders,
    tags,
    priorities,
    draft,
  }) => {
    try {
      // Build query parameters
      const params = new URLSearchParams()

      if (page !== undefined) params.append('page', page.toString())
      if (limit !== undefined) params.append('limit', limit.toString())
      if (sortField) params.append('sortField', sortField)
      if (sortOrder) params.append('sortOrder', sortOrder)
      if (search) params.append('search', search)

      // Add array parameters
      if (include) include.forEach((item) => params.append('include', item))
      if (folders) folders.forEach((item) => params.append('folders', item.toString()))
      if (tags) tags.forEach((item) => params.append('tags', item.toString()))
      if (priorities) priorities.forEach((item) => params.append('priorities', item))

      if (draft !== undefined) params.append('draft', draft.toString())

      const url = `${QASPHERE_TENANT_URL}/api/public/v0/project/${projectCode}/tcase`

      const response = await axios.get<TestCasesListResponse>(url, {
        params,
        headers: {
          Authorization: `ApiKey ${QASPHERE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      })

      const testCasesList = response.data

      // Basic validation of response
      if (!testCasesList || !Array.isArray(testCasesList.data)) {
        throw new Error('Invalid response: expected a list of test cases')
      }

      // check for other fields from TestCasesListResponse
      if (
        testCasesList.total === undefined ||
        testCasesList.page === undefined ||
        testCasesList.limit === undefined
      ) {
        throw new Error('Invalid response: missing required fields (total, page, or limit)')
      }

      // if array is non-empty check if object has id and title fields
      if (testCasesList.data.length > 0) {
        const firstTestCase = testCasesList.data[0]
        if (!firstTestCase.id || !firstTestCase.title) {
          throw new Error('Invalid test case data: missing required fields (id or title)')
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: JSONStringify(testCasesList, {
              data: {
                comment: 'precondition',
                steps: {
                  description: 'action',
                  expected: 'expected_result',
                },
              },
            }),
          },
        ],
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error(`Project with code '${projectCode}' not found.`)
        }
        throw new Error(
          `Failed to fetch test cases: ${error.response?.data?.message || error.message}`
        )
      }
      throw error
    }
  }
)

server.tool(
  'list_test_cases_folders',
  'List folders for test cases within a specific QA Sphere project. Allows pagination and sorting.',
  {
    projectCode: z
      .string()
      .regex(/^[A-Z0-9]+$/, 'Project code must be in format PROJECT_CODE (e.g., BDI)')
      .describe('Project code identifier (e.g., BDI)'),
    page: z.number().optional().describe('Page number for pagination'),
    limit: z.number().optional().default(100).describe('Number of items per page'),
    sortField: z
      .enum(['id', 'project_id', 'title', 'pos', 'parent_id', 'created_at', 'updated_at'])
      .optional()
      .describe('Field to sort results by'),
    sortOrder: z
      .enum(['asc', 'desc'])
      .optional()
      .describe('Sort direction (ascending or descending)'),
  },
  async ({ projectCode, page, limit = 100, sortField, sortOrder }) => {
    try {
      // Build query parameters
      const params = new URLSearchParams()

      if (page !== undefined) params.append('page', page.toString())
      if (limit !== undefined) params.append('limit', limit.toString())
      if (sortField) params.append('sortField', sortField)
      if (sortOrder) params.append('sortOrder', sortOrder)

      const url = `${QASPHERE_TENANT_URL}/api/public/v0/project/${projectCode}/tcase/folders`

      const response = await axios.get<TestFolderListResponse>(url, {
        params,
        headers: {
          Authorization: `ApiKey ${QASPHERE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      })

      const folderList = response.data

      // Basic validation of response
      if (!folderList || !Array.isArray(folderList.data)) {
        throw new Error('Invalid response: expected a list of folders')
      }

      // check for other fields from TestFolderListResponse
      if (
        folderList.total === undefined ||
        folderList.page === undefined ||
        folderList.limit === undefined
      ) {
        throw new Error('Invalid response: missing required fields (total, page, or limit)')
      }

      // if array is non-empty check if object has id and title fields
      if (folderList.data.length > 0) {
        const firstFolder = folderList.data[0]
        if (firstFolder.id === undefined || !firstFolder.title) {
          throw new Error('Invalid folder data: missing required fields (id or title)')
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(folderList), // Use standard stringify, no special mapping needed for folders
          },
        ],
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error(`Project with code '${projectCode}' not found.`)
        }
        throw new Error(
          `Failed to fetch test case folders: ${error.response?.data?.message || error.message}`
        )
      }
      throw error
    }
  }
)

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

// Start receiving messages on stdin and sending messages on stdout
async function startServer() {
  // Create base transport
  const baseTransport = new StdioServerTransport()

  // Wrap with logging transport if MCP_LOG_TO_FILE is set
  let transport: Transport = baseTransport

  if (process.env.MCP_LOG_TO_FILE) {
    const logFilePath = process.env.MCP_LOG_TO_FILE
    console.error(`MCP: Logging to file: ${logFilePath}`)
    transport = new LoggingTransport(baseTransport, logFilePath)
  }

  await server.connect(transport)
  console.error('QA Sphere MCP server started')
}

startServer().catch(console.error)
