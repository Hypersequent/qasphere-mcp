import type { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { beforeAll, describe, expect, it } from 'vitest'
import type {
  GetSharedPreconditionOutput,
  ListSharedPreconditionsOutput,
} from '../../src/schemas.js'
import { env, UNLIKELY_PROJECT_CODE } from './helpers/fixtures.js'
import { callTool, getMcpHandle } from './helpers/mcp-client.js'

describe('shared preconditions', () => {
  let client: Client
  const projectCode = env.QASPHERE_E2E_PROJECT_CODE
  let firstSharedPreconditionId: number | undefined

  beforeAll(async () => {
    client = (await getMcpHandle()).client
    const list = await callTool<ListSharedPreconditionsOutput>(
      client,
      'list_shared_preconditions',
      { projectCode }
    )
    firstSharedPreconditionId = list.sharedPreconditions?.[0]?.id
  })

  describe('list_shared_preconditions', () => {
    it('returns the shared preconditions list with valid shape', async () => {
      const result = await callTool<ListSharedPreconditionsOutput>(
        client,
        'list_shared_preconditions',
        { projectCode }
      )
      if (result.sharedPreconditions && result.sharedPreconditions.length > 0) {
        const pre = result.sharedPreconditions[0]
        expect(typeof pre.id).toBe('number')
        expect(typeof pre.type).toBe('string')
        expect(typeof pre.text).toBe('string')
      }
    })

    it('throws not found for an unknown project code', async () => {
      await expect(
        callTool(client, 'list_shared_preconditions', { projectCode: UNLIKELY_PROJECT_CODE })
      ).rejects.toThrow(/not found/i)
    })
  })

  describe('get_shared_precondition', () => {
    it('fetches an existing shared precondition when one is available', async (ctx) => {
      if (firstSharedPreconditionId === undefined) {
        ctx.skip(
          'No shared preconditions in the test project — seed one in the QA Sphere UI to exercise the positive path'
        )
      }
      const result = await callTool<GetSharedPreconditionOutput>(
        client,
        'get_shared_precondition',
        { projectCode, sharedPreconditionId: firstSharedPreconditionId! }
      )
      expect(result.id).toBe(firstSharedPreconditionId)
      expect(typeof result.text).toBe('string')
    })

    it('throws not found for a non-existent shared precondition ID', async () => {
      await expect(
        callTool(client, 'get_shared_precondition', {
          projectCode,
          sharedPreconditionId: 99_999_999,
        })
      ).rejects.toThrow(/not found/i)
    })
  })
})
