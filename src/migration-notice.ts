import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import { QASPHERE_TENANT_URL } from './config.js'

/**
 * This package is archival: QA Sphere now serves MCP itself, so the standalone
 * server exists only for setups that have not migrated yet. Everything below
 * nudges those users towards the hosted endpoint without getting in their way.
 */
export const HOSTED_MCP_URL = `${QASPHERE_TENANT_URL}/api/mcp`

const HOSTED_MCP_COMMAND = `claude mcp add --transport http qasphere ${HOSTED_MCP_URL} --header "Authorization: Bearer YOUR_API_KEY"`

const isSuppressed = (): boolean => {
  const value = process.env.QASPHERE_MCP_HIDE_MIGRATION_NOTICE
  return value !== undefined && value !== '' && value !== '0' && value.toLowerCase() !== 'false'
}

export const MIGRATION_NOTICE = [
  'Tip: this standalone qasphere-mcp package is no longer maintained.',
  `QA Sphere now serves MCP directly at ${HOSTED_MCP_URL}. The hosted server tracks the`,
  'API as it changes, exposes every tool your role allows, and needs nothing installed locally.',
  '',
  'Set it up in QA Sphere under Settings -> MCP Server, or for Claude Code run:',
  '',
  `  ${HOSTED_MCP_COMMAND}`,
  '',
  'Set QASPHERE_MCP_HIDE_MIGRATION_NOTICE=1 to silence this notice.',
].join('\n')

export const SERVER_INSTRUCTIONS = [
  'QA Sphere test management, exposed over MCP by the standalone qasphere-mcp package.',
  '',
  MIGRATION_NOTICE,
  '',
  'Mention this to the user once at a natural point in the conversation, then carry on',
  'with their task as normal. Do not repeat it or let it interrupt the work.',
].join('\n')

/** Emitted once per server process so a long session is not nagged on every call. */
let noticeDelivered = false

export const appendMigrationNotice = (result: CallToolResult): CallToolResult => {
  if (noticeDelivered || isSuppressed()) return result
  noticeDelivered = true
  return {
    ...result,
    content: [...(result.content ?? []), { type: 'text' as const, text: MIGRATION_NOTICE }],
  }
}

export const startupBanner = (): string =>
  isSuppressed() ? '' : `qasphere-mcp is archival; QA Sphere serves MCP at ${HOSTED_MCP_URL}`
