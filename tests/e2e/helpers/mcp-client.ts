import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { env } from './fixtures.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(__dirname, '../../..')
const SERVER_ENTRY = path.join(REPO_ROOT, 'src/index.ts')

export const STDERR_LOG = path.join(os.tmpdir(), 'qasphere-mcp-e2e.stderr.log')

export type McpHandle = {
  client: Client
  close: () => Promise<void>
}

let cached: McpHandle | undefined
let pending: Promise<McpHandle> | undefined

async function startMcpClient(): Promise<McpHandle> {
  // Truncate the previous run's log so failures show only this run's output.
  fs.writeFileSync(STDERR_LOG, '')

  const transport = new StdioClientTransport({
    command: 'npx',
    args: ['tsx', SERVER_ENTRY],
    cwd: REPO_ROOT,
    env: {
      QASPHERE_TENANT_URL: env.QASPHERE_E2E_TENANT_URL,
      QASPHERE_API_KEY: env.QASPHERE_E2E_API_KEY,
      PATH: process.env.PATH ?? '',
    },
    stderr: 'pipe',
  })

  const client = new Client({ name: 'qasphere-mcp-e2e', version: '0.0.0' }, { capabilities: {} })
  await client.connect(transport)

  const stderr = (transport as unknown as { stderr?: NodeJS.ReadableStream }).stderr
  if (stderr && typeof stderr.pipe === 'function') {
    stderr.pipe(fs.createWriteStream(STDERR_LOG, { flags: 'w' }))
  }
  // Surface the log path once so a failing run can be inspected.
  console.error(`[e2e] MCP server stderr → ${STDERR_LOG}`)

  return {
    client,
    close: async () => {
      await client.close()
    },
  }
}

export async function getMcpHandle(): Promise<McpHandle> {
  if (cached) return cached
  if (pending) return pending
  pending = startMcpClient()
    .then((handle) => {
      cached = handle
      return handle
    })
    .finally(() => {
      pending = undefined
    })
  return pending
}

export async function closeMcpHandle(): Promise<void> {
  const handle = cached
  cached = undefined
  if (handle) await handle.close()
}

// Best-effort cleanup if the worker exits without an explicit teardown.
// The MCP server also exits naturally when its stdin closes, so this is belt-and-braces.
process.once('beforeExit', () => {
  void closeMcpHandle().catch(() => {})
})

type ToolContent = { type: string; text?: string }

export async function callTool<T = unknown>(
  client: Client,
  name: string,
  args: Record<string, unknown> = {}
): Promise<T> {
  const result = await client.callTool({ name, arguments: args })
  if (result.isError) {
    const content = Array.isArray(result.content) ? (result.content as ToolContent[]) : []
    const text = content
      .map((c) => c.text ?? '')
      .filter(Boolean)
      .join('\n')
    throw new Error(text || `Tool ${name} returned isError without content`)
  }
  if (result.structuredContent === undefined) {
    throw new Error(`Tool ${name} returned no structuredContent`)
  }
  return result.structuredContent as T
}
