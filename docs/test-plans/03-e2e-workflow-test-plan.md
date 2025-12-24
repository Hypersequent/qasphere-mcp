# E2E Workflow Test Plan - QA Sphere MCP

## Overview

This document outlines end-to-end workflow tests that simulate **real-world usage scenarios** of the QA Sphere MCP. These tests verify complete user journeys across multiple tools.

## Test Environment

- **QA Sphere Instance**: `https://e2eqas.eu1.qasphere.com`
- **Test Project Code**: `MCP`
- **Test Framework**: Vitest v4.0.16
- **Location**: `src/tests/e2e/`

## Workflow Test Scenarios

### Workflow 1: Complete Test Case Lifecycle

**Scenario**: Create, update, read, and organize a test case

```
1. Create folder hierarchy → 2. Create test case → 3. Update with steps →
4. Add tags/requirements → 5. Verify via get → 6. Cleanup
```

| Step | Tool | Input | Expected Output |
|------|------|-------|-----------------|
| 1 | `upsert_folders` | `['E2E Tests', 'Login Module']` | Returns folder IDs [f1, f2] |
| 2 | `create_test_case` | Title, folderId=f2, priority=high | Returns test case ID |
| 3 | `update_test_case` | Add 3 steps with actions/expected | Success message |
| 4 | `update_test_case` | Add tags: `['smoke', 'login']` | Success message |
| 5 | `get_test_case` | Marker from step 2 | Full test case with steps, tags |
| 6 | `list_test_cases` | Filter by folder f2 | Contains created test case |

**Validation Points**:
- Test case appears in correct folder
- Steps are in correct order
- Tags are linked
- Priority is preserved

---

### Workflow 2: Test Case Search and Discovery

**Scenario**: Find test cases using various filters

```
1. Setup test data → 2. Search by title → 3. Filter by priority →
4. Filter by tags → 5. Combine filters
```

| Step | Tool | Input | Expected Output |
|------|------|-------|-----------------|
| Setup | Create 5 test cases | Various priorities, tags | Test data ready |
| 1 | `list_test_cases` | `search: "Login"` | Returns matching cases |
| 2 | `list_test_cases` | `priorities: ['high']` | Only high priority cases |
| 3 | `list_test_cases` | `tags: [tagId]` | Only tagged cases |
| 4 | `list_test_cases` | `priorities + tags` | Intersection of filters |
| 5 | `list_test_cases` | `include: ['steps', 'tags']` | Includes related data |

**Validation Points**:
- Search is case-insensitive
- Filters work correctly
- Pagination works with filters
- Include returns nested data

---

### Workflow 3: Folder Organization

**Scenario**: Organize test cases into folder hierarchy

```
1. Create root folder → 2. Create subfolders → 3. Move test cases →
4. List by folder → 5. Verify hierarchy
```

| Step | Tool | Input | Expected Output |
|------|------|-------|-----------------|
| 1 | `upsert_folders` | `['Regression']` | Root folder ID |
| 2 | `upsert_folders` | `['Regression', 'API']`, `['Regression', 'UI']` | Subfolder IDs |
| 3 | `create_test_case` | folderId = API folder | Test case in subfolder |
| 4 | `list_folders` | projectCode | Shows all folders |
| 5 | `list_test_cases` | folders: [API folder ID] | Only API folder cases |

**Validation Points**:
- Nested folders created correctly
- Parent-child relationships preserved
- Folder listing includes hierarchy info

---

### Workflow 4: Requirements Traceability

**Scenario**: Link test cases to requirements and trace coverage

```
1. Create test case with requirement → 2. List requirements →
3. Filter by requirement → 4. Verify linkage
```

| Step | Tool | Input | Expected Output |
|------|------|-------|-----------------|
| 1 | `create_test_case` | requirements: [{text, url}] | Test case with requirement |
| 2 | `list_requirements` | include: 'tcaseCount' | Shows requirement with count=1 |
| 3 | `list_test_cases` | requirementIds: [reqId] | Returns linked test case |
| 4 | `get_test_case` | include requirements | Shows requirement linkage |

**Validation Points**:
- Requirement created if new
- Test case linked correctly
- Count reflects actual linkage
- Bidirectional navigation works

