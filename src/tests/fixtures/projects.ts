export const mockProject = {
  id: 'uuid-123',
  title: 'Test Project',
  code: 'TST',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

export const mockProjects = {
  projects: [
    mockProject,
    {
      id: 'uuid-456',
      title: 'Another Project',
      code: 'BDI',
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
    },
  ],
}

export const mockProjectsEmpty = {
  projects: [],
}
