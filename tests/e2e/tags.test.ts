import type { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { beforeAll, describe, expect, it } from 'vitest'
import type {
  CreateTestCaseOutput,
  ListTestCasesOutput,
  ListTestCasesTagsOutput,
} from '../../src/schemas.js'
import { env, NONCE, UNLIKELY_PROJECT_CODE, uniqueTitle } from './helpers/fixtures.js'
import { callTool, getMcpHandle } from './helpers/mcp-client.js'
import { createFolder } from './helpers/utils.js'

describe('tags', () => {
  let client: Client
  const projectCode = env.QASPHERE_E2E_PROJECT_CODE
  const tagName = `e2e-tag-${NONCE}`
  let taggedTcaseSeq: number

  beforeAll(async () => {
    client = (await getMcpHandle()).client
    const folderId = await createFolder(client, projectCode, 'tags')
    const created = await callTool<CreateTestCaseOutput>(client, 'create_test_case', {
      projectCode,
      title: uniqueTitle('tag-case'),
      type: 'standalone',
      folderId,
      priority: 'medium',
      tags: [tagName],
    })
    taggedTcaseSeq = created.seq
  })

  describe('list_test_cases_tags', () => {
    it('includes the tag created above', async () => {
      const result = await callTool<ListTestCasesTagsOutput>(client, 'list_test_cases_tags', {
        projectCode,
      })
      expect(result.tags).toBeInstanceOf(Array)
      expect(result.tags?.some((t) => t.title === tagName)).toBe(true)
    })

    it('includes tcaseCount when requested', async () => {
      const result = await callTool<ListTestCasesTagsOutput>(client, 'list_test_cases_tags', {
        projectCode,
        include: 'tcaseCount',
      })
      const tag = result.tags?.find((t) => t.title === tagName)
      expect(tag?.tcaseCount).toBeGreaterThanOrEqual(1)
    })

    it('exposes a tag ID usable as a list_test_cases filter', async () => {
      const tagsList = await callTool<ListTestCasesTagsOutput>(client, 'list_test_cases_tags', {
        projectCode,
      })
      const tag = tagsList.tags?.find((t) => t.title === tagName)
      expect(typeof tag?.id).toBe('number')
      const filtered = await callTool<ListTestCasesOutput>(client, 'list_test_cases', {
        projectCode,
        tags: [tag!.id],
      })
      expect(filtered.data).toBeInstanceOf(Array)
      expect(filtered.data?.some((tc) => tc.seq === taggedTcaseSeq)).toBe(true)
    })

    it('throws not found for an unknown project code', async () => {
      await expect(
        callTool(client, 'list_test_cases_tags', { projectCode: UNLIKELY_PROJECT_CODE })
      ).rejects.toThrow(/not found/i)
    })
  })
})
