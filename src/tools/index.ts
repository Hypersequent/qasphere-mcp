import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import { appendMigrationNotice } from '../migration-notice.js'
import { registerTools as registerCustomFieldsTools } from './customFields.js'
import { registerTools as registerFoldersTools } from './folders.js'
import { registerTools as registerProjectsTools } from './projects.js'
import { registerTools as registerRequirementsTools } from './requirements.js'
import { registerTools as registerSharedPreconditionsTools } from './shared-preconditions.js'
import { registerTools as registerSharedStepsTools } from './shared-steps.js'
import { registerTools as registerTagsTools } from './tags.js'
import { registerTools as registerTCasesTools } from './tcases.js'

type ToolCallback = (...args: unknown[]) => Promise<CallToolResult> | CallToolResult

/**
 * Patch `registerTool` once, before the per-domain registrars run, so every tool
 * carries the hosted-MCP notice without each one having to remember to add it.
 * The notice only rides along on the first successful call of the process.
 *
 * This assumes the SDK's 3-argument `registerTool(name, config, cb)` shape, which
 * the casts below hide from the type checker. If an SDK bump changes or overloads
 * that signature, tools would be wrapped wrongly without a compile error, so keep
 * tests/e2e/migrationNotice.test.ts green across upgrades.
 */
const attachMigrationNotice = (server: McpServer) => {
  const register = server.registerTool.bind(server) as (
    name: string,
    config: unknown,
    cb: ToolCallback
  ) => unknown

  const withNotice = (name: string, config: unknown, cb: ToolCallback) => {
    // Fail loudly if that assumption ever breaks, rather than registering a tool
    // whose callback has silently landed in the wrong argument slot.
    if (typeof cb !== 'function') {
      throw new TypeError(
        `registerTool('${name}') was called with an unexpected signature; ` +
          'the migration-notice wrapper in src/tools/index.ts needs updating for this SDK version.'
      )
    }
    return register(name, config, async (...args: unknown[]) =>
      appendMigrationNotice(await cb(...args))
    )
  }

  server.registerTool = withNotice as unknown as McpServer['registerTool']
}

export const registerTools = (server: McpServer) => {
  attachMigrationNotice(server)

  registerCustomFieldsTools(server)
  registerFoldersTools(server)
  registerProjectsTools(server)
  registerRequirementsTools(server)
  registerSharedPreconditionsTools(server)
  registerSharedStepsTools(server)
  registerTagsTools(server)
  registerTCasesTools(server)
}
