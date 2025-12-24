# QA Sphere MCP Server - Development Guide

## Project Overview

MCP (Model Context Protocol) server enabling LLMs to interact with QA Sphere test management system. Built with TypeScript, uses stdio transport.

## Architecture

```
src/
├── index.ts              # Entry point - creates MCP server
├── config.ts             # Environment config (QASPHERE_TENANT_URL, QASPHERE_API_KEY)
├── types.ts              # TypeScript interfaces for API responses
├── schemas.ts            # Zod schemas for input validation
├── utils.ts              # JSON utilities
├── LoggingTransport.ts   # Debug logging (MCP_LOG_TO_FILE)
└── tools/                # MCP tool handlers (one file per domain)
    ├── index.ts          # Registers all tools
    ├── projects.ts       # list_projects, get_project
    ├── tcases.ts         # list_test_cases, get_test_case, create_test_case, update_test_case
    ├── folders.ts        # list_folders, upsert_folders
    ├── tags.ts           # list_test_cases_tags
    ├── requirements.ts   # list_requirements
    ├── customFields.ts   # list_custom_fields
    ├── shared-steps.ts   # list_shared_steps
    └── shared-preconditions.ts  # list_shared_preconditions
```

## Commands

```bash
npm run dev              # Run with tsx (development)
npm run build            # Compile TypeScript
npm run typecheck        # Type check without emit
npm run lint             # Biome lint (auto-fix)
npm run format           # Biome format
npm run inspector        # MCP Inspector for debugging
npm test                 # Unit tests
npm run test:integration # Integration tests (requires env vars)
```

## Adding a New Tool

1. Create `src/tools/{domain}.ts`:
```typescript
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp'
import axios from 'axios'
import { QASPHERE_API_KEY, QASPHERE_TENANT_URL } from '../config.js'
import { projectCodeSchema } from '../schemas.js'

export const registerTools = (server: McpServer) => {
  server.tool(
    'tool_name',                    // Tool identifier
    'Description for the LLM',      // Description
    { projectCode: projectCodeSchema },  // Input schema (Zod)
    async ({ projectCode }) => {
      const response = await axios.get(
        `${QASPHERE_TENANT_URL}/api/public/v0/...`,
        { headers: { Authorization: `ApiKey ${QASPHERE_API_KEY}` } }
      )
      return { content: [{ type: 'text', text: JSON.stringify(response.data) }] }
    }
  )
}
```

2. Register in `src/tools/index.ts`:
```typescript
import { registerTools as registerNewTools } from './new-domain.js'
// Add to registerTools function
registerNewTools(server)
```

3. Add types to `src/types.ts`, schemas to `src/schemas.ts`

4. Create tests in `src/tests/unit/tools/{domain}.test.ts`

## Testing

### Unit Tests
- Mock axios, test tool registration and handlers
- Location: `src/tests/unit/`
- Fixtures: `src/tests/fixtures/`

### Integration Tests
- Real API calls against test tenant
- Requires `.env` with `QASPHERE_TENANT_URL`, `QASPHERE_API_KEY`, `QASPHERE_AUTH_EMAIL`, `QASPHERE_AUTH_PASSWORD`
- Location: `src/tests/integration/`
- Uses shared session token, rate limit handling

### E2E Tests
- GitHub Action triggers Claude to exercise all MCP tools
- Runs on PRs and main merges
- Manual trigger via Actions tab

## Code Style

- Biome for linting/formatting (pre-commit hook)
- ES modules (`.js` extension in imports)
- Explicit error handling for axios errors
- Return MCP content format: `{ content: [{ type: 'text', text: string }] }`

## API Authentication

All QA Sphere API calls use:
```
Authorization: ApiKey {QASPHERE_API_KEY}
Content-Type: application/json
```

Base URL pattern: `{QASPHERE_TENANT_URL}/api/public/v0/...`

## Debugging

Enable MCP message logging:
```bash
MCP_LOG_TO_FILE=/tmp/mcp.log npm run dev
```

Use MCP Inspector:
```bash
npm run inspector
```
