import type { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { beforeAll, describe, expect, it } from 'vitest'
import type { GetProjectOutput, ListProjectsOutput } from '../../src/schemas.js'
import { env, UNLIKELY_PROJECT_CODE } from './helpers/fixtures.js'
import { callTool, getMcpHandle } from './helpers/mcp-client.js'

describe('projects', () => {
  let client: Client
  const projectCode = env.QASPHERE_E2E_PROJECT_CODE

  beforeAll(async () => {
    client = (await getMcpHandle()).client
  })

  describe('list_projects', () => {
    it('returns an array containing the test project', async () => {
      const result = await callTool<ListProjectsOutput>(client, 'list_projects')
      expect(result.projects).toBeInstanceOf(Array)
      expect(result.projects?.some((p) => p.code === projectCode)).toBe(true)
    })
  })

  describe('get_project', () => {
    it('returns the test project for a valid code', async () => {
      const result = await callTool<GetProjectOutput>(client, 'get_project', { projectCode })
      expect(result.code).toBe(projectCode)
      expect(result.id).toBeTruthy()
      expect(result.title).toBeTruthy()
    })

    it('throws not found for an unknown project code', async () => {
      await expect(
        callTool(client, 'get_project', { projectCode: UNLIKELY_PROJECT_CODE })
      ).rejects.toThrow(/not found/i)
    })
  })
})
