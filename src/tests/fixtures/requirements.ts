export const mockRequirement = {
  id: 'req-1',
  text: 'User Authentication',
  url: 'https://jira.example.com/PROJ-123',
}

export const mockRequirements = {
  requirements: [
    mockRequirement,
    {
      id: 'req-2',
      text: 'User Authorization',
      url: 'https://jira.example.com/PROJ-124',
    },
  ],
}

export const mockRequirementsWithCount = {
  requirements: [
    {
      ...mockRequirement,
      tcaseCount: 5,
    },
    {
      id: 'req-2',
      text: 'User Authorization',
      url: 'https://jira.example.com/PROJ-124',
      tcaseCount: 3,
    },
  ],
}
