import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp'
import { registerTools as registerProjectsTools } from './projects'
import { registerTools as registerTestCasesTools } from './tcases'
import { registerTools as registerTestFoldersTools } from './folders'
import { registerTools as registerTestTagsTools } from './tags'

export const registerTools = (server: McpServer) => {
  registerProjectsTools(server)
  registerTestCasesTools(server)
  registerTestFoldersTools(server)
  registerTestTagsTools(server)
}
