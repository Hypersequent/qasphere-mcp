export interface TestStep {
  description: string;
  expected: string;
}

export interface TestTag {
  id: number;
  title: string;
}

export interface TestFile {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  url: string;
}

export interface TestRequirement {
  id: string;
  text: string;
  url: string;
}

export interface TestLink {
  text: string;
  url: string;
}

export interface TestCase {
  id: string;                    // Unique identifier of the test case
  legacyId: string;              // Legacy identifier of the test case. Empty string if the test case has no legacy ID
  version: number;               // Version of the test case. Updates to test (except folder/pos) creates a new version
  title: string;                 // Title of the test case
  seq: number;                   // Sequence number of the test case. Test cases in a project are assigned incremental sequence numbers
  folderId: number;              // Identifier of the folder where the test case is placed
  pos: number;                   // Ordered position (0 based) of the test case in its folder
  priority: 'high' | 'medium' | 'low'; // Priority of the test case
  comment: string;               // Test description/precondition
  steps: TestStep[];             // List of test case steps
  tags: TestTag[];               // List of test case tags
  files: TestFile[];             // List of files attached to the test case
  requirements: TestRequirement[];// Test case requirement (currently only single requirement is supported on UI)
  links: TestLink[];             // Additional links relevant to the test case
  authorId: number;              // Unique identifier of the user who added the test case
  isDraft: boolean;              // Whether the test case is still in draft state
  isLatestVersion: boolean;      // Whether this is the latest version of the test case
  createdAt: string;             // Test case creation time (ISO 8601 format)
  updatedAt: string;             // Test case updation time (ISO 8601 format)
}

export interface ProjectLink {
  url: string;
  text: string;
}

export interface Project {
  id: string;
  code: string;
  title: string;
  description: string;
  overviewTitle: string;
  overviewDescription: string;
  links: ProjectLink[];
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}
