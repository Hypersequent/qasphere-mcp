/** biome-ignore-all lint/suspicious/noTemplateCurlyInString: docstrings describe QASphere's `${var}` placeholder syntax, not JS template literals */

import z from 'zod'

// ---------- Reusable output sub-schemas ----------

const projectCodeSchema = z
  .string()
  .regex(
    /^[A-Z0-9]{2,5}$/,
    'Project code must be 2 to 5 uppercase alphanumeric characters (e.g., BDI)'
  )
  .describe('Project code identifier (e.g., BDI)')

const testCaseMarkerSchema = z
  .string()
  .regex(
    /^[A-Z0-9]{2,5}-\d+$/,
    'Marker must be in format PROJECT_CODE-TEST_CASE_SEQUENCE (e.g., BDI-123). Project code must be 2 to 5 characters in format PROJECT_CODE (e.g., BDI). Test case sequence must be a number.'
  )
  .describe('Test case marker in format PROJECT_CODE-TEST_CASE_SEQUENCE (e.g., BDI-123)')

const testCaseStepInputSchema = z.object({
  sharedStepId: z
    .number()
    .int()
    .positive('Shared step ID must be a positive integer')
    .optional()
    .describe('Use a shared step by specifying its unique id. Skip for standalone step'),
  description: z
    .string()
    .optional()
    .describe(
      'Action to be performed in the step (HTML format). Required for standalone steps; skip for shared steps. In template test cases, may contain `${var}` placeholders that are substituted via `parameterValues` to produce filled test cases.'
    ),
  expected: z
    .string()
    .optional()
    .describe(
      'Expected result from the step (HTML format). Required for standalone steps; skip for shared steps. In template test cases, may contain `${var}` placeholders that are substituted via `parameterValues` to produce filled test cases.'
    ),
})

const testCaseRequirementInputSchema = z.object({
  text: z
    .string()
    .min(1, 'Requirement text must be at least 1 character')
    .max(255, 'Requirement text must be at most 255 characters')
    .describe('Title of the requirement'),
  url: z
    .url('Requirement URL must be a valid URL')
    .max(255, 'Requirement URL must be at most 255 characters')
    .or(z.literal(''))
    .describe('URL of the requirement'),
})

const testCaseLinkInputSchema = z.object({
  text: z
    .string()
    .min(1, 'Link text must be at least 1 character')
    .max(255, 'Link text must be at most 255 characters')
    .describe('Title of the link'),
  url: z
    .url('Link URL must be a valid URL')
    .min(1, 'Link URL must be at least 1 character')
    .max(255, 'Link URL must be at most 255 characters')
    .describe('URL of the link'),
})

const testCasePreconditionInputSchema = z.object({
  sharedPreconditionId: z
    .number()
    .int()
    .positive('Shared precondition ID must be a positive integer')
    .optional()
    .describe(
      'Use a shared precondition by specifying its unique id. Skip for standalone precondition'
    ),
  text: z
    .string()
    .optional()
    .describe(
      'Standalone precondition text (HTML format). Skip for shared precondition. In template test cases, may contain `${var}` placeholders that are substituted via `parameterValues` to produce filled test cases.'
    ),
})

const testCaseCustomFieldInputSchema = z.object({
  isDefault: z
    .boolean()
    .describe('Whether to use the default value (only if the field defines one)'),
  value: z.string().optional().describe('Custom field value (omit when setting the default)'),
})

type TestStep = {
  id: number
  version: number
  isLatest: boolean
  type: string
  title?: string
  description?: string
  expected?: string
  subSteps?: TestStep[]
  deletedAt?: string
}

export const testStepSchemaShape = {
  id: z.number().describe('Unique identifier of the step'),
  version: z.number().describe('Version of the step'),
  isLatest: z.boolean().describe('Whether this is the latest version of the step'),
  type: z
    .string()
    .describe('Type of the step. Known values: "standalone" | "shared" | "shared_sub_step"'),
  title: z.string().optional().describe('Title of the step (only for shared steps)'),
  description: z
    .string()
    .optional()
    .describe('Details of the step (HTML; only for standalone and shared_sub_step)'),
  expected: z
    .string()
    .optional()
    .describe('Expected result from the step (HTML; only for standalone and shared_sub_step)'),
  get subSteps() {
    return z
      .array(testStepSchema)
      .optional()
      .describe(
        "Sub-steps of a shared step, each with type 'shared_sub_step' (present only on shared steps)"
      )
  },
  deletedAt: z.string().optional().describe('Date the step was deleted on (ISO 8601)'),
}
const testStepSchema: z.ZodType<TestStep> = z.object(testStepSchemaShape)

