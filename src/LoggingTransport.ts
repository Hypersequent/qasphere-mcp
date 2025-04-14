import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js'
import type { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import type { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js'
import * as fs from 'node:fs'
import * as path from 'node:path'

/**
 * A wrapper transport that logs all MCP communication to a file
 */
export class LoggingTransport implements Transport {
  private wrapped: StdioServerTransport
  private logStream: fs.WriteStream
  private logFile: string
  sessionId?: string

  constructor(wrapped: StdioServerTransport, logFile: string) {
    // Store wrapped transport
    this.wrapped = wrapped

    // Set up logging
    this.logFile = logFile

    // Create log directory if it doesn't exist
    const logDir = path.dirname(this.logFile)
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true })
    }

    // Create log stream
    this.logStream = fs.createWriteStream(this.logFile, { flags: 'a' })

    // Log initial connection information
    this.log({
      type: 'connection_info',
      timestamp: new Date().toISOString(),
      message: 'LoggingTransport initialized',
    })

    // Set up forwarding of events
    this.wrapped.onmessage = (message: JSONRPCMessage) => {
      this.log({
        type: 'received',
        timestamp: new Date().toISOString(),
        message,
      })
      if (this.onmessage) this.onmessage(message)
    }

    this.wrapped.onerror = (error: Error) => {
      this.log({
        type: 'error',
        timestamp: new Date().toISOString(),
        error: error.message,
        stack: error.stack,
      })
      if (this.onerror) this.onerror(error)
    }

    this.wrapped.onclose = () => {
      this.log({
        type: 'close',
        timestamp: new Date().toISOString(),
        message: 'Connection closed',
      })
      if (this.onclose) this.onclose()
      // Close the log stream when the connection closes
      this.logStream.end()
    }
  }

  // Implementation of Transport interface
  onclose?: () => void
  onerror?: (error: Error) => void
  onmessage?: (message: JSONRPCMessage) => void

  async start(): Promise<void> {
    return this.wrapped.start()
  }

  async close(): Promise<void> {
    return this.wrapped.close()
  }

  async send(message: JSONRPCMessage): Promise<void> {
    this.log({
      type: 'sent',
      timestamp: new Date().toISOString(),
      message,
    })
    return this.wrapped.send(message)
  }

  private log(data: any): void {
    try {
      this.logStream.write(`${JSON.stringify(data)}\n`)
    } catch (error) {
      console.error('Failed to write to log file:', error)
    }
  }
}
