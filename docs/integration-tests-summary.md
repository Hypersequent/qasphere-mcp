# Integration Tests Implementation Summary

## Overview

Integration tests have been successfully implemented for the QA Sphere MCP server. These tests validate that the MCP tools work correctly against real QA Sphere API endpoints.

## Implementation Details

### Test Structure

```
src/tests/integration/
├── setup.ts                              # Global test setup
├── helpers.ts                            # Shared utilities and authentication
├── projects.integration.test.ts          # Project API tests
├── folders.integration.test.ts           # Folder API tests ✅ PASSING
├── tcases.integration.test.ts            # Test Case API tests
├── tags.integration.test.ts              # Tags API tests
├── customFields.integration.test.ts      # Custom Fields API tests
└── requirements.integration.test.ts      # Requirements API tests
```

### Key Features

1. **Authentication**: Uses internal API login with session tokens
   - Credentials stored in environment variables
   - Session token is cached to avoid rate limiting
   - Single login shared across all test files

2. **Dynamic Project Creation**:
   - Each test suite creates a temporary project
   - Random project codes prevent conflicts
   - Automatic cleanup in `afterAll` hooks

3. **Environment Variables**:
   - `QASPHERE_TENANT_URL`: QA Sphere instance URL (default: https://e2eqas.eu1.qasphere.com)
   - `QASPHERE_API_KEY`: API key for public API access
   - `QASPHERE_AUTH_PASSWORD`: Password for internal API login (uses default for local, secret in CI)

### Test Coverage

#### Projects API ✅
- List all projects
- Get project by code
- Handle 404 for non-existent projects

#### Folders API ✅ PASSING
- List folders with pagination
- Create single folder
- Create nested folder hierarchies
- Update folder comments (upsert behavior)
- Pagination parameters

#### Test Cases API
- List test cases with pagination
- Filter by search term
- Filter by priority
- Include related data (steps, tags)
- Create standalone test case
- Create test case with steps
- Create test case with tags
- Get test case by marker
- Update test case title and priority

#### Tags API
- List all tags
- Verify tags created with test cases

#### Custom Fields API
- List custom field definitions
- Verify field types (text, dropdown)

#### Requirements API
- List requirements
- Include test case counts
- Filter test cases by requirement

## CI/CD Integration

The GitHub Actions workflow `.github/workflows/ci.yml` includes integration tests as part of the main CI job:

**Execution order:**
1. Lint/Format checks
2. Type check
3. Build
4. Unit tests
5. **Integration tests** (only run if all previous steps pass)

**Environment variables** (from GitHub secrets):
- `QASPHERE_API_KEY` - Public API access
- `QASPHERE_AUTH_PASSWORD` - Internal API authentication

This approach ensures:
- Integration tests only run if unit tests pass
- No wasted API calls on failing builds
- Single job keeps CI fast and efficient

## Running Tests

### Locally

```bash
# Set environment variables
export QASPHERE_TENANT_URL=https://e2eqas.eu1.qasphere.com
export QASPHERE_API_KEY=<your-api-key>
# Optional: export QASPHERE_AUTH_PASSWORD=<your-password>

# Run all integration tests
npm run test:integration

# Run specific test file
npm run test:integration -- folders.integration.test.ts
```

### In CI

Tests run automatically when:
- Code is pushed to main branch
- Pull request is created or updated

## Current Status

✅ **Completed**:
- Test infrastructure and helpers
- Project creation/deletion via internal API
- Cached session management to avoid rate limiting
- All 6 test suites implemented
- Folders test suite passing completely
- CI/CD workflow configured

⚠️ **Known Issues**:
1. Rate limiting can occur if tests are run too frequently (30-second cooldown recommended)
2. Some test suites need validation after rate limiting clears

## Next Steps

1. Validate remaining test suites once rate limiting clears
2. Add shared steps and preconditions tests if needed
3. Consider adding retry logic for rate-limited requests
4. Document GitHub secrets setup for new contributors

## Test Execution Example

```
$ npm run test:integration

> qasphere-mcp@0.3.0 test:integration
> vitest run src/tests/integration

Logging in for integration tests...
Login successful

✓ src/tests/integration/folders.integration.test.ts (5 tests) 3474ms
  ✓ Folder API Integration Tests > list_folders > should return folder list with pagination  306ms
  ✓ Folder API Integration Tests > list_folders > should respect pagination parameters  618ms
  ✓ Folder API Integration Tests > upsert_folders > should create single folder  308ms
  ✓ Folder API Integration Tests > upsert_folders > should create nested folders  312ms
  ✓ Folder API Integration Tests > upsert_folders > should update folder comment without creating duplicate  618ms

Test Files  1 passed (1)
Tests  5 passed (5)
```