const testTagSchema = z.object({
  id: z.number().describe('Tag identifier'),
  title: z.string().describe('Tag title'),
})

const testFileSchema = z.object({
  id: z.string().describe('File identifier'),
  fileName: z.string().describe('Original file name'),
  mimeType: z.string().describe('MIME type of the file'),
  size: z.number().describe('File size in bytes'),
  url: z.url().optional().describe('URL of the file (missing for files uploaded via older routes)'),
})

const testRequirementSchema = z.object({
  id: z.string().describe('Requirement identifier'),
  text: z.string().describe('Title of the requirement'),
  url: z.url().or(z.literal('')).describe('URL of the requirement'),
})

const requirementIntegrationLinkSchema = z.object({
  type: z.string().optional().describe('Integration type (e.g., "jira")'),
  integrationId: z.string().optional().describe('ID of the integration'),
  issueId: z.string().describe('Remote issue ID (e.g., "PROJ-123")'),
  issueTitle: z.string().describe('Title of the remote issue'),
  issueUrl: z.string().describe('Full URL of the remote issue'),
  remoteLinkId: z.string().describe('Remote link ID assigned by the integration'),
})

const requirementListItemSchema = testRequirementSchema.extend({
  integrationLink: requirementIntegrationLinkSchema
    .nullable()
    .describe('Integration link details (present only if the requirement is linked to Jira)'),
  tcaseCount: z
    .number()
    .optional()
    .describe('Number of test cases linked to this requirement (only when `tcaseCount` included)'),
})

const linkSchema = z.object({
  text: z.string().describe('Title of the link'),
  url: z.url().describe('URL of the link'),
})

const testFolderSchema = z.object({
  projectId: z.string().describe('ID of the project the folder belongs to'),
  id: z.number().describe('Unique identifier for the folder'),
  parentId: z.number().describe('ID of the parent folder (0 for root folders)'),
  pos: z.number().describe('Position of the folder among its siblings'),
  title: z.string().describe('Name of the folder'),
  comment: z.string().describe('Additional notes or description (HTML)'),
})

const testPreconditionSchema = z.object({
  projectId: z.string().describe('Project id the precondition belongs to'),
  id: z.number().describe('ID of the precondition'),
  version: z.number().describe('Version of the precondition'),
  isLatest: z.boolean().describe("Whether the precondition's version is the latest"),
  type: z.string().describe('Type of the precondition. Known values: "standalone" | "shared"'),
  title: z
    .string()
    .optional()
    .describe('Title of the precondition (only for shared preconditions)'),
  text: z.string().describe('Precondition text (HTML format)'),
  createdAt: z.string().describe('Precondition creation time (ISO 8601)'),
  updatedAt: z.string().describe('Precondition last-update time (ISO 8601)'),
  deletedAt: z.string().optional().describe('Precondition deletion time (ISO 8601)'),
})

const testCustomFieldValueSchema = z.object({
  value: z.string().describe('Current custom field value'),
  isDefault: z.boolean().describe('Whether the value is the default set by the system'),
})

const customFieldOptionSchema = z.object({
  id: z.string().describe('Option identifier'),
  value: z.string().describe('Option display value'),
})

const customFieldSchema = z.object({
  id: z.string().describe('Unique custom field identifier'),
  type: z
    .string()
    .describe('Field type. Known values: "text" | "dropdown" | "checkbox" | "richtext"'),
  systemName: z.string().describe('System identifier for the field (used in API requests)'),
  name: z.string().describe('Display name of the field'),
  required: z.boolean().describe('Whether the field is required for test cases'),
  enabled: z.boolean().describe('Whether the field is currently enabled'),
  options: z
    .array(customFieldOptionSchema)
    .nullable()
    .describe('Available options (only for dropdown fields)'),
  defaultValue: z.string().optional().describe('Default value for the field'),
  pos: z.number().describe('Display position/order'),
  allowAllProjects: z.boolean().describe('Whether the field is available to all projects'),
  allowedProjectIds: z
    .array(z.string())
    .nullable()
    .describe('List of project IDs if not available to all projects'),
  createdAt: z.string().describe('ISO 8601 timestamp when the field was created'),
  updatedAt: z.string().describe('ISO 8601 timestamp when the field was last updated'),
})

