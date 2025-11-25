export interface TestStep {
  description: string
  expected: string
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
  comment: string // Test description/precondition
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

export interface CreateTestCaseCustomField {
  isDefault: boolean // Whether to set the default value
  value: string // Custom field value to be set
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
  comment?: string // Optional: Test case precondition (HTML)
  steps?: CreateTestCaseStep[] // Optional: List of test case steps
  tags?: string[] // Optional: List of tag titles (max 255 characters each)
  requirements?: CreateTestCaseRequirement[] // Optional: Test case requirements
  links?: CreateTestCaseLink[] // Optional: Additional links relevant to the test case
  customFields?: { [key: string]: CreateTestCaseCustomField } // Optional: Custom field values
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

export interface UpdateTestCaseCustomField {
  isDefault: boolean // Whether to set the default value
  value: string // Custom field value to be set
}

export interface UpdateTestCaseParameterValue {
  tcaseId?: string // Should be specified to update existing filled test case
  values: { [key: string]: string } // Values for the parameters in the template test case
}

export interface UpdateTestCaseRequest {
  title?: string // Optional: Test case title (1-511 characters)
  priority?: 'high' | 'medium' | 'low' // Optional: Test case priority
  comment?: string // Optional: Test case precondition (HTML)
  isDraft?: boolean // Optional: To publish a draft test case
  steps?: UpdateTestCaseStep[] // Optional: List of test case steps
  tags?: string[] // Optional: List of tag titles (max 255 characters each)
  requirements?: UpdateTestCaseRequirement[] // Optional: Test case requirements
  links?: UpdateTestCaseLink[] // Optional: Additional links relevant to the test case
  customFields?: { [key: string]: UpdateTestCaseCustomField } // Optional: Custom field values
  parameterValues?: UpdateTestCaseParameterValue[] // Optional: Values to substitute for parameters in template test cases
}

export interface UpdateTestCaseResponse {
  message: string // Success message
}
