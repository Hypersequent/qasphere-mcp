import type { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { beforeAll, describe, expect, it } from 'vitest'
import type { ListFoldersOutput, UpsertFoldersOutput } from '../../src/schemas.js'
import {
  E2E_PREFIX,
  env,
  NONCE,
  UNLIKELY_PROJECT_CODE,
  uniqueFolderPath,
} from './helpers/fixtures.js'
import { callTool, getMcpHandle } from './helpers/mcp-client.js'

describe('folders', () => {
  let client: Client
  const projectCode = env.QASPHERE_E2E_PROJECT_CODE

  beforeAll(async () => {
    client = (await getMcpHandle()).client
  })

  describe('upsert_folders', () => {
    it('creates a single folder and returns one ID', async () => {
      const folderPath = uniqueFolderPath('upsert-single')
      const result = await callTool<UpsertFoldersOutput>(client, 'upsert_folders', {
        projectCode,
        folders: [{ path: folderPath, comment: null }],
      })
      expect(result.ids).not.toBeNull()
      expect(result.ids).toHaveLength(1)
      expect(result.ids![0]).toHaveLength(1)
      expect(typeof result.ids![0][0]).toBe('number')
      expect(result.ids![0][0]).toBeGreaterThan(0)
    })

    it('creates nested folders and returns one ID per path segment', async () => {
      const rootName = uniqueFolderPath('upsert-nested')[0]
      const result = await callTool<UpsertFoldersOutput>(client, 'upsert_folders', {
        projectCode,
        folders: [{ path: [rootName, 'child', 'grandchild'], comment: null }],
      })
      expect(result.ids).not.toBeNull()
      expect(result.ids![0]).toHaveLength(3)
      for (const id of result.ids![0]) {
        expect(typeof id).toBe('number')
        expect(id).toBeGreaterThan(0)
      }
    })

    it('returns one ID array per input folder when multiple folders are sent', async () => {
      const a = uniqueFolderPath('upsert-multi-a')
      const b = uniqueFolderPath('upsert-multi-b')
      const result = await callTool<UpsertFoldersOutput>(client, 'upsert_folders', {
        projectCode,
        folders: [
          { path: a, comment: null },
          { path: b, comment: null },
        ],
      })
      expect(result.ids).not.toBeNull()
      expect(result.ids).toHaveLength(2)
      expect(result.ids![0]).toHaveLength(1)
      expect(result.ids![1]).toHaveLength(1)
      expect(result.ids![0][0]).not.toBe(result.ids![1][0])
    })

    it('returns the existing folder ID when called twice with the same path', async () => {
      const folderPath = uniqueFolderPath('upsert-idempotent')
      const first = await callTool<UpsertFoldersOutput>(client, 'upsert_folders', {
        projectCode,
        folders: [{ path: folderPath, comment: '<p>initial</p>' }],
      })
      const firstId = first.ids?.[0]?.[0]
      expect(firstId).toBeGreaterThan(0)
      const second = await callTool<UpsertFoldersOutput>(client, 'upsert_folders', {
        projectCode,
        folders: [{ path: folderPath, comment: '<p>updated</p>' }],
      })
      expect(second.ids?.[0]?.[0]).toBe(firstId)
    })

    it('reuses ancestor IDs when extending an existing path', async () => {
      const root = uniqueFolderPath('upsert-overlap')[0]
      const first = await callTool<UpsertFoldersOutput>(client, 'upsert_folders', {
        projectCode,
        folders: [{ path: [root, 'child'], comment: null }],
      })
      expect(first.ids?.[0]).toHaveLength(2)
      const rootId = first.ids![0][0]
      const childId = first.ids![0][1]
      const second = await callTool<UpsertFoldersOutput>(client, 'upsert_folders', {
        projectCode,
        folders: [{ path: [root, 'child', 'grandchild'], comment: null }],
      })
      expect(second.ids?.[0]).toHaveLength(3)
      expect(second.ids![0][0]).toBe(rootId)
      expect(second.ids![0][1]).toBe(childId)
      expect(second.ids![0][2]).toBeGreaterThan(0)
      expect(second.ids![0][2]).not.toBe(childId)
    })
  })

  describe('list_folders', () => {
    const folderName = `${E2E_PREFIX} list-folders ${NONCE}`

    beforeAll(async () => {
      // Seed enough folders so pagination assertions don't degenerate on a
      // near-empty project. Five lets us check limit=2, limit=3, and page=2.
      await callTool<UpsertFoldersOutput>(client, 'upsert_folders', {
        projectCode,
        folders: ['a', 'b', 'c', 'd', 'e'].map((suffix) => ({
          path: [`${folderName}-${suffix}`],
          comment: null,
        })),
      })
    })

    it('includes a known created folder in the list', async () => {
      const result = await callTool<ListFoldersOutput>(client, 'list_folders', {
        projectCode,
        sortField: 'created_at',
        sortOrder: 'desc',
      })
      expect(result.data).toBeInstanceOf(Array)
      expect(result.data?.some((f) => f.title === `${folderName}-a`)).toBe(true)
    })

    it('respects limit=2 and limit=3 (backend honors pagination)', async () => {
      const r2 = await callTool<ListFoldersOutput>(client, 'list_folders', {
        projectCode,
        limit: 2,
      })
      expect(r2.limit).toBe(2)
      expect(r2.total).toBeGreaterThan(2)
      expect(r2.data?.length).toBe(2)

      const r3 = await callTool<ListFoldersOutput>(client, 'list_folders', {
        projectCode,
        limit: 3,
      })
      expect(r3.limit).toBe(3)
      expect(r3.data?.length).toBe(3)
    })

    it('returns non-overlapping items on page 2', async () => {
      const page1 = await callTool<ListFoldersOutput>(client, 'list_folders', {
        projectCode,
        limit: 2,
        page: 1,
        sortField: 'id',
        sortOrder: 'asc',
      })
      const page2 = await callTool<ListFoldersOutput>(client, 'list_folders', {
        projectCode,
        limit: 2,
        page: 2,
        sortField: 'id',
        sortOrder: 'asc',
      })
      expect(page1.data?.length).toBe(2)
      expect(page2.data?.length).toBeGreaterThan(0)
      expect(page2.page).toBe(2)
      const page1Ids = new Set(page1.data?.map((f) => f.id))
      for (const f of page2.data ?? []) {
        expect(page1Ids.has(f.id)).toBe(false)
      }
    })

    it('honors sortOrder asc vs desc on id', async () => {
      const asc = await callTool<ListFoldersOutput>(client, 'list_folders', {
        projectCode,
        sortField: 'id',
        sortOrder: 'asc',
        limit: 10,
      })
      const desc = await callTool<ListFoldersOutput>(client, 'list_folders', {
        projectCode,
        sortField: 'id',
        sortOrder: 'desc',
        limit: 10,
      })
      expect(asc.data?.length).toBeGreaterThan(1)
      expect(desc.data?.length).toBeGreaterThan(1)
      expect(asc.data![0].id).not.toBe(desc.data![0].id)
      for (let i = 1; i < (asc.data?.length ?? 0); i++) {
        expect(asc.data![i].id).toBeGreaterThanOrEqual(asc.data![i - 1].id)
      }
      for (let i = 1; i < (desc.data?.length ?? 0); i++) {
        expect(desc.data![i].id).toBeLessThanOrEqual(desc.data![i - 1].id)
      }
    })

    it('throws not found for an unknown project code', async () => {
      await expect(
        callTool(client, 'list_folders', { projectCode: UNLIKELY_PROJECT_CODE })
      ).rejects.toThrow(/not found/i)
    })
  })
})