const testParameterValuesSchema = z.object({
  tcaseId: z.string().describe('ID of the filled test case'),
  tcaseVersion: z.number().describe('Version of the filled test case'),
  values: z
    .record(z.string(), z.string())
    .describe('Parameter values substituted for this filled test case'),
})

// ---------- Tool input/output schemas ----------

export const getProjectInputSchema = z.object({
  projectCode: projectCodeSchema,
})
export type GetProjectInput = z.infer<typeof getProjectInputSchema>

export const getProjectOutputSchema = z.object({
  id: z.string().describe('Unique identifier of the project'),
  code: z.string().describe('Project code (e.g., BDI)'),
  title: z.string().describe('Project title'),
  overviewTitle: z.string().describe('Project overview title'),
  overviewDescription: z.string().describe('Project overview description (HTML)'),
  links: z.array(linkSchema).nullable().describe('Project links'),
  createdAt: z.string().describe('Project creation time (ISO 8601)'),
  updatedAt: z.string().describe('Project last-update time (ISO 8601)'),
  archivedAt: z
    .string()
    .nullable()
    .describe('Project archival time (ISO 8601); null if the project is not archived'),
})
export type GetProjectOutput = z.infer<typeof getProjectOutputSchema>

export const listProjectsInputSchema = z.object({})
export type ListProjectsInput = z.infer<typeof listProjectsInputSchema>

export const listProjectsOutputSchema = z.object({
  projects: z.array(getProjectOutputSchema).nullable().describe('List of projects'),
})
export type ListProjectsOutput = z.infer<typeof listProjectsOutputSchema>

export const getTestCaseInputSchema = z.object({
  marker: testCaseMarkerSchema,
})
export type GetTestCaseInput = z.infer<typeof getTestCaseInputSchema>

export const getTestCaseOutputSchema = z.object({
  id: z.string().describe('Unique identifier of the test case'),
  legacyId: z.string().describe('Legacy identifier of the test case (empty string if none is set)'),
  version: z
    .number()
    .describe('Version of the test case. Updates (except folder/pos) create a new version'),
  type: z
    .string()
    .describe('Type of the test case. Known values: "standalone" | "template" | "filled"'),
  title: z.string().describe('Title of the test case'),
  seq: z
    .number()
    .describe('Sequence number of the test case within its project (assigned incrementally)'),
  folderId: z.number().describe('Identifier of the folder where the test case is placed'),
  pos: z.number().describe('Ordered position (0-based) of the test case in its folder'),
  priority: z
    .string()
    .describe('Priority of the test case. Known values: "high" | "medium" | "low"'),
  comment: z
    .string()
    .describe('Test case precondition text (HTML). DEPRECATED — prefer the `precondition` object'),
  precondition: testPreconditionSchema
    .optional()
    .describe('Test case precondition object (may be a shared or standalone precondition)'),
  files: z.array(testFileSchema).nullable().describe('List of files attached to the test case'),
  links: z.array(linkSchema).nullable().describe('Additional links relevant to the test case'),
  authorId: z.number().describe('Unique identifier of the user who added the test case'),
  isDraft: z.boolean().describe('Whether the test case is still in draft state'),
  isLatestVersion: z.boolean().describe('Whether this is the latest version of the test case'),
  isEmpty: z.boolean().describe('Whether the test case is empty (has no precondition and steps)'),
  steps: z.array(testStepSchema).optional().describe('List of test case steps'),
  tags: z.array(testTagSchema).optional().describe('List of test case tags'),
  requirements: z.array(testRequirementSchema).optional().describe('Test case requirements'),
  customFields: z
    .record(z.string(), testCustomFieldValueSchema)
    .optional()
    .describe('Custom field values'),
  templateTCaseId: z
    .string()
    .optional()
    .describe('Corresponding template test case ID (only for filled test cases)'),
  numFilledTCases: z
    .number()
    .optional()
    .describe('Number of corresponding filled test cases (only for template test cases)'),
  parameterValues: z
    .array(testParameterValuesSchema)
    .optional()
    .describe('Parameter substitutions for filled test cases (only for template test cases)'),
  filledTCaseTitleSuffixParams: z
    .array(z.string())
    .optional()
    .describe(
      'Parameter names whose substituted values are appended to each filled test case title for disambiguation (only for template test cases).'
    ),
  createdAt: z.string().describe('Test case creation time (ISO 8601)'),
  updatedAt: z.string().describe('Test case last-update time (ISO 8601)'),
})
export type GetTestCaseOutput = z.infer<typeof getTestCaseOutputSchema>

