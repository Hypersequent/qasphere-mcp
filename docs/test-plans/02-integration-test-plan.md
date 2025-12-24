# Integration Test Plan - QA Sphere MCP

## Overview

This document outlines the integration testing strategy for the QA Sphere MCP server. Integration tests verify that the MCP tools work correctly against **real QA Sphere API endpoints**.

## Test Environment

- **QA Sphere Instance**: `https://e2eqas.eu1.qasphere.com`
- **Test Project Code**: `MCP` (to be created for testing)
- **Environment Variables**:
  - `QASPHERE_TENANT_URL`: Test instance URL
  - `QASPHERE_API_KEY`: Test API key

## Test Framework

- **Vitest** v4.0.16
- **Real HTTP calls**: No mocking of axios
- **Location**: `src/tests/integration/`
- **Timeout**: 30 seconds per test (network latency)

## Prerequisites

Before running integration tests:

1. Ensure test QA Sphere account is accessible
2. Set environment variables in `.env.test` or CI secrets
3. Create a dedicated test project (code: `MCP`)

## Test Categories

### 1. Project API Tests (`projects.integration.test.ts`)

| Test Case | Description | Validation |
|-----------|-------------|------------|
| List all projects | Call `list_projects` | Returns array with at least 1 project |
| Get project by code | Call `get_project` with valid code | Returns project with matching code |
| Get non-existent project | Call `get_project` with `XXX` | Throws 404 error |

### 2. Folder API Tests (`folders.integration.test.ts`)

| Test Case | Description | Validation |
|-----------|-------------|------------|
| List folders | Call `list_folders` for test project | Returns folder list with pagination |
| Create single folder | `upsert_folders` with one path | Returns folder ID |
| Create nested folders | `upsert_folders` with `['A', 'B', 'C']` | Returns 3 folder IDs in hierarchy |
| Update folder comment | `upsert_folders` same path, new comment | Updates without creating duplicate |
| List with pagination | `list_folders` page=1, limit=5 | Returns correct page size |

### 3. Test Case API Tests (`tcases.integration.test.ts`)

| Test Case | Description | Validation |
|-----------|-------------|------------|
| List test cases | Call `list_test_cases` | Returns paginated list |
| List with search | Search for specific title | Returns matching results |
| List with priority filter | Filter by `high` priority | All results have high priority |
| List with include | Include `steps`, `tags` | Response includes step/tag data |
| Get test case by marker | `get_test_case` with valid marker | Returns full test case |
| Get non-existent test case | Invalid marker | Throws 404 error |
| Create standalone test case | Create with required fields | Returns created test case ID |
| Create with steps | Include test steps | Steps are saved correctly |
| Create with tags | Include tag titles | Tags are created/linked |
| Update test case title | Change title | Title is updated |
| Update test case priority | Change priority | Priority is updated |

### 4. Tags API Tests (`tags.integration.test.ts`)

| Test Case | Description | Validation |
|-----------|-------------|------------|
| List tags | Call `list_test_cases_tags` | Returns tag list |
| Tags reflect created tags | After creating test case with tag | Tag appears in list |

### 5. Custom Fields API Tests (`customFields.integration.test.ts`)

| Test Case | Description | Validation |
|-----------|-------------|------------|
| List custom fields | Call `list_custom_fields` | Returns field definitions |
| Field types | Check field types | Returns text/dropdown types |

### 6. Requirements API Tests (`requirements.integration.test.ts`)

| Test Case | Description | Validation |
|-----------|-------------|------------|
| List requirements | Call `list_requirements` | Returns requirement list |
| Requirements with count | Include `tcaseCount` | Includes linked test case count |
| Filter test cases by requirement | Use `requirementIds` filter | Returns linked test cases |

### 7. Shared Steps API Tests (`shared-steps.integration.test.ts`)

| Test Case | Description | Validation |
|-----------|-------------|------------|
| List shared steps | Call `list_shared_steps` | Returns shared step list |
| Get shared step | Get by ID | Returns step with sub-steps |

### 8. Shared Preconditions API Tests (`shared-preconditions.integration.test.ts`)

| Test Case | Description | Validation |
|-----------|-------------|------------|
| List preconditions | Call `list_shared_preconditions` | Returns precondition list |
| Get precondition | Get by ID | Returns precondition text |

## Test Data Management

### Setup Strategy

```typescript
// Before each test file
beforeAll(async () => {
  // Ensure test folder exists
  await createTestFolder('Integration Tests')
})

// After each test
afterEach(async () => {
  // Clean up created test data
  await cleanupTestData()
})
```

### Test Data Naming Convention

All test data should be prefixed with `[MCP-TEST]` for easy identification:
- Folder: `[MCP-TEST] Integration Folder`
- Test Case: `[MCP-TEST] Login Verification`
- Tag: `mcp-test-tag`

### Cleanup Strategy

- Tests create data in a dedicated test folder
- `afterAll` hook deletes test folder and contents
- Failed test cleanup is handled by next test run

## Environment Configuration

Create `.env.test`:

```env
QASPHERE_TENANT_URL=https://e2eqas.eu1.qasphere.com
QASPHERE_API_KEY=your-test-api-key
QASPHERE_TEST_PROJECT=MCP
```

## Running Integration Tests

```bash
# Set environment and run
QASPHERE_TENANT_URL=https://e2eqas.eu1.qasphere.com \
QASPHERE_API_KEY=your-key \
npm run test:integration

# Run specific test file
npm run test:integration -- folders.integration.test.ts

# Run with verbose output
npm run test:integration -- --reporter=verbose
```

## CI/CD Integration

```yaml
# GitHub Actions example
integration-tests:
  runs-on: ubuntu-latest
  env:
    QASPHERE_TENANT_URL: ${{ secrets.QASPHERE_TENANT_URL }}
    QASPHERE_API_KEY: ${{ secrets.QASPHERE_API_KEY }}
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
    - run: npm ci
    - run: npm run test:integration
```

## Success Criteria

- All integration tests pass against live QA Sphere instance
- Tests complete within 5 minutes total
- No test data pollution (cleanup works correctly)
- Tests are idempotent (can run multiple times)

## Troubleshooting

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Check API key is valid and not expired |
| 403 Forbidden | Verify API key has sufficient permissions |
| Timeout errors | Increase test timeout or check network |
| Data conflicts | Run cleanup manually, check for stale data |
