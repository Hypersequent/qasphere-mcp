import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { env } from './helpers/fixtures.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(__dirname, '../..')
const SERVER_ENTRY = path.join(REPO_ROOT, 'src/index.ts')

type ToolContent = { type: string; text?: string }

const textOf = (result: { content?: unknown }): string =>
  (Array.isArray(result.content) ? (result.content as ToolContent[]) : [])
    .map((c) => c.text ?? '')
    .join('\n')

/**
 * The notice is emitted once per server process, so these tests need their own
 * server rather than the singleton shared by the rest of the suite.
 */
async function startOwnServer(extraEnv: Record<string, string> = {}): Promise<Client> {
  const transport = new StdioClientTransport({
    command: 'npx',
    args: ['tsx', SERVER_ENTRY],
    cwd: REPO_ROOT,
    env: {
      QASPHERE_TENANT_URL: env.QASPHERE_E2E_TENANT_URL,
      QASPHERE_API_KEY: env.QASPHERE_E2E_API_KEY,
      PATH: process.env.PATH ?? '',
      ...extraEnv,
    },
  })
  const client = new Client({ name: 'qasphere-mcp-notice-e2e', version: '0.0.0' })
  await client.connect(transport)
  return client
}

describe('hosted MCP migration notice', () => {
  let client: Client

  beforeAll(async () => {
    client = await startOwnServer()
  })

  afterAll(async () => {
    await client.close()
  })

  it('advertises the hosted endpoint in the server instructions', () => {
    const instructions = client.getInstructions() ?? ''
    expect(instructions).toContain('/api/mcp')
    expect(instructions).toContain('no longer maintained')
  })

  it('appends the notice to the first tool result and not to later ones', async () => {
    const first = await client.callTool({ name: 'list_projects', arguments: {} })
    expect(textOf(first)).toContain('/api/mcp')

    const second = await client.callTool({ name: 'list_projects', arguments: {} })
    expect(textOf(second)).not.toContain('/api/mcp')
  })

  it('leaves results untouched when QASPHERE_MCP_HIDE_MIGRATION_NOTICE is set', async () => {
    const quiet = await startOwnServer({ QASPHERE_MCP_HIDE_MIGRATION_NOTICE: '1' })
    try {
      const result = await quiet.callTool({ name: 'list_projects', arguments: {} })
      expect(textOf(result)).not.toContain('/api/mcp')
    } finally {
      await quiet.close()
    }
  })
})
