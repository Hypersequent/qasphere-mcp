export interface TestStep {
  description: string
  expected: string
}

export interface TestPrecondition {
  id: number // Unique identifier of the precondition
  version: number // Version of the precondition
  title: string // Title of the precondition
  text: string // Precondition text content
  type: 'shared' | 'standalone' // Type of precondition (shared across tests or standalone)
  isLatest: boolean // Whether this is the latest version of the precondition
  createdAt: string // Precondition creation time (ISO 8601 format)
  updatedAt: string // Precondition update time (ISO 8601 format)
}

export interface SharedPrecondition {
  projectId: string // Unique identifier of the project
  id: number // Unique identifier of the shared precondition
  version: number // Version of the shared precondition
  title: string // Title of the shared precondition
  type: 'shared' // Type of the precondition (always "shared" for shared preconditions)
  text: string // Text content of the precondition (HTML format)
  isLatest: boolean // Whether this is the latest version of the precondition
  createdAt: string // Precondition creation time (ISO 8601 format)
  updatedAt: string // Precondition update time (ISO 8601 format)
  deletedAt?: string | null // Date the precondition was deleted on (ISO 8601 format)
  tcaseCount?: number // Number of test cases using this shared precondition (included only when requested)
}

export type SharedPreconditionListResponse = SharedPrecondition[] // List of shared preconditions

export interface SharedSubStep {
  id: number // Unique identifier of the sub-step
  type: 'shared_sub_step' // Type of the sub-step (always shared_sub_step)
  version: number // Version of the shared step (same as parent)
  isLatest: boolean // Whether this is the latest version
  description: string // Description of the action (HTML)
  expected: string // Expected result (HTML)
  deletedAt?: string | null // Date the sub-step was deleted on (ISO 8601 format)
}

export interface SharedStep {
  id: number // Unique identifier of the shared step
  version: number // Version of the shared step
  type: 'shared' // Type of the step (always shared)
  title: string // Title of the shared step
  isLatest: boolean // Whether this is the latest version
  subSteps: SharedSubStep[] // List of sub-steps
  deletedAt?: string | null // Date the shared step was deleted on (ISO 8601 format)
  tcaseCount?: number // Number of test cases using this shared step (included only when requested)
}

export interface SharedStepListResponse {
  sharedSteps: SharedStep[] // List of shared steps
}

export interface TestTag {
  id: number
  title: string
}

export interface TestFile {
  id: string
  fileName: string
  mimeType: string
  size: number
  url: string
}

export interface TestRequirement {
  id: string
  text: string
  url: string
}

export interface TestLink {
  text: string
  url: string
}

export interface TestCase {
  id: string // Unique identifier of the test case
  legacyId: string // Legacy identifier of the test case. Empty string if the test case has no legacy ID
  version: number // Version of the test case. Updates to test (except folder/pos) creates a new version
  title: string // Title of the test case
  seq: number // Sequence number of the test case. Test cases in a project are assigned incremental sequence numbers
  folderId: number // Identifier of the folder where the test case is placed
  pos: number // Ordered position (0 based) of the test case in its folder
  priority: 'high' | 'medium' | 'low' // Priority of the test case
  /**
   * @deprecated Use `precondition` instead. This field is kept for backward compatibility.
   */
  comment: string // Test description/precondition (deprecated - use precondition instead)
  precondition?: TestPrecondition // Test precondition and setup requirements
  steps: TestStep[] // List of test case steps
  tags: TestTag[] // List of test case tags
  files: TestFile[] // List of files attached to the test case
  requirements: TestRequirement[] // Test case requirement (currently only single requirement is supported on UI)
  links: TestLink[] // Additional links relevant to the test case
  authorId: number // Unique identifier of the user who added the test case
  isDraft: boolean // Whether the test case is still in draft state
  isLatestVersion: boolean // Whether this is the latest version of the test case
  createdAt: string // Test case creation time (ISO 8601 format)
  updatedAt: string // Test case updation time (ISO 8601 format)
}

export interface TestCasesListResponse {
  total: number // Total number of filtered test cases
  page: number // Current page number
  limit: number // Number of test cases per page
  data: TestCase[] // List of test case objects
}

export interface ProjectLink {
  url: string
  text: string
}

export interface Project {
  id: string
  code: string
  title: string
  description: string
  overviewTitle: string
  overviewDescription: string
  links: ProjectLink[]
  createdAt: string
  updatedAt: string
  archivedAt: string | null
}

export interface TestFolder {
  id: number // Unique identifier for the folder
  title: string // Name of the folder
  comment: string // Additional notes or description
  pos: number // Position of the folder among its siblings
  parentId: number // ID of the parent folder (0 for root folders)
  projectId: string // ID of the project the folder belongs to
}

export interface TestFolderListResponse {
  total: number // Total number of items available
  page: number // Current page number
  limit: number // Number of items per page
  data: TestFolder[] // Array of folder objects
}

export interface BulkUpsertFolderRequest {
  path: string[] // Array of folder names representing the hierarchy
  comment?: string // Additional notes or description for the leaf folder (HTML format)
}

export interface BulkUpsertFoldersRequest {
  folders: BulkUpsertFolderRequest[] // Array of folder requests
}

export interface BulkUpsertFoldersResponse {
  ids: number[][] // Each array represents the full folder path hierarchy as an array of folder IDs
}

// Request type for test case precondition - either reference by ID or provide text
export type TestPreconditionRequest =
  | { sharedPreconditionId: number } // Reference an existing shared precondition by ID
  | { text: string } // Provide standalone precondition text

