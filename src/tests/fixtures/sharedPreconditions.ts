export const mockSharedPrecondition = {
  id: 1,
  title: 'User is logged in',
  text: '<p>User must be authenticated before running this test</p>',
  createdAt: '2024-01-01T00:00:00Z',
}

export const mockSharedPreconditions = [
  mockSharedPrecondition,
  {
    id: 2,
    title: 'Database is populated',
    text: '<p>Test database must have sample data</p>',
    createdAt: '2024-01-02T00:00:00Z',
  },
]

export const mockSharedPreconditionsWithCount = [
  {
    ...mockSharedPrecondition,
    tcaseCount: 15,
  },
]
