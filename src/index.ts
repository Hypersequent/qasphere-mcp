#!/usr/bin/env node

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { LoggingTransport } from './LoggingTransport.js'
import { registerTools } from './tools/index.js'

// Create MCP server
const server = new McpServer({
  name: 'qasphere-mcp',
  version: process.env.npm_package_version || '0.0.0',
  description: 'QA Sphere MCP server for fetching test cases and projects.',
})

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
}

startServer().catch(console.error)
