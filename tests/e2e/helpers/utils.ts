import type { Client } from '@modelcontextprotocol/sdk/client/index.js'
import type { UpsertFoldersOutput } from '../../../src/schemas.js'
import { uniqueFolderPath } from './fixtures.js'
import { callTool } from './mcp-client.js'

export async function createFolder(
  client: Client,
  projectCode: string,
  suffix: string
): Promise<number> {
  const folder = await callTool<UpsertFoldersOutput>(client, 'upsert_folders', {
    projectCode,
    folders: [{ path: uniqueFolderPath(suffix), comment: null }],
  })
  const id = folder.ids?.[0]?.[0]
  if (typeof id !== 'number' || id <= 0) {
    throw new Error(`Failed to create folder '${suffix}': ${JSON.stringify(folder)}`)
  }
  return id
}
