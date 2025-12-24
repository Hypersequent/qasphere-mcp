export const mockCustomField = {
  id: 1,
  systemName: 'test_environment',
  title: 'Test Environment',
  type: 'dropdown',
  isEnabled: true,
  options: [
    { id: 1, value: 'dev', label: 'Development' },
    { id: 2, value: 'staging', label: 'Staging' },
    { id: 3, value: 'prod', label: 'Production' },
  ],
  defaultValue: 'dev',
}

export const mockCustomFields = {
  data: [
    mockCustomField,
    {
      id: 2,
      systemName: 'test_type',
      title: 'Test Type',
      type: 'text',
      isEnabled: true,
      defaultValue: '',
    },
  ],
}
