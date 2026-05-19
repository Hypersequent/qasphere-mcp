import type { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { beforeAll, describe, expect, it } from 'vitest'
import type { ListCustomFieldsOutput } from '../../src/schemas.js'
import { env, UNLIKELY_PROJECT_CODE } from './helpers/fixtures.js'
import { callTool, getMcpHandle } from './helpers/mcp-client.js'

describe('custom fields', () => {
  let client: Client
  const projectCode = env.QASPHERE_E2E_PROJECT_CODE

  beforeAll(async () => {
    client = (await getMcpHandle()).client
  })

  describe('list_custom_fields', () => {
    it('returns an array (possibly empty) with the expected shape', async () => {
      const result = await callTool<ListCustomFieldsOutput>(client, 'list_custom_fields', {
        projectCode,
      })
      if (result.customFields && result.customFields.length > 0) {
        const field = result.customFields[0]
        expect(typeof field.id).toBe('string')
        expect(typeof field.systemName).toBe('string')
        expect(typeof field.name).toBe('string')
        expect(typeof field.type).toBe('string')
      }
    })

    it('throws not found for an unknown project code', async () => {
      await expect(
        callTool(client, 'list_custom_fields', { projectCode: UNLIKELY_PROJECT_CODE })
      ).rejects.toThrow(/not found/i)
    })
  })
})