export const listTestCasesInputSchema = z.object({
  projectCode: projectCodeSchema,
  page: z.number().optional().describe('Page number for pagination'),
  limit: z.number().optional().default(20).describe('Number of items per page'),
  sortField: z
    .enum([
      'id',
      'seq',
      'folder_id',
      'author_id',
      'pos',
      'title',
      'priority',
      'created_at',
      'updated_at',
      'legacy_id',
    ])
    .optional()
    .describe('Field to sort results by'),
  sortOrder: z
    .enum(['asc', 'desc'])
    .optional()
    .describe('Sort direction (ascending or descending). Requires sortField.'),
  search: z.string().optional().describe('Search term to filter test cases'),
  include: z
    .array(
      z.enum([
        'precondition',
        'steps',
        'tags',
        'project',
        'folder',
        'path',
        'requirements',
        'customFields',
        'parameterValues',
      ])
    )
    .optional()
    .describe('Related data to include in the response (not present by default)'),
  folders: z.array(z.number()).optional().describe('Filter by folder IDs'),
  tags: z.array(z.number()).optional().describe('Filter by tag IDs'),
  types: z
    .array(z.enum(['standalone', 'template', 'filled']))
    .optional()
    .describe('Filter by test case type'),
  priorities: z
    .array(z.enum(['high', 'medium', 'low']))
    .optional()
    .describe('Filter by priority levels'),
  templateTCaseIds: z
    .array(z.string())
    .optional()
    .describe('Filter filled test cases by their parent template test case IDs'),
  requirementIds: z.array(z.string()).optional().describe('Filter by requirement IDs'),
  customFields: z
    .record(z.string(), z.array(z.string()))
    .optional()
    .describe(
      'Filter by custom field values. Keys are custom field system names (without the `cf_` prefix); values are arrays of allowed values.'
    ),
  draft: z.boolean().optional().describe('Filter draft vs published test cases'),
})
export type ListTestCasesInput = z.infer<typeof listTestCasesInputSchema>

export const listTestCasesOutputSchema = z.object({
  total: z.number().describe('Total number of filtered test cases'),
  page: z.number().describe('Current page number'),
  limit: z.number().describe('Number of test cases per page'),
  data: z
    .array(
      getTestCaseOutputSchema.extend({
        folder: testFolderSchema.optional().describe('Folder where the test case is placed'),
        path: z.array(testFolderSchema).optional().describe('Folder path to the test case'),
        project: getProjectOutputSchema.optional().describe('Project the test case belongs to'),
      })
    )
    .nullable()
    .describe('List of test cases'),
})
export type ListTestCasesOutput = z.infer<typeof listTestCasesOutputSchema>

