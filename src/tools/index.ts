import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp'
import { registerTools as registerProjectsTools } from './projects.js'
import { registerTools as registerTestCasesTools } from './tcases.js'
import { registerTools as registerTestFoldersTools } from './folders.js'
import { registerTools as registerTestTagsTools } from './tags.js'
import { registerTools as registerCustomFieldsTools } from './customFields.js'
import { registerTools as registerRequirementsTools } from './requirements.js'

export const registerTools = (server: McpServer) => {
  registerProjectsTools(server)
  registerTestCasesTools(server)
  registerTestFoldersTools(server)
  registerTestTagsTools(server)
  registerCustomFieldsTools(server)
  registerRequirementsTools(server)
}
