export const mockSharedStep = {
  id: 1,
  title: 'Login Step',
  subSteps: [
    {
      description: 'Enter username',
      expected: 'Username field populated',
    },
    {
      description: 'Enter password',
      expected: 'Password field populated',
    },
  ],
  createdAt: '2024-01-01T00:00:00Z',
}

export const mockSharedSteps = {
  sharedSteps: [
    mockSharedStep,
    {
      id: 2,
      title: 'Logout Step',
      subSteps: [
        {
          description: 'Click logout button',
          expected: 'User logged out',
        },
      ],
      createdAt: '2024-01-02T00:00:00Z',
    },
  ],
}

export const mockSharedStepsWithCount = {
  sharedSteps: [
    {
      ...mockSharedStep,
      tcaseCount: 10,
    },
  ],
}
