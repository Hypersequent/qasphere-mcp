import type { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { beforeAll, describe, expect, it } from 'vitest'
import type { GetSharedStepOutput, ListSharedStepsOutput } from '../../src/schemas.js'
import { env, UNLIKELY_PROJECT_CODE } from './helpers/fixtures.js'
import { callTool, getMcpHandle } from './helpers/mcp-client.js'

describe('shared steps', () => {
  let client: Client
  const projectCode = env.QASPHERE_E2E_PROJECT_CODE
  let firstSharedStepId: number | undefined

  beforeAll(async () => {
    client = (await getMcpHandle()).client
    const list = await callTool<ListSharedStepsOutput>(client, 'list_shared_steps', {
      projectCode,
    })
    firstSharedStepId = list.sharedSteps?.[0]?.id
  })

  describe('list_shared_steps', () => {
    it('returns the shared steps list with valid shape', async () => {
      const result = await callTool<ListSharedStepsOutput>(client, 'list_shared_steps', {
        projectCode,
      })
      if (result.sharedSteps && result.sharedSteps.length > 0) {
        const step = result.sharedSteps[0]
        expect(typeof step.id).toBe('number')
        expect(typeof step.type).toBe('string')
      }
    })

    it('throws not found for an unknown project code', async () => {
      await expect(
        callTool(client, 'list_shared_steps', { projectCode: UNLIKELY_PROJECT_CODE })
      ).rejects.toThrow(/not found/i)
    })
  })

  describe('get_shared_step', () => {
    it('fetches an existing shared step when one is available', async (ctx) => {
      if (firstSharedStepId === undefined) {
        ctx.skip(
          'No shared steps in the test project — seed one in the QA Sphere UI to exercise the positive path'
        )
      }
      const result = await callTool<GetSharedStepOutput>(client, 'get_shared_step', {
        projectCode,
        sharedStepId: firstSharedStepId!,
      })
      expect(result.id).toBe(firstSharedStepId)
      expect(typeof result.type).toBe('string')
    })

    it('throws not found for a non-existent shared step ID', async () => {
      await expect(
        callTool(client, 'get_shared_step', { projectCode, sharedStepId: 99_999_999 })
      ).rejects.toThrow(/not found/i)
    })
  })
})