---

### Workflow 5: Template Test Cases with Parameters

**Scenario**: Create template test case and generate instances

```
1. Create template → 2. Add parameter values → 3. Verify filled cases
```

| Step | Tool | Input | Expected Output |
|------|------|-------|-----------------|
| 1 | `create_test_case` | type: 'template', title with `{{param}}` | Template created |
| 2 | `update_test_case` | parameterValues: [{browser: 'Chrome'}, {browser: 'Firefox'}] | Filled cases created |
| 3 | `list_test_cases` | search for filled case titles | Shows generated cases |

**Validation Points**:
- Template saved correctly
- Parameter substitution works
- Each value set creates distinct test case

---

### Workflow 6: Custom Fields Integration

**Scenario**: Use custom fields in test cases

```
1. List custom fields → 2. Create test case with fields → 3. Verify values
```

| Step | Tool | Input | Expected Output |
|------|------|-------|-----------------|
| 1 | `list_custom_fields` | projectCode | Returns field definitions |
| 2 | `create_test_case` | customFields: {fieldSystemName: {value}} | Test case created |
| 3 | `get_test_case` | marker | Shows custom field values |

**Validation Points**:
- Field values stored correctly
- Dropdown values validated
- Default values applied when specified

---

### Workflow 7: Shared Steps Reuse

**Scenario**: Create test case using shared steps

```
1. List shared steps → 2. Create test case with shared step reference →
3. Verify step inclusion
```

| Step | Tool | Input | Expected Output |
|------|------|-------|-----------------|
| 1 | `list_shared_steps` | projectCode | Returns shared step IDs |
| 2 | `create_test_case` | steps: [{sharedStepId: id}] | Test case with shared step |
| 3 | `get_test_case` | marker | Shows shared step expanded |

**Validation Points**:
- Shared step reference saved
- Step content included in response
- Sub-steps are included

---

### Workflow 8: Bulk Operations

**Scenario**: Create multiple folders and test cases efficiently

```
1. Bulk create folders → 2. Create multiple test cases → 3. Verify all created
```

| Step | Tool | Input | Expected Output |
|------|------|-------|-----------------|
| 1 | `upsert_folders` | 5 different folder paths | 5 folder ID arrays |
| 2 | `create_test_case` (x5) | 5 test cases in different folders | 5 test case IDs |
| 3 | `list_test_cases` | limit: 20 | All 5 test cases visible |

**Validation Points**:
- All folders created in single call
- Test cases distributed correctly
- No data loss or corruption

---

## Test Data Setup

### Initial State

Before E2E tests run:
1. Ensure `MCP` project exists
2. Create `[E2E-TEST]` root folder for isolation
3. Note initial counts for cleanup verification

### Naming Convention

```
Folders: [E2E-TEST] <workflow-name>/<subfolder>
Test Cases: [E2E-TEST] <workflow>-<step>-<timestamp>
Tags: e2e-test-<workflow>
```

### Cleanup

```typescript
afterAll(async () => {
  // Delete all folders starting with [E2E-TEST]
  const folders = await listFolders()
  const testFolders = folders.filter(f => f.title.startsWith('[E2E-TEST]'))
  // Note: API may not support folder deletion, manual cleanup may be needed
})
```

## Running E2E Tests

```bash
# Run all E2E tests
QASPHERE_TENANT_URL=https://e2eqas.eu1.qasphere.com \
QASPHERE_API_KEY=your-key \
npm run test:e2e

# Run specific workflow
npm run test:e2e -- workflow-1

# Run with detailed logging
DEBUG=qasphere:* npm run test:e2e
```

## Success Criteria

| Metric | Target |
|--------|--------|
| All workflows pass | 100% |
| Total execution time | < 10 minutes |
| Data cleanup | Complete |
| No flaky tests | 0 flakes in 5 runs |

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Test data conflicts | Use unique timestamps in names |
| Timeout on create | Increase timeout, check rate limits |
| Cleanup failures | Manual cleanup via UI, add to setup |
| Order dependencies | Ensure proper beforeAll/afterAll |

## Monitoring

After E2E tests run in CI:
- Check QA Sphere UI for orphaned test data
- Monitor API rate limit usage
- Review test timing trends
