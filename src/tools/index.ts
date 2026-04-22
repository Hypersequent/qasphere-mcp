import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp'
import { registerTools as registerCustomFieldsTools } from './customFields.js'
import { registerTools as registerFoldersTools } from './folders.js'
import { registerTools as registerProjectsTools } from './projects.js'
import { registerTools as registerRequirementsTools } from './requirements.js'
import { registerTools as registerSharedPreconditionsTools } from './shared-preconditions.js'
import { registerTools as registerSharedStepsTools } from './shared-steps.js'
import { registerTools as registerTagsTools } from './tags.js'
import { registerTools as registerTCasesTools } from './tcases.js'

export const registerTools = (server: McpServer) => {
  registerCustomFieldsTools(server)
  registerFoldersTools(server)
  registerProjectsTools(server)
  registerRequirementsTools(server)
  registerSharedPreconditionsTools(server)
  registerSharedStepsTools(server)
  registerTagsTools(server)
  registerTCasesTools(server)
}
