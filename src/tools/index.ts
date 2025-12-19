import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp'
import { registerTools as registerProjectsTools } from './projects.js'
import { registerTools as registerTestCasesTools } from './tcases.js'
import { registerTools as registerTestFoldersTools } from './folders.js'
import { registerTools as registerTestTagsTools } from './tags.js'
import { registerTools as registerSharedPreconditionsTools } from './shared-preconditions.js'
import { registerTools as registerSharedStepsTools } from './shared-steps.js'

export const registerTools = (server: McpServer) => {
  registerProjectsTools(server)
  registerTestCasesTools(server)
  registerTestFoldersTools(server)
  registerTestTagsTools(server)
  registerSharedPreconditionsTools(server)
  registerSharedStepsTools(server)
}
