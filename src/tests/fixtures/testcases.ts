export const mockTestCase = {
  id: 'uuid-456',
  title: 'Login Test',
  version: 1,
  priority: 'high',
  steps: [
    { description: 'Step 1', expected: 'Result 1' },
    { description: 'Step 2', expected: 'Result 2' },
  ],
}

export const mockTestCasesList = {
  data: [
    mockTestCase,
    {
      id: 'uuid-789',
      title: 'Logout Test',
      version: 1,
      priority: 'medium',
      steps: [],
    },
  ],
  total: 2,
  page: 1,
  limit: 20,
}

export const mockTestCasesEmpty = {
  data: [],
  total: 0,
  page: 1,
  limit: 20,
}

export const mockCreateTestCaseResponse = {
  tcase: {
    id: 'uuid-new',
    title: 'New Test Case',
    seq: 123,
  },
}