// Create Test Case API Types
export interface CreateTestCaseStep {
  sharedStepId?: number // For shared steps
  description?: string // For standalone steps
  expected?: string // For standalone steps
}

export interface CreateTestCaseRequirement {
  text: string // Title of the requirement (1-255 characters)
  url: string // URL of the requirement (1-255 characters)
}

export interface CreateTestCaseLink {
  text: string // Title of the link (1-255 characters)
  url: string // URL of the link (1-255 characters)
}

export interface TestCaseCustomFieldValue {
  isDefault?: boolean // Whether to set the default value (if true, the value field should be omitted)
  value?: string // Custom field value to be set. For text fields: any string value. For dropdown fields: must match one of the option value strings. Omit if 'isDefault' is true.
}

export interface CreateTestCaseParameterValue {
  values: { [key: string]: string } // Values for the parameters in the template test case
}

export interface CreateTestCaseRequest {
  title: string // Required: Test case title (1-511 characters)
  type: 'standalone' | 'template' // Required: Type of test case
  folderId: number // Required: ID of the folder where the test case will be placed
  priority: 'high' | 'medium' | 'low' // Required: Test case priority
  pos?: number // Optional: Position within the folder (0-based index)
  precondition?: TestPreconditionRequest // Optional: Test case precondition
  steps?: CreateTestCaseStep[] // Optional: List of test case steps
  tags?: string[] // Optional: List of tag titles (max 255 characters each)
  requirements?: CreateTestCaseRequirement[] // Optional: Test case requirements
  links?: CreateTestCaseLink[] // Optional: Additional links relevant to the test case
  customFields?: { [key: string]: TestCaseCustomFieldValue } // Optional: Custom field values
  parameterValues?: CreateTestCaseParameterValue[] // Optional: Values to substitute for parameters in template test cases
  filledTCaseTitleSuffixParams?: string[] // Optional: Parameters to append to filled test case titles
  isDraft?: boolean // Whether to create as draft, default false
}

export interface CreateTestCaseResponse {
  id: string // Unique identifier of the created test case
  seq: number // Sequence number of the test case in the project
}

// Update Test Case API Types
export interface UpdateTestCaseStep {
  sharedStepId?: number // For shared steps
  description?: string // For standalone steps
  expected?: string // For standalone steps
}

export interface UpdateTestCaseRequirement {
  text: string // Title of the requirement (1-255 characters)
  url: string // URL of the requirement (1-255 characters)
}

export interface UpdateTestCaseLink {
  text: string // Title of the link (1-255 characters)
  url: string // URL of the link (1-255 characters)
}

export interface UpdateTestCaseParameterValue {
  tcaseId?: string // Should be specified to update existing filled test case
  values: { [key: string]: string } // Values for the parameters in the template test case
}

export interface UpdateTestCaseRequest {
  title?: string // Optional: Test case title (1-511 characters)
  priority?: 'high' | 'medium' | 'low' // Optional: Test case priority
  /**
   * @deprecated Use `precondition` instead. This field is kept for backward compatibility.
   */
  comment?: string // Optional: Test case precondition (HTML)
  precondition?: TestPreconditionRequest // Optional: Test case precondition
  isDraft?: boolean // Optional: To publish a draft test case
  steps?: UpdateTestCaseStep[] // Optional: List of test case steps
  tags?: string[] // Optional: List of tag titles (max 255 characters each)
  requirements?: UpdateTestCaseRequirement[] // Optional: Test case requirements
  links?: UpdateTestCaseLink[] // Optional: Additional links relevant to the test case
  customFields?: { [key: string]: TestCaseCustomFieldValue } // Optional: Custom field values
  parameterValues?: UpdateTestCaseParameterValue[] // Optional: Values to substitute for parameters in template test cases
}

export interface MessageResponse {
  message: string // Success message
}

// Custom Fields API Types
export interface CustomFieldOption {
  id: string // Option identifier
  value: string // Option display value
}

export interface CustomField {
  id: string // Unique custom field identifier
  type: 'text' | 'dropdown' // Field type
  systemName: string // System identifier for the field (used in API requests)
  name: string // Display name of the field
  required: boolean // Whether the field is required for test cases
  enabled: boolean // Whether the field is currently enabled
  options?: CustomFieldOption[] // Available options (only for dropdown fields)
  defaultValue?: string // Default value for the field
  pos: number // Display position/order
  allowAllProjects: boolean // Whether the field is available to all projects
  allowedProjectIds?: string[] // List of project IDs if not available to all projects
  createdAt: string // ISO 8601 timestamp when the field was created
  updatedAt: string // ISO 8601 timestamp when the field was last updated
}

export interface CustomFieldsResponse {
  customFields: CustomField[] // Array of custom fields
}

// Requirements API Types
export interface RequirementIntegrationLink {
  issueId: string // Jira issue ID (e.g., "PROJ-123")
  issueTitle: string // Title of the Jira issue
  issueUrl: string // Full URL to the Jira issue
  remoteLinkId: number // Jira remote link ID
}

export interface Requirement {
  id: string // Unique identifier of the requirement (HQID7 format)
  text: string // Descriptive label for the requirement
  url: string // URL to the external requirement document (empty string if not set)
  integrationLink?: RequirementIntegrationLink // Jira integration link (only present if linked to Jira)
  tcaseCount?: number // Number of test cases linked to this requirement (only included if requested)
}

export interface RequirementsListResponse {
  requirements: Requirement[] // List of requirements
}
