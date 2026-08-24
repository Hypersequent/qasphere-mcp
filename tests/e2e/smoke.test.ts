import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { beforeAll, describe, expect, it } from 'vitest'
import { getMcpHandle, startIsolatedMcpClient } from './helpers/mcp-client.js'

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const PKG_VERSION = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf8'))
  .version as string

const EXPECTED_TOOLS = [
  'get_project',
  'list_projects',
  'get_test_case',
  'list_test_cases',
  'create_test_case',
  'update_test_case',
  'list_folders',
  'upsert_folders',
  'list_test_cases_tags',
  'list_custom_fields',
  'list_requirements',
  'list_shared_preconditions',
  'get_shared_precondition',
  'list_shared_steps',
  'get_shared_step',
]

describe('smoke', () => {
  let client: Client

  beforeAll(async () => {
    client = (await getMcpHandle()).client
  })

  it('exposes all expected tools via tools/list', async () => {
    const result = await client.listTools()
    const names = result.tools.map((t) => t.name)
    for (const expected of EXPECTED_TOOLS) {
      expect(names).toContain(expected)
    }
  })

  it('every registered tool advertises an input and output schema', async () => {
    const result = await client.listTools()
    for (const tool of result.tools) {
      expect(tool.inputSchema, `${tool.name} missing inputSchema`).toBeDefined()
      expect(tool.outputSchema, `${tool.name} missing outputSchema`).toBeDefined()
    }
  })

  /**
   * The version used to come from npm_package_version, which describes whichever
   * package.json npm loaded — the consuming project's under `npx qasphere-mcp`,
   * and nothing at all when the binary is run directly. A hostile value here must
   * not reach the handshake.
   */
  it('reports its own package version, not npm_package_version', async () => {
    const server = await startIsolatedMcpClient({ npm_package_version: '9.9.9-bogus' })
    try {
      expect(server.client.getServerVersion()?.version).toBe(PKG_VERSION)
    } finally {
      await server.close()
    }
  })
})
