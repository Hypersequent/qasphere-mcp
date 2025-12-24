export const mockTag = {
  id: 1,
  title: 'smoke',
  projectId: 'uuid-123',
  createdAt: '2024-01-01T00:00:00Z',
}

export const mockTags = {
  data: [
    mockTag,
    {
      id: 2,
      title: 'regression',
      projectId: 'uuid-123',
      createdAt: '2024-01-02T00:00:00Z',
    },
  ],
}

export const mockTagsEmpty = {
  data: [],
}
