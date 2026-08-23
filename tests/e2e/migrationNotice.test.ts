import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { type IsolatedServer, startIsolatedMcpClient } from './helpers/mcp-client.js'

type ToolContent = { type: string; text?: string }

/** Distinctive enough to spot in a tool result without pinning the exact wording. */
const NOTICE_MARKER = 'no longer maintained'

const textOf = (result: { content?: unknown }): string =>
  (Array.isArray(result.content) ? (result.content as ToolContent[]) : [])
    .map((c) => c.text ?? '')
    .join('\n')

/** stderr arrives independently of the initialize response, so give it a moment. */
async function waitForStderr(server: IsolatedServer, timeoutMs = 5000): Promise<string> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (server.stderr().includes('server started')) return server.stderr()
    await new Promise((resolve) => setTimeout(resolve, 50))
  }
  return server.stderr()
}

/**
 * The notice is emitted once per server process, so every case here needs its
 * own server rather than the singleton shared by the rest of the suite.
 */
describe('hosted MCP migration notice', () => {
  describe('by default', () => {
    let server: IsolatedServer

    beforeAll(async () => {
      server = await startIsolatedMcpClient()
    })

    afterAll(async () => {
      await server.close()
    })

    it('advertises the hosted server in the MCP instructions', () => {
      const instructions = server.client.getInstructions() ?? ''
      expect(instructions).toContain(NOTICE_MARKER)
      expect(instructions).toContain('Settings -> MCP Server')
    })

    it('logs a startup banner to stderr', async () => {
      expect(await waitForStderr(server)).toContain('archival')
    })

    it('appends the notice to the first tool result and not to later ones', async () => {
      const first = await server.client.callTool({ name: 'list_projects', arguments: {} })
      expect(textOf(first)).toContain(NOTICE_MARKER)

      const second = await server.client.callTool({ name: 'list_projects', arguments: {} })
      expect(textOf(second)).not.toContain(NOTICE_MARKER)
    })
  })

  describe('with QASPHERE_MCP_HIDE_MIGRATION_NOTICE=1', () => {
    let server: IsolatedServer

    beforeAll(async () => {
      server = await startIsolatedMcpClient({ QASPHERE_MCP_HIDE_MIGRATION_NOTICE: '1' })
    })

    afterAll(async () => {
      await server.close()
    })

    it('silences all three surfaces', async () => {
      // Instructions are the easiest of the three to leave ungated, since they
      // are built once per process rather than per call — assert them explicitly.
      expect(server.client.getInstructions() ?? '').not.toContain(NOTICE_MARKER)
      expect(await waitForStderr(server)).not.toContain('archival')

      const result = await server.client.callTool({ name: 'list_projects', arguments: {} })
      expect(textOf(result)).not.toContain(NOTICE_MARKER)
    })

    it('still describes the server itself', () => {
      expect(server.client.getInstructions() ?? '').toContain('QA Sphere test management')
    })
  })

  describe('with a falsy QASPHERE_MCP_HIDE_MIGRATION_NOTICE', () => {
    let server: IsolatedServer

    beforeAll(async () => {
      server = await startIsolatedMcpClient({ QASPHERE_MCP_HIDE_MIGRATION_NOTICE: '0' })
    })

    afterAll(async () => {
      await server.close()
    })

    it('treats the notice as enabled', () => {
      expect(server.client.getInstructions() ?? '').toContain(NOTICE_MARKER)
    })
  })
})
