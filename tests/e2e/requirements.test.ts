import type { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { beforeAll, describe, expect, it } from 'vitest'
import type {
  CreateTestCaseOutput,
  ListRequirementsOutput,
  ListTestCasesOutput,
} from '../../src/schemas.js'
import { E2E_PREFIX, env, NONCE, UNLIKELY_PROJECT_CODE, uniqueTitle } from './helpers/fixtures.js'
import { callTool, getMcpHandle } from './helpers/mcp-client.js'
import { createFolder } from './helpers/utils.js'

describe('requirements', () => {
  let client: Client
  const projectCode = env.QASPHERE_E2E_PROJECT_CODE
  const requirementText = `${E2E_PREFIX} Req ${NONCE}`
  let tcaseSeq: number

  beforeAll(async () => {
    client = (await getMcpHandle()).client
    const folderId = await createFolder(client, projectCode, 'requirements')
    const created = await callTool<CreateTestCaseOutput>(client, 'create_test_case', {
      projectCode,
      title: uniqueTitle('req-case'),
      type: 'standalone',
      folderId,
      priority: 'medium',
      requirements: [{ text: requirementText, url: `https://example.com/req-${NONCE}` }],
    })
    tcaseSeq = created.seq
  })

  describe('list_requirements', () => {
    it('returns the requirement linked to the test case', async () => {
      const result = await callTool<ListRequirementsOutput>(client, 'list_requirements', {
        projectCode,
      })
      expect(result.requirements).toBeInstanceOf(Array)
      expect(result.requirements?.some((r) => r.text === requirementText)).toBe(true)
    })

    it('includes tcaseCount when requested', async () => {
      const result = await callTool<ListRequirementsOutput>(client, 'list_requirements', {
        projectCode,
        include: 'tcaseCount',
      })
      const req = result.requirements?.find((r) => r.text === requirementText)
      expect(req?.tcaseCount).toBeGreaterThanOrEqual(1)
    })

    it('exposes a requirement ID usable as a list_test_cases filter', async () => {
      const reqs = await callTool<ListRequirementsOutput>(client, 'list_requirements', {
        projectCode,
      })
      const req = reqs.requirements?.find((r) => r.text === requirementText)
      expect(req?.id).toBeTruthy()
      const filtered = await callTool<ListTestCasesOutput>(client, 'list_test_cases', {
        projectCode,
        requirementIds: [req!.id],
      })
      expect(filtered.data).toBeInstanceOf(Array)
      expect(filtered.data?.some((tc) => tc.seq === tcaseSeq)).toBe(true)
    })

    it('throws not found for an unknown project code', async () => {
      await expect(
        callTool(client, 'list_requirements', { projectCode: UNLIKELY_PROJECT_CODE })
      ).rejects.toThrow(/not found/i)
    })
  })
})