export const createTestCaseInputSchema = z.object({
  projectCode: projectCodeSchema,
  title: z
    .string()
    .min(1, 'Title must be at least 1 character')
    .max(511, 'Title must be at most 511 characters')
    .describe(
      'Test case title. In template test cases, may contain `${var}` placeholders that are substituted via `parameterValues` to produce filled test case titles.'
    ),
  type: z
    .enum(['standalone', 'template'])
    .describe(
      "Type of test case. A 'template' test case uses `${var}` placeholders in its title, precondition, and step fields; each entry in `parameterValues` substitutes those placeholders to generate one filled test case."
    ),
  folderId: z
    .number()
    .int()
    .positive('Folder ID must be a positive integer')
    .describe(
      'ID of the folder where the test case will be placed. Use upsert_folders tool to create new folders or get existing folders.'
    ),
  priority: z.enum(['high', 'medium', 'low']).describe('Test case priority'),
  pos: z
    .number()
    .int()
    .min(0, 'Position must be non-negative')
    .optional()
    .describe('Position within the folder (0-based index)'),
  comment: z
    .string()
    .optional()
    .describe(
      'Test case precondition (HTML format). DEPRECATED — prefer the `precondition` object'
    ),
  precondition: testCasePreconditionInputSchema
    .optional()
    .describe(
      'Test case precondition: either `{sharedPreconditionId}` to reference a shared one, or `{text}` for a standalone precondition'
    ),
  steps: z.array(testCaseStepInputSchema).optional().describe('List of test case steps'),
  tags: z
    .array(z.string().max(255, 'Tag title must be at most 255 characters'))
    .optional()
    .describe('List of tag titles'),
  requirements: z
    .array(testCaseRequirementInputSchema)
    .optional()
    .describe('Test case requirements'),
  links: z
    .array(testCaseLinkInputSchema)
    .optional()
    .describe('Additional links relevant to the test case'),
  customFields: z
    .record(z.string(), testCaseCustomFieldInputSchema)
    .optional()
    .describe(
      'Custom field values. Keys are custom field system names. Custom fields must exist in the project (created via the web UI).'
    ),
  parameterValues: z
    .array(
      z.object({
        values: z
          .record(z.string(), z.string())
          .describe(
            'Map of parameter name to substitution value. Keys are the names inside `${...}` placeholders (without the `${}` wrapper); values must be simple strings. Each entry in the outer array produces one filled test case.'
          ),
      })
    )
    .optional()
    .describe(
      'One set of parameter substitutions per filled test case to generate from the template. Applies only when `type` is `template`; ignored for standalone test cases. A placeholder with no matching key is left untouched (e.g., `${action}` with no `action` value stays literal).'
    ),
  filledTCaseTitleSuffixParams: z
    .array(z.string())
    .optional()
    .describe(
      'Parameter names whose substituted values are appended to each filled test case title for disambiguation (e.g., pass `["env"]` to suffix titles with the `env` value).'
    ),
  isDraft: z.boolean().optional().default(false).describe('Whether to create as draft'),
})
export type CreateTestCaseInput = z.infer<typeof createTestCaseInputSchema>

export const createTestCaseOutputSchema = z.object({
  id: z.string().describe('Unique identifier of the created test case'),
  seq: z.number().describe('Sequence number of the test case in the project'),
})
export type CreateTestCaseOutput = z.infer<typeof createTestCaseOutputSchema>

export const updateTestCaseInputSchema = z.object({
  projectCode: projectCodeSchema,
  tcaseOrLegacyId: z
    .string()
    .describe(
      'Test case identifier (can be one of test case UUID, sequence or legacy ID). Note: when the target is a `filled` test case, only `priority` can be updated directly; to change other fields, update the parent template or use `parameterValues`.'
    ),
  title: z
    .string()
    .min(1, 'Title must be at least 1 character')
    .max(511, 'Title must be at most 511 characters')
    .optional()
    .describe(
      'Test case title. In template test cases, may contain `${var}` placeholders that are substituted via `parameterValues` to produce filled test case titles.'
    ),
  priority: z.enum(['high', 'medium', 'low']).optional().describe('Test case priority'),
  comment: z
    .string()
    .optional()
    .describe(
      'Test case precondition (HTML format). DEPRECATED — prefer the `precondition` object'
    ),
  precondition: testCasePreconditionInputSchema
    .optional()
    .describe(
      'Test case precondition: either `{sharedPreconditionId}` to reference a shared one, or `{text}` for a standalone precondition'
    ),
  isDraft: z
    .boolean()
    .optional()
    .describe('To publish a draft test case. A published test case cannot be converted to draft'),
  steps: z.array(testCaseStepInputSchema).optional().describe('List of test case steps'),
  tags: z
    .array(z.string().max(255, 'Tag title must be at most 255 characters'))
    .optional()
    .describe('List of tag titles'),
  requirements: z
    .array(testCaseRequirementInputSchema)
    .optional()
    .describe('Test case requirements'),
  links: z
    .array(testCaseLinkInputSchema)
    .optional()
    .describe('Additional links relevant to the test case'),
  customFields: z
    .record(z.string(), testCaseCustomFieldInputSchema)
    .optional()
    .describe(
      'Custom field values to update. Only the specified keys are modified; others remain unchanged.'
    ),
  parameterValues: z
    .array(
      z.object({
        tcaseId: z
          .string()
          .optional()
          .describe(
            'ID of an existing filled test case to update. Omit to generate a new filled test case from the template.'
          ),
        values: z
          .record(z.string(), z.string())
          .describe(
            'Map of parameter name to substitution value. Keys are the names inside `${...}` placeholders (without the `${}` wrapper); values must be simple strings.'
          ),
      })
    )
    .optional()
    .describe(
      'Full replacement of the template test case parameter values. Applies only when the target is a template test case: entries with `tcaseId` update the corresponding filled test case; entries without `tcaseId` generate a new one; any existing filled test case whose `tcaseId` is not present in this array will be deleted. To preserve existing filled test cases while appending, include their current `{tcaseId, values}` pairs.'
    ),
  filledTCaseTitleSuffixParams: z
    .array(z.string())
    .optional()
    .describe(
      'Parameter names whose substituted values are appended to each filled test case title for disambiguation (e.g., pass `["env"]` to suffix titles with the `env` value). Applies only to template test cases.'
    ),
})
export type UpdateTestCaseInput = z.infer<typeof updateTestCaseInputSchema>

