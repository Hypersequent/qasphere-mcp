export const mockFolder = {
  id: 1,
  title: 'Test Folder',
  projectId: 'uuid-123',
  pos: 0,
  parentId: null,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

export const mockFolders = {
  data: [
    mockFolder,
    {
      id: 2,
      title: 'Nested Folder',
      projectId: 'uuid-123',
      pos: 0,
      parentId: 1,
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
    },
  ],
  total: 2,
  page: 1,
  limit: 100,
}

export const mockUpsertFoldersResponse = [[1], [1, 2]]
