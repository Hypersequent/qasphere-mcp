# QA Sphere MCP Server
A [Model Context Protocol](https://github.com/modelcontextprotocol) server for the [QA Sphere](https://qasphere.com/).

This server provides integration with QA Sphere test management system through MCP, allowing LLMs to interact with QA Sphere test cases.

## Prerequisites

- Node.js environment (recent version)
- QA Sphere account with API access
- Environment variables for QA Sphere authentication:
  - `QASPHERE_TENANT_URL`: Your company's QA Sphere URL (e.g., `example.eu2.qasphere.com`)
  - `QASPHERE_API_KEY`: API key from QA Sphere (Settings → API Keys → Add API Key)

## MCP Clients

Theoretically, any MCP client should work with QA Sphere MCP. 

### Claude Desktop
To set up Claude Desktop as a QA Sphere MCP client, go to `Claude` → `Settings` → `Developer` → `Edit Config` → `claude_desktop_config.json` and add the following:

```json
{
  "mcpServers": {
    "qasphere": {
      "command": "npx",
      "args": [
        "-y", "qasphere-mcp"
      ],
      "env": {
        "QASPHERE_TENANT_URL": "%MYTEAM%.%REGION%.qasphere.com",
        "QASPHERE_API_KEY": "%MY_TOKEN%"
      }
    }
  }
}
```