export const updateTestCaseOutputSchema = z.object({
  message: z.string().describe('Success message'),
})
export type UpdateTestCaseOutput = z.infer<typeof updateTestCaseOutputSchema>

export const listFoldersInputSchema = z.object({
  projectCode: projectCodeSchema,
  page: z.number().optional().describe('Page number for pagination'),
  limit: z.number().optional().default(100).describe('Number of items per page'),
  sortField: z
    .enum(['id', 'project_id', 'title', 'pos', 'parent_id', 'created_at', 'updated_at'])
    .optional()
    .describe('Field to sort results by'),
  sortOrder: z
    .enum(['asc', 'desc'])
    .optional()
    .describe('Sort direction (ascending or descending)'),
})
export type ListFoldersInput = z.infer<typeof listFoldersInputSchema>

export const listFoldersOutputSchema = z.object({
  total: z.number().describe('Total number of items available'),
  page: z.number().describe('Current page number'),
  limit: z.number().describe('Number of items per page'),
  data: z.array(testFolderSchema).nullable().describe('List of folders'),
})
export type ListFoldersOutput = z.infer<typeof listFoldersOutputSchema>

export const upsertFoldersInputSchema = z.object({
  projectCode: projectCodeSchema,
  folders: z
    .array(
      z.object({
        path: z
          .array(z.string().min(1).max(255))
          .min(1)
          .describe('Array of folder names representing the hierarchy'),
        comment: z
          .string()
          .nullable()
          .describe(
            'Additional notes or description for the leaf folder (HTML format). Set null to keep existing comment of an existing folder.'
          ),
      })
    )
    .min(1)
    .describe('Array of folder requests to create or update'),
})
export type UpsertFoldersInput = z.infer<typeof upsertFoldersInputSchema>

export const upsertFoldersOutputSchema = z.object({
  ids: z
    .array(z.array(z.number()))
    .nullable()
    .describe('One folder-ID array per input folder, representing the full path hierarchy'),
})
export type UpsertFoldersOutput = z.infer<typeof upsertFoldersOutputSchema>

export const listTestCasesTagsInputSchema = z.object({
  projectCode: projectCodeSchema,
  sortField: z.enum(['created_at', 'title']).optional().describe('Field to sort results by'),
  sortOrder: z
    .enum(['asc', 'desc'])
    .optional()
    .describe('Sort direction (ascending or descending). Requires sortField.'),
  include: z
    .enum(['tcaseCount'])
    .optional()
    .describe('Include optional fields like the number of test cases using each tag'),
})
export type ListTestCasesTagsInput = z.infer<typeof listTestCasesTagsInputSchema>

export const listTestCasesTagsOutputSchema = z.object({
  tags: z
    .array(
      testTagSchema.extend({
        tcaseCount: z
          .number()
          .optional()
          .describe('Number of test cases using this tag (only when `tcaseCount` is included)'),
      })
    )
    .nullable()
    .describe('List of tags defined in the project'),
})
export type ListTestCasesTagsOutput = z.infer<typeof listTestCasesTagsOutputSchema>

export const listCustomFieldsInputSchema = z.object({
  projectCode: projectCodeSchema,
})
export type ListCustomFieldsInput = z.infer<typeof listCustomFieldsInputSchema>

