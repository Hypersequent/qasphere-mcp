# QA Sphere MCP Server

A [Model Context Protocol](https://github.com/modelcontextprotocol) server for the [QA Sphere](https://qasphere.com/) test management system.

This integration enables Large Language Models (LLMs) to interact directly with QA Sphere test cases, allowing you to discover, summarize, and chat about test cases. In AI-powered IDEs that support MCP, you can reference specific QA Sphere test cases within your development workflow.

## Prerequisites

- Node.js (recent LTS versions)
- QA Sphere account with API access
- API key from QA Sphere (Settings → API Keys → Add API Key)
- Your company's QA Sphere URL (e.g., `example.eu2.qasphere.com`)

## Setup Instructions

This server is compatible with any MCP client. Configuration instructions for popular clients are provided below.

### Claude Desktop

1. Navigate to `Claude` → `Settings` → `Developer` → `Edit Config`
2. Open `claude_desktop_config.json`
3. Add the QA Sphere configuration to the `mcpServers` dictionary

### Cursor

#### Option 1: Manual Configuration

1. Go to `Settings...` → `Cursor settings` → `Add new global MCP server`
2. Add the QA Sphere configuration

#### Option 2: Quick Install

Click the button below to automatically install and configure the QA Sphere MCP server:

[![Install MCP Server](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/install-mcp?name=qasphere&config=eyJjb21tYW5kIjoibnB4IC15IHFhc3BoZXJlLW1jcCIsImVudiI6eyJRQVNQSEVSRV9URU5BTlRfVVJMIjoieW91ci1jb21wYW55LnJlZ2lvbi5xYXNwaGVyZS5jb20iLCJRQVNQSEVSRV9BUElfS0VZIjoieW91ci1hcGkta2V5In19)

### 5ire

1. Open 'Tools' and press 'New'
2. Complete the form with:
   - Tool key: `qasphere`
   - Command: `npx -y qasphere-mcp`
   - Environment variables (see below)

### Configuration Template

For any MCP client, use the following configuration format:

```json
{
  "mcpServers": {
    "qasphere": {
      "command": "npx",
      "args": ["-y", "qasphere-mcp"],
      "env": {
        "QASPHERE_TENANT_URL": "your-company.region.qasphere.com",
        "QASPHERE_API_KEY": "your-api-key"
      }
    }
  }
}
```

Replace the placeholder values with your actual QA Sphere URL and API key.

## Available Tools

This MCP server provides 16 tools organized by domain:

### Projects

#### `list_projects`
Get a list of all projects from the current QA Sphere account.

**Parameters:** None

---

#### `get_project`
Get project information using a project code.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `projectCode` | string | Yes | Project code identifier (2-5 uppercase alphanumeric characters, e.g., `BDI`) |

---

### Test Cases

#### `list_test_cases`
List test cases from a project with pagination, filtering, and sorting options.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `projectCode` | string | Yes | Project code identifier (e.g., `BDI`) |
| `page` | number | No | Page number for pagination |
| `limit` | number | No | Number of items per page (default: 20) |
| `sortField` | enum | No | Sort by: `id`, `seq`, `folder_id`, `author_id`, `pos`, `title`, `priority`, `created_at`, `updated_at`, `legacy_id` |
| `sortOrder` | enum | No | Sort direction: `asc` or `desc` |
| `search` | string | No | Search term to filter test cases |
| `include` | array | No | Related data to include: `steps`, `tags`, `project`, `folder`, `path`, `requirements` |
| `folders` | array | No | Filter by folder IDs |
| `tags` | array | No | Filter by tag IDs |
| `priorities` | array | No | Filter by priority: `high`, `medium`, `low` |
| `draft` | boolean | No | Filter draft vs published test cases |
| `requirementIds` | array | No | Filter by requirement IDs (OR logic) |

---

#### `get_test_case`
Get a single test case using its marker.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `marker` | string | Yes | Test case marker in format `PROJECT_CODE-SEQUENCE` (e.g., `BDI-123`) |

---

#### `create_test_case`
Create a new test case. Supports standalone and template test cases.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `projectId` | string | Yes | Project code identifier |
| `title` | string | Yes | Test case title (1-511 characters) |
| `type` | enum | Yes | Type: `standalone` or `template` |
| `folderId` | number | Yes | ID of the folder for the test case |
| `priority` | enum | Yes | Priority: `high`, `medium`, or `low` |
| `pos` | number | No | Position within folder (0-based index) |
| `precondition` | object | No | Either `{ sharedPreconditionId: number }` or `{ text: string }` (HTML format) |
| `steps` | array | No | Array of step objects with `description`, `expected` (HTML), or `sharedStepId` |
| `tags` | array | No | Array of tag titles (strings) |
| `requirements` | array | No | Array of `{ text: string, url: string }` objects |
| `links` | array | No | Array of `{ text: string, url: string }` objects |
| `customFields` | object | No | Custom field values keyed by `systemName` |
| `parameterValues` | array | No | Values for template parameters |
| `filledTCaseTitleSuffixParams` | array | No | Parameters to append to filled test case titles |
| `isDraft` | boolean | No | Create as draft (default: false) |

---

#### `update_test_case`
Update an existing test case. Only specified fields are updated.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `projectId` | string | Yes | Project code identifier |
| `tcaseOrLegacyId` | string | Yes | Test case UUID, sequence number, or legacy ID |
| `title` | string | No | Test case title (1-511 characters) |
| `priority` | enum | No | Priority: `high`, `medium`, or `low` |
| `precondition` | object | No | Either `{ sharedPreconditionId: number }` or `{ text: string }` |
| `isDraft` | boolean | No | Publish a draft (cannot convert published to draft) |
| `steps` | array | No | Array of step objects |
| `tags` | array | No | Array of tag titles |
| `requirements` | array | No | Array of requirement objects |
| `links` | array | No | Array of link objects |
| `customFields` | object | No | Custom field values |
| `parameterValues` | array | No | Values for template parameters (include `tcaseId` to update existing) |

---

### Folders

#### `list_folders`
List folders for test cases within a project.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `projectCode` | string | Yes | Project code identifier |
| `page` | number | No | Page number for pagination |
| `limit` | number | No | Number of items per page (default: 100) |
| `sortField` | enum | No | Sort by: `id`, `project_id`, `title`, `pos`, `parent_id`, `created_at`, `updated_at` |
| `sortOrder` | enum | No | Sort direction: `asc` or `desc` |

---

#### `upsert_folders`
Create or update multiple folders using path hierarchies. Automatically creates nested structures.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `projectCode` | string | Yes | Project code identifier |
| `folders` | array | Yes | Array of folder objects with `path` (array of folder names) and optional `comment` (HTML) |

**Example:**
```json
{
  "projectCode": "BDI",
  "folders": [
    { "path": ["Login", "Authentication", "OAuth"], "comment": "<p>OAuth test cases</p>" },
    { "path": ["Login", "Authentication", "SAML"] }
  ]
}
```

---

### Tags

#### `list_test_cases_tags`
List all tags defined within a project.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `projectCode` | string | Yes | Project code identifier |

---

### Requirements

#### `list_requirements`
List requirements linked to test cases. Useful for filtering test cases by requirement.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `projectCode` | string | Yes | Project code identifier |
| `sortField` | enum | No | Sort by: `created_at` or `text` |
| `sortOrder` | enum | No | Sort direction: `asc` or `desc` (requires `sortField`) |
| `include` | enum | No | Include `tcaseCount` for linked test case counts |

---

### Custom Fields

#### `list_custom_fields`
List all custom fields available for a project. Use when creating/updating test cases with custom field values.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `projectCode` | string | Yes | Project code identifier |

---

### Shared Steps

#### `list_shared_steps`
List reusable shared steps for a project.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `projectCode` | string | Yes | Project code identifier |
| `sortField` | enum | No | Sort by: `created_at` or `title` |
| `sortOrder` | enum | No | Sort direction: `asc` or `desc` (requires `sortField`) |
| `include` | enum | No | Include `tcaseCount` for usage counts |

---

#### `get_shared_step`
Get details for a single shared step.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `projectCode` | string | Yes | Project code identifier |
| `sharedStepId` | number | Yes | Shared step ID (positive integer) |

---

### Shared Preconditions

#### `list_shared_preconditions`
List reusable shared preconditions for a project.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `projectCode` | string | Yes | Project code identifier |
| `sortField` | enum | No | Sort by: `created_at` or `title` |
| `sortOrder` | enum | No | Sort direction: `asc` or `desc` (requires `sortField`) |
| `include` | enum | No | Include `tcaseCount` for usage counts |

---

#### `get_shared_precondition`
Get details for a single shared precondition.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `projectCode` | string | Yes | Project code identifier |
| `sharedPreconditionId` | number | Yes | Shared precondition ID (positive integer) |

---

## Development

### Running Tests

```bash
# Unit tests
npm test

# Integration tests (requires environment variables)
npm run test:integration
```

### E2E Testing with Claude

The project includes an E2E testing workflow that uses Claude Code to exercise all MCP tools against a real QA Sphere instance.

#### Required GitHub Secrets

To run E2E tests, configure these secrets in your repository:

| Secret | Description |
|--------|-------------|
| `CLAUDE_CODE_OAUTH_TOKEN` | OAuth token for Claude Code Action |
| `QASPHERE_TENANT_URL` | Your QA Sphere tenant URL (e.g., `https://example.eu1.qasphere.com`) |
| `QASPHERE_API_KEY` | API key with access to test projects |

#### Running E2E Tests

1. Go to **Actions** → **E2E Tests with Claude**
2. Click **Run workflow**
3. Select test scope (`all`, `projects`, `tcases`, etc.)
4. Review Claude's test report in the workflow output

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or need assistance, please file an issue on the GitHub repository.
