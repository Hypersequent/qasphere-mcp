# Unit Test Plan - QA Sphere MCP

## Overview

This document outlines the unit testing strategy for the QA Sphere MCP server. Unit tests are **deterministic, fast, and isolated** - they mock all external dependencies (axios, environment variables) to test logic in isolation.

## Test Framework

- **Vitest** v4.0.16
- **Mocking**: `vi.mock()` for axios and config modules
- **Location**: `src/tests/unit/`

## Test Categories

### 1. Schema Validation Tests (`schemas.test.ts`)

Test Zod schemas for input validation.

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| Valid project code | `BDI`, `TEST`, `A1` | Passes validation |
| Project code too short | `A` | Fails with validation error |
| Project code too long | `ABCDEF` | Fails with validation error |
| Lowercase project code | `bdi` | Fails (must be uppercase) |
| Project code with special chars | `BD-I` | Fails validation |
| Valid test case marker | `BDI-123` | Passes validation |
| Invalid marker format | `BDI123`, `BDI-`, `-123` | Fails validation |
| Marker with invalid project code | `A-123` | Fails validation |

### 2. Config Module Tests (`config.test.ts`)

Test URL normalization and environment variable handling.

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| URL without protocol | `tenant.qasphere.com` | Adds `https://` prefix |
| URL with http | `http://tenant.qasphere.com` | Keeps as-is |
| URL with https | `https://tenant.qasphere.com` | Keeps as-is |
| URL with trailing slash | `https://tenant.qasphere.com/` | Removes trailing slash |
| URL with mixed case protocol | `HTTPS://tenant.qasphere.com` | Normalizes correctly |

### 3. Project Tools Tests (`tools/projects.test.ts`)

Test project listing and retrieval with mocked axios.

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| `get_project` success | Valid project code | Returns project JSON |
| `get_project` 404 | Non-existent project | Throws "not found" error |
| `get_project` invalid response | Missing id/title | Throws validation error |
| `list_projects` success | API returns projects | Returns array of projects |
| `list_projects` empty | No projects | Returns empty array |
| `list_projects` invalid response | Not an array | Throws validation error |

### 4. Test Case Tools Tests (`tools/tcases.test.ts`)

Test test case CRUD operations.

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| `get_test_case` success | Valid marker | Returns test case with renamed keys |
| `get_test_case` invalid marker | Wrong format | Throws validation error |
| `get_test_case` 404 | Non-existent | Throws "not found" error |
| `list_test_cases` success | With pagination | Returns paginated list |
| `list_test_cases` with filters | Priority, tags, folders | Correct query params |
| `list_test_cases` empty | No results | Returns empty data array |
| `create_test_case` success | Valid payload | Returns created test case |
| `create_test_case` 400 | Invalid data | Throws validation error |
| `create_test_case` 401 | Bad API key | Throws auth error |
| `create_test_case` 403 | No permission | Throws permission error |
| `update_test_case` success | Valid update | Returns success message |
| `update_test_case` 404 | Non-existent | Throws "not found" error |

### 5. Folder Tools Tests (`tools/folders.test.ts`)

Test folder listing and bulk upsert.

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| `list_folders` success | Valid project | Returns folder list |
| `list_folders` pagination | With page/limit | Correct query params |
| `list_folders` 404 | Invalid project | Throws "not found" error |
| `upsert_folders` success | Valid paths | Returns folder IDs |
| `upsert_folders` validation | Slash in folder name | Throws validation error |
| `upsert_folders` validation | Empty folder name | Throws validation error |
| `upsert_folders` 400 | Invalid request | Throws error message |

### 6. Tags Tools Tests (`tools/tags.test.ts`)

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| `list_test_cases_tags` success | Valid project | Returns tag list |
| `list_test_cases_tags` empty | No tags | Returns empty array |

### 7. Custom Fields Tools Tests (`tools/customFields.test.ts`)

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| `list_custom_fields` success | Valid project | Returns field definitions |
| `list_custom_fields` with dropdowns | Includes options | Returns options array |

### 8. Requirements Tools Tests (`tools/requirements.test.ts`)

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| `list_requirements` success | Valid project | Returns requirements |
| `list_requirements` with count | `include: tcaseCount` | Includes test case counts |
| `list_requirements` sorted | With sortField | Returns sorted results |

### 9. Shared Steps/Preconditions Tests

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| `list_shared_steps` success | Valid project | Returns shared steps |
| `get_shared_step` success | Valid ID | Returns step details |
| `list_shared_preconditions` success | Valid project | Returns preconditions |
| `get_shared_precondition` success | Valid ID | Returns precondition details |

### 10. Error Handling Tests (`error-handling.test.ts`)

Test common error scenarios across all tools.

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| Network error | Connection refused | Throws network error |
| Timeout | Request times out | Throws timeout error |
| 500 error | Server error | Throws server error message |
| Invalid JSON | Malformed response | Throws parsing error |

## Mock Data Fixtures

Create reusable mock data in `src/tests/fixtures/`:

```typescript
// fixtures/projects.ts
export const mockProject = {
  id: 'uuid-123',
  title: 'Test Project',
  code: 'TST',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

// fixtures/testcases.ts
export const mockTestCase = {
  id: 'uuid-456',
  title: 'Login Test',
  version: 1,
  priority: 'high',
  steps: [
    { description: 'Step 1', expected: 'Result 1' },
  ],
}
```

## Running Unit Tests

```bash
# Run all unit tests
npm run test:unit

# Run specific test file
npm run test:unit -- projects.test.ts

# Run with coverage
npm run test:unit -- --coverage
```

## Success Criteria

- All unit tests pass
- Test coverage > 80% for tool logic
- No network calls are made during unit tests
- Tests complete in < 5 seconds