export const listCustomFieldsOutputSchema = z.object({
  customFields: z
    .array(customFieldSchema)
    .nullable()
    .describe('List of custom fields defined in the project'),
})
export type ListCustomFieldsOutput = z.infer<typeof listCustomFieldsOutputSchema>

export const listRequirementsInputSchema = z.object({
  projectCode: projectCodeSchema,
  sortField: z.enum(['created_at', 'text']).optional().describe('Field to sort results by'),
  sortOrder: z
    .enum(['asc', 'desc'])
    .optional()
    .describe('Sort direction (ascending or descending). Requires sortField.'),
  include: z
    .enum(['tcaseCount'])
    .optional()
    .describe('Include optional fields like the number of test cases linked to each requirement'),
})
export type ListRequirementsInput = z.infer<typeof listRequirementsInputSchema>

export const listRequirementsOutputSchema = z.object({
  requirements: z
    .array(requirementListItemSchema)
    .nullable()
    .describe('List of requirements defined in the project'),
})
export type ListRequirementsOutput = z.infer<typeof listRequirementsOutputSchema>

export const getSharedPreconditionInputSchema = z.object({
  projectCode: projectCodeSchema,
  sharedPreconditionId: z
    .number()
    .int()
    .positive('Shared precondition ID must be a positive integer')
    .describe('Identifier of the shared precondition'),
})
export type GetSharedPreconditionInput = z.infer<typeof getSharedPreconditionInputSchema>

export const getSharedPreconditionOutputSchema = testPreconditionSchema
export type GetSharedPreconditionOutput = z.infer<typeof getSharedPreconditionOutputSchema>

export const listSharedPreconditionsInputSchema = z.object({
  projectCode: projectCodeSchema,
  sortField: z.enum(['created_at', 'title']).optional().describe('Field to sort results by'),
  sortOrder: z
    .enum(['asc', 'desc'])
    .optional()
    .describe('Sort direction (ascending or descending). Requires sortField.'),
  include: z
    .enum(['tcaseCount'])
    .optional()
    .describe(
      'Include optional fields like the number of test cases referencing each precondition'
    ),
})
export type ListSharedPreconditionsInput = z.infer<typeof listSharedPreconditionsInputSchema>

export const listSharedPreconditionsOutputSchema = z.object({
  sharedPreconditions: z
    .array(
      getSharedPreconditionOutputSchema.extend({
        tcaseCount: z
          .number()
          .optional()
          .describe(
            'Number of test cases using this shared precondition (only when `tcaseCount` is included)'
          ),
      })
    )
    .nullable()
    .describe('List of shared preconditions defined in the project'),
})
export type ListSharedPreconditionsOutput = z.infer<typeof listSharedPreconditionsOutputSchema>

export const getSharedStepInputSchema = z.object({
  projectCode: projectCodeSchema,
  sharedStepId: z
    .number()
    .int()
    .positive('Shared step ID must be a positive integer')
    .describe('Identifier of the shared step'),
})
export type GetSharedStepInput = z.infer<typeof getSharedStepInputSchema>

export const getSharedStepOutputSchema = testStepSchema
export type GetSharedStepOutput = z.infer<typeof getSharedStepOutputSchema>

export const listSharedStepsInputSchema = z.object({
  projectCode: projectCodeSchema,
  sortField: z.enum(['created_at', 'title']).optional().describe('Field to sort results by'),
  sortOrder: z
    .enum(['asc', 'desc'])
    .optional()
    .describe('Sort direction (ascending or descending). Requires sortField.'),
  include: z
    .enum(['tcaseCount'])
    .optional()
    .describe('Include optional fields like the number of test cases referencing each shared step'),
})
export type ListSharedStepsInput = z.infer<typeof listSharedStepsInputSchema>

export const listSharedStepsOutputSchema = z.object({
  sharedSteps: z
    .array(
      z.object({
        ...testStepSchemaShape,
        tcaseCount: z
          .number()
          .optional()
          .describe(
            'Number of test cases using this shared step (only when `tcaseCount` is included)'
          ),
      })
    )
    .nullable()
    .describe('List of shared steps defined in the project'),
})
export type ListSharedStepsOutput = z.infer<typeof listSharedStepsOutputSchema>
