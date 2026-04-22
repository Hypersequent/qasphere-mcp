import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp'
import { ApiError, apiQuery } from '../api.js'
import {
  listFoldersInputSchema,
  listFoldersOutputSchema,
  type UpsertFoldersInput,
  upsertFoldersInputSchema,
  upsertFoldersOutputSchema,
} from '../schemas.js'

export const registerTools = (server: McpServer) => {
  server.registerTool(
    'list_folders',
    {
      title: 'List Folders',
      description:
        'List folders for test cases within a specific QA Sphere project. Allows pagination and sorting.',
      inputSchema: listFoldersInputSchema.shape,
      outputSchema: listFoldersOutputSchema.shape,
    },
    async ({ projectCode, page, limit, sortField, sortOrder }) => {
      try {
        const result = await apiQuery(`/api/public/v0/project/${projectCode}/tcase/folders`, {
          schema: listFoldersOutputSchema,
          query: { page, limit, sortField, sortOrder },
        })
        return {
          content: [{ type: 'text', text: JSON.stringify(result) }],
          structuredContent: result,
        }
      } catch (error: unknown) {
        if (error instanceof ApiError) {
          if (error.status === 404) {
            throw new Error(`Project with code '${projectCode}' not found.`)
          }
          throw new Error(`Failed to fetch test case folders: ${error.message}`)
        }
        throw error
      }
    }
  )

  server.registerTool(
    'upsert_folders',
    {
      title: 'Upsert Folders',
      description:
        "Creates or updates multiple folders in a single request using folder path hierarchies. Automatically creates nested folder structures and updates existing folders' comments. Returns an array of folder ID arrays, each representing the full folder path hierarchy as an array of folder IDs.",
      inputSchema: upsertFoldersInputSchema.shape,
      outputSchema: upsertFoldersOutputSchema.shape,
    },
    async ({ projectCode, folders }) => {
      try {
        const body: Omit<UpsertFoldersInput, 'projectCode'> = { folders }
        const result = await apiQuery(`/api/public/v0/project/${projectCode}/tcase/folder/bulk`, {
          schema: upsertFoldersOutputSchema,
          method: 'POST',
          body,
        })

        // Validate that the number of returned ID arrays matches the number of input folders
        const resultIds = result.ids ?? []
        if (resultIds.length !== folders.length) {
          throw new Error(
            `Invalid response: expected ${folders.length} folder ID arrays, got ${resultIds.length}`
          )
        }

        // Validate that each ID array has the correct length
        for (let i = 0; i < resultIds.length; i++) {
          const idArray = resultIds[i]
          const expectedLength = folders[i].path.length
          if (idArray.length !== expectedLength) {
            throw new Error(
              `Invalid response: folder ${i} expected ${expectedLength} IDs, got ${idArray.length}`
            )
          }
        }

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          structuredContent: result,
        }
      } catch (error: unknown) {
        if (error instanceof ApiError) {
          const message = error.message
          if (error.status === 400) {
            throw new Error(
              `Invalid request: ${message || 'Invalid request body or folder path format'}`
            )
          }
          if (error.status === 401) throw new Error('Invalid or missing API key')
          if (error.status === 403) throw new Error('Insufficient permissions or suspended tenant')
          if (error.status === 404) throw new Error(`Project with code '${projectCode}' not found`)
          if (error.status === 500) throw new Error('Internal server error')
          throw new Error(`Failed to bulk upsert folders: ${message}`)
        }
        throw error
      }
    }
  )
}
