#!/usr/bin/env node

import { readFileSync } from 'node:fs'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js'
import { LoggingTransport } from './LoggingTransport.js'
import { buildServerInstructions, startupBanner } from './migration-notice.js'
import { registerTools } from './tools/index.js'

// Read from our own package.json rather than npm_package_version: that variable
// describes whichever package.json npm happened to load, which under `npx
// qasphere-mcp` is the consuming project's, and is unset when the binary is run
// directly. Resolved relative to this module, so it works from src/ and dist/.
const { version } = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8')
) as { version: string }

// Create MCP server
const server = new McpServer(
  {
    name: 'qasphere-mcp',
    version,
    description: 'QA Sphere MCP server for fetching test cases and projects.',
  },
  { instructions: buildServerInstructions() }
)

registerTools(server)

// Start receiving messages on stdin and sending messages on stdout
async function startServer() {
  // Create base transport
  const baseTransport = new StdioServerTransport()

  // Wrap with logging transport if MCP_LOG_TO_FILE is set
  let transport: Transport = baseTransport

  if (process.env.MCP_LOG_TO_FILE) {
    const logFilePath = process.env.MCP_LOG_TO_FILE
    console.error(`MCP: Logging to file: ${logFilePath}`)
    transport = new LoggingTransport(baseTransport, logFilePath)
  }

  await server.connect(transport)
  console.error('QA Sphere MCP server started')

  const banner = startupBanner()
  if (banner) console.error(banner)
}

startServer().catch(console.error)
