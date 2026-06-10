/** biome-ignore-all lint/suspicious/noTemplateCurlyInString: literal `${var}` placeholders for QASphere template test cases, not JS template literals */

import type { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { beforeAll, describe, expect, it } from 'vitest'
import type {
  CreateTestCaseOutput,
  GetTestCaseOutput,
  ListTestCasesOutput,
  UpdateTestCaseOutput,
} from '../../src/schemas.js'
import { env, NONCE, UNLIKELY_PROJECT_CODE, uniqueTitle } from './helpers/fixtures.js'
import { callTool, getMcpHandle } from './helpers/mcp-client.js'
import { createFolder } from './helpers/utils.js'

describe('test cases', () => {
  let client: Client
  const projectCode = env.QASPHERE_E2E_PROJECT_CODE

  beforeAll(async () => {
    client = (await getMcpHandle()).client
  })

  describe('create_test_case', () => {
    let folderId: number

    beforeAll(async () => {
      folderId = await createFolder(client, projectCode, 'tcases-create')
    })

    it('creates a standalone test case and returns id + seq', async () => {
      const result = await callTool<CreateTestCaseOutput>(client, 'create_test_case', {
        projectCode,
        title: uniqueTitle('standalone'),
        type: 'standalone',
        folderId,
        priority: 'medium',
      })
      expect(typeof result.id).toBe('string')
      expect(result.id).toBeTruthy()
      expect(typeof result.seq).toBe('number')
      expect(result.seq).toBeGreaterThan(0)
    })

    it('persists steps, tags, requirements, and links round-trip', async () => {
      const tagName = `e2e-rt-${NONCE}`
      const reqText = `e2e-req-rt-${NONCE}`
      const created = await callTool<CreateTestCaseOutput>(client, 'create_test_case', {
        projectCode,
        title: uniqueTitle('with-fields'),
        type: 'standalone',
        folderId,
        priority: 'high',
        steps: [
          { description: '<p>open app</p>', expected: '<p>app opens</p>' },
          { description: '<p>log in</p>', expected: '<p>logged in</p>' },
        ],
        tags: [tagName],
        requirements: [{ text: reqText, url: `https://example.com/${NONCE}` }],
        links: [{ text: 'spec', url: `https://example.com/spec/${NONCE}` }],
      })

      const fetched = await callTool<GetTestCaseOutput>(client, 'get_test_case', {
        marker: `${projectCode}-${created.seq}`,
      })
      expect(fetched.steps?.length).toBe(2)
      expect(fetched.tags?.some((t) => t.title === tagName)).toBe(true)
      expect(fetched.requirements?.some((r) => r.text === reqText)).toBe(true)
      expect(fetched.links?.some((l) => l.text === 'spec')).toBe(true)
      expect(fetched.priority).toBe('high')
    })

    it('creates a template test case with parameterValues and generates filled test cases', async () => {
      const templateTitle = uniqueTitle('template-${env}')
      const created = await callTool<CreateTestCaseOutput>(client, 'create_test_case', {
        projectCode,
        title: templateTitle,
        type: 'template',
        folderId,
        priority: 'medium',
        steps: [{ description: '<p>action on ${env}</p>', expected: '<p>${expected}</p>' }],
        parameterValues: [
          { values: { env: 'dev', expected: 'ok-dev' } },
          { values: { env: 'prod', expected: 'ok-prod' } },
        ],
        filledTCaseTitleSuffixParams: ['env'],
      })

      const template = await callTool<GetTestCaseOutput>(client, 'get_test_case', {
        marker: `${projectCode}-${created.seq}`,
      })
      expect(template.type).toBe('template')
      expect(template.numFilledTCases).toBe(2)
      expect(template.parameterValues?.length).toBe(2)

      const filled = await callTool<ListTestCasesOutput>(client, 'list_test_cases', {
        projectCode,
        templateTCaseIds: [created.id],
        types: ['filled'],
      })
      expect(filled.data?.length).toBe(2)
      for (const tc of filled.data ?? []) {
        expect(tc.templateTCaseId).toBe(created.id)
        expect(tc.type).toBe('filled')
      }
    })
  })

  describe('get_test_case', () => {
    let target: CreateTestCaseOutput
    let folderId: number

    beforeAll(async () => {
      folderId = await createFolder(client, projectCode, 'tcases-get')
      target = await callTool<CreateTestCaseOutput>(client, 'create_test_case', {
        projectCode,
        title: uniqueTitle('get-target'),
        type: 'standalone',
        folderId,
        priority: 'medium',
      })
    })

    it('returns the test case by marker', async () => {
      const result = await callTool<GetTestCaseOutput>(client, 'get_test_case', {
        marker: `${projectCode}-${target.seq}`,
      })
      expect(result.seq).toBe(target.seq)
      expect(result.priority).toBe('medium')
    })

    it('throws not found for an unknown marker', async () => {
      await expect(
        callTool(client, 'get_test_case', { marker: `${projectCode}-99999999` })
      ).rejects.toThrow(/not found/i)
    })
  })

  describe('update_test_case', () => {
    let folderId: number

    beforeAll(async () => {
      folderId = await createFolder(client, projectCode, 'tcases-update')
    })

    async function createTarget(suffix: string) {
      return callTool<CreateTestCaseOutput>(client, 'create_test_case', {
        projectCode,
        title: uniqueTitle(suffix),
        type: 'standalone',
        folderId,
        priority: 'medium',
      })
    }

    it('updates the title (by sequence)', async () => {
      const tc = await createTarget('update-title')
      const newTitle = uniqueTitle('updated-title')
      await callTool<UpdateTestCaseOutput>(client, 'update_test_case', {
        projectCode,
        tcaseOrLegacyId: String(tc.seq),
        title: newTitle,
      })
      const fetched = await callTool<GetTestCaseOutput>(client, 'get_test_case', {
        marker: `${projectCode}-${tc.seq}`,
      })
      expect(fetched.title).toBe(newTitle)
    })

    it('updates the priority and leaves other fields untouched', async () => {
      const tc = await createTarget('update-priority')
      const originalTitle = uniqueTitle('update-priority')
      await callTool<UpdateTestCaseOutput>(client, 'update_test_case', {
        projectCode,
        tcaseOrLegacyId: String(tc.seq),
        priority: 'high',
      })
      const fetched = await callTool<GetTestCaseOutput>(client, 'get_test_case', {
        marker: `${projectCode}-${tc.seq}`,
      })
      expect(fetched.priority).toBe('high')
      expect(fetched.title).toBe(originalTitle)
    })

    it('updates steps round-trip', async () => {
      const tc = await createTarget('update-steps')
      await callTool<UpdateTestCaseOutput>(client, 'update_test_case', {
        projectCode,
        tcaseOrLegacyId: String(tc.seq),
        steps: [
          { description: '<p>step1</p>', expected: '<p>r1</p>' },
          { description: '<p>step2</p>', expected: '<p>r2</p>' },
          { description: '<p>step3</p>', expected: '<p>r3</p>' },
        ],
      })
      const fetched = await callTool<GetTestCaseOutput>(client, 'get_test_case', {
        marker: `${projectCode}-${tc.seq}`,
      })
      expect(fetched.steps?.length).toBe(3)
    })

    it('updates tags round-trip', async () => {
      const tc = await createTarget('update-tags')
      const newTag = `e2e-upd-${NONCE}`
      await callTool<UpdateTestCaseOutput>(client, 'update_test_case', {
        projectCode,
        tcaseOrLegacyId: String(tc.seq),
        tags: [newTag],
      })
      const fetched = await callTool<GetTestCaseOutput>(client, 'get_test_case', {
        marker: `${projectCode}-${tc.seq}`,
      })
      expect(fetched.tags?.some((t) => t.title === newTag)).toBe(true)
    })

    it('updates by UUID (tcaseOrLegacyId accepts the test case id)', async () => {
      const tc = await createTarget('update-by-uuid')
      const newTitle = uniqueTitle('updated-via-uuid')
      await callTool<UpdateTestCaseOutput>(client, 'update_test_case', {
        projectCode,
        tcaseOrLegacyId: tc.id,
        title: newTitle,
      })
      const fetched = await callTool<GetTestCaseOutput>(client, 'get_test_case', {
        marker: `${projectCode}-${tc.seq}`,
      })
      expect(fetched.title).toBe(newTitle)
    })
  })

  describe('list_test_cases', () => {
    let folderId: number
    const tagForFilter = `e2e-listfilter-${NONCE}`

    beforeAll(async () => {
      folderId = await createFolder(client, projectCode, 'tcases-list')
      // Seed enough test cases — and with a mix of priorities — so pagination
      // and filter assertions are non-trivial on a near-empty project.
      const seeds: { priority: 'high' | 'medium' | 'low'; tags?: string[] }[] = [
        { priority: 'high', tags: [tagForFilter] },
        { priority: 'high' },
        { priority: 'medium' },
        { priority: 'medium' },
        { priority: 'low' },
      ]
      let idx = 0
      for (const seed of seeds) {
        await callTool<CreateTestCaseOutput>(client, 'create_test_case', {
          projectCode,
          title: uniqueTitle(`list-seed-${idx++}`),
          type: 'standalone',
          folderId,
          priority: seed.priority,
          tags: seed.tags,
        })
      }
    })

    it('returns a paginated list with metadata', async () => {
      const result = await callTool<ListTestCasesOutput>(client, 'list_test_cases', {
        projectCode,
      })
      expect(typeof result.total).toBe('number')
      // The input defaults (offset 0, limit 20) are applied and echoed back.
      expect(result.offset).toBe(0)
      expect(result.limit).toBe(20)
    })

    it('respects limit=2 and limit=3 (backend honors pagination)', async () => {
      const r2 = await callTool<ListTestCasesOutput>(client, 'list_test_cases', {
        projectCode,
        folders: [folderId],
        limit: 2,
      })
      expect(r2.limit).toBe(2)
      expect(r2.total).toBeGreaterThanOrEqual(5)
      expect(r2.data?.length).toBe(2)

      const r3 = await callTool<ListTestCasesOutput>(client, 'list_test_cases', {
        projectCode,
        folders: [folderId],
        limit: 3,
      })
      expect(r3.limit).toBe(3)
      expect(r3.data?.length).toBe(3)
    })

    it('returns non-overlapping items with offset pagination', async () => {
      const first = await callTool<ListTestCasesOutput>(client, 'list_test_cases', {
        projectCode,
        folders: [folderId],
        limit: 2,
        offset: 0,
        sortField: 'seq',
        sortOrder: 'asc',
      })
      const second = await callTool<ListTestCasesOutput>(client, 'list_test_cases', {
        projectCode,
        folders: [folderId],
        limit: 2,
        offset: 2,
        sortField: 'seq',
        sortOrder: 'asc',
      })
      expect(first.data?.length).toBe(2)
      expect(first.offset).toBe(0)
      expect(first.limit).toBe(2)
      expect(second.data?.length).toBeGreaterThan(0)
      expect(second.offset).toBe(2)
      expect(second.limit).toBe(2)
      const firstIds = new Set(first.data?.map((tc) => tc.id))
      for (const tc of second.data ?? []) {
        expect(firstIds.has(tc.id)).toBe(false)
      }
    })

    it('returns only the total when limit=0', async () => {
      const result = await callTool<ListTestCasesOutput>(client, 'list_test_cases', {
        projectCode,
        folders: [folderId],
        limit: 0,
      })
      expect(result.limit).toBe(0)
      expect(result.total).toBeGreaterThanOrEqual(5)
      expect(result.data ?? []).toHaveLength(0)
    })

    it('honors sortOrder asc vs desc on seq', async () => {
      const asc = await callTool<ListTestCasesOutput>(client, 'list_test_cases', {
        projectCode,
        folders: [folderId],
        sortField: 'seq',
        sortOrder: 'asc',
      })
      const desc = await callTool<ListTestCasesOutput>(client, 'list_test_cases', {
        projectCode,
        folders: [folderId],
        sortField: 'seq',
        sortOrder: 'desc',
      })
      expect(asc.data?.length).toBeGreaterThan(1)
      expect(desc.data?.length).toBeGreaterThan(1)
      expect(asc.data![0].seq).toBeLessThan(desc.data![0].seq)
      for (let i = 1; i < (asc.data?.length ?? 0); i++) {
        expect(asc.data![i].seq).toBeGreaterThanOrEqual(asc.data![i - 1].seq)
      }
      for (let i = 1; i < (desc.data?.length ?? 0); i++) {
        expect(desc.data![i].seq).toBeLessThanOrEqual(desc.data![i - 1].seq)
      }
    })

    it('filters by priority', async () => {
      const result = await callTool<ListTestCasesOutput>(client, 'list_test_cases', {
        projectCode,
        folders: [folderId],
        priorities: ['high'],
      })
      expect(result.data?.length).toBeGreaterThanOrEqual(2)
      for (const tc of result.data ?? []) {
        expect(tc.priority).toBe('high')
      }
    })

    it('filters by folder', async () => {
      const result = await callTool<ListTestCasesOutput>(client, 'list_test_cases', {
        projectCode,
        folders: [folderId],
        limit: 100,
      })
      expect(result.data?.length).toBeGreaterThanOrEqual(5)
      for (const tc of result.data ?? []) {
        expect(tc.folderId).toBe(folderId)
      }
    })

    it('filters by type', async () => {
      const result = await callTool<ListTestCasesOutput>(client, 'list_test_cases', {
        projectCode,
        folders: [folderId],
        types: ['standalone'],
      })
      for (const tc of result.data ?? []) {
        expect(tc.type).toBe('standalone')
      }
    })

    it('includes steps and tags when requested', async () => {
      const result = await callTool<ListTestCasesOutput>(client, 'list_test_cases', {
        projectCode,
        folders: [folderId],
        include: ['steps', 'tags'],
        limit: 5,
      })
      for (const tc of result.data ?? []) {
        expect(tc).toHaveProperty('steps')
        expect(tc).toHaveProperty('tags')
      }
    })

    it('throws not found for an unknown project code', async () => {
      await expect(
        callTool(client, 'list_test_cases', { projectCode: UNLIKELY_PROJECT_CODE })
      ).rejects.toThrow(/not found/i)
    })
  })
})
