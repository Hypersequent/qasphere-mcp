# QA Sphere MCP Server

[![Trust Score](https://archestra.ai/mcp-catalog/api/badge/quality/Hypersequent/qasphere-mcp)](https://archestra.ai/mcp-catalog/hypersequent__qasphere-mcp)
A [Model Context Protocol](https://github.com/modelcontextprotocol) server for the [QA Sphere](https://qasphere.com/) test management system.

This integration enables Large Language Models (LLMs) to interact directly with QA Sphere test cases, allowing you to discover, summarize, and chat about test cases. In AI-powered IDEs that support MCP, you can reference specific QA Sphere test cases within your development workflow.

## Prerequisites

- Node.js (recent LTS versions)
- QA Sphere account with API access
- API key from QA Sphere (Settings ⚙️ → API Keys → Add API Key)
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

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or need assistance, please file an issue on the GitHub repository.
