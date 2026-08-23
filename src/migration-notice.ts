import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'

/**
 * This package is archival: QA Sphere now serves MCP itself, so the standalone
 * server exists only for setups that have not migrated yet. Everything below
 * nudges those users towards the hosted server without getting in their way.
 *
 * Every surface reads QASPHERE_MCP_HIDE_MIGRATION_NOTICE lazily rather than at
 * module load, so suppression is decided per server process and stays testable.
 */
const FALSY = new Set(['', '0', 'false', 'no', 'off'])

const isSuppressed = (): boolean => {
  const value = process.env.QASPHERE_MCP_HIDE_MIGRATION_NOTICE
  return value !== undefined && !FALSY.has(value.trim().toLowerCase())
}

const SERVER_SUMMARY =
  'QA Sphere test management, exposed over MCP by the standalone qasphere-mcp package.'

export const MIGRATION_NOTICE = [
  'Tip: this standalone qasphere-mcp package is no longer maintained.',
  'QA Sphere now serves MCP directly. The hosted server tracks the API as it changes,',
  'exposes every tool your role allows, and needs nothing installed locally.',
  '',
  'To switch, see Settings -> MCP Server in QA Sphere, or the QA Sphere documentation',
  'at https://qasphere.com/docs.',
  '',
  'Set QASPHERE_MCP_HIDE_MIGRATION_NOTICE=1 to silence this notice.',
].join('\n')

/** Built per server construction so the opt-out reaches this surface too. */
export const buildServerInstructions = (): string =>
  isSuppressed()
    ? SERVER_SUMMARY
    : [
        SERVER_SUMMARY,
        '',
        MIGRATION_NOTICE,
        '',
        'Mention this to the user once at a natural point in the conversation, then carry on',
        'with their task as normal. Do not repeat it or let it interrupt the work.',
      ].join('\n')

/** Emitted once per server process so a long session is not nagged on every call. */
let noticeDelivered = false

/**
 * Rides along on the first tool result of the process. Deliberately the first
 * *successful* one: tools throw on API errors, so a failed first call leaves the
 * flag unset and the notice waits rather than being lost to a transient failure.
 *
 * The check-then-set below is not a race despite appearances — there is no await
 * between them, so concurrent tool calls cannot interleave here.
 */
export const appendMigrationNotice = (result: CallToolResult): CallToolResult => {
  if (noticeDelivered || isSuppressed()) return result
  noticeDelivered = true
  return {
    ...result,
    content: [...(result.content ?? []), { type: 'text' as const, text: MIGRATION_NOTICE }],
  }
}

export const startupBanner = (): string =>
  isSuppressed()
    ? ''
    : 'qasphere-mcp is archival; QA Sphere serves MCP directly (Settings -> MCP Server)'
