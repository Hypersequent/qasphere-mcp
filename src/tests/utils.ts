import { type Mock, vi } from 'vitest'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp'

export const mockToolCall = (registerTools: (mcp: McpServer) => void, toolName: string) => {
  const mockServer = {
    tool: vi.fn(),
  } as any

  registerTools(mockServer)
  // [3] is the third argument for the tool. Which should be the handler function.
  const handler = mockServer.tool.mock.calls.find((call: any) => call[0] === toolName)?.[3]
  return { handler, toolMockFn: mockServer.tool as Mock }
}
