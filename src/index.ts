#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import axios from 'axios';
import dotenv from 'dotenv';
import { Project, TestCase } from './types.js';
import { JSONStringify } from './utils.js';

dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['QASPHERE_TENANT_URL', 'QASPHERE_API_KEY'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Error: Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

const QASPHERE_TENANT_URL = ((url: string) => {
  if (!url.toLowerCase().startsWith('http://') && !url.toLowerCase().startsWith('https://')) {
    url = `https://${url}`;
  }
  return url;
})(process.env.QASPHERE_TENANT_URL!);

const QASPHERE_API_KEY = process.env.QASPHERE_API_KEY!;

// Create MCP server
const server = new McpServer({
  name: 'qasphere-mcp',
  version: '0.0.1',
  description: 'QA Sphere MCP server for fetching test cases and projects',
});



// Add the get_test_case tool
server.tool(
  'get_test_case',
  `Get a test case from QA Sphere using a marker in the format PROJECT_CODE-SEQUENCE (e.g., BDI-123). You can use URLs like: https://example.eu1.qasphere.com/project/%PROJECT_CODE%/tcase/%SEQUENCE%?any Extract %PROJECT_CODE% and %SEQUENCE% from the URL and use them as the marker.`,
  { marker: z.string().regex(/^[A-Z0-9]+-\d+$/, 'Marker must be in format PROJECT_CODE-SEQUENCE (e.g., BDI-123)') },
  async ({ marker }: { marker: string }) => {
    try {
      const [projectId, sequence] = marker.split('-');
      const response = await axios.get<TestCase>(
        `${QASPHERE_TENANT_URL}/api/public/v0/project/${projectId}/tcase/${sequence}`,
        {
          headers: {
            'Authorization': `ApiKey ${QASPHERE_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const testCase = response.data;

      // Sanity check for required fields
      if (!testCase.id || !testCase.title || !testCase.version === undefined) {
        throw new Error('Invalid test case data: missing required fields (id, title, or version)');
      }

      return {
        content: [{ type: "text", text: JSONStringify(testCase, { comment: 'precondition', 'steps': {'description': 'action', 'expected' : 'expected_result'} } )}],
      };
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to fetch test case: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }
);

server.tool(
  'get_project',
  `Get a project information from QA Sphere using a project code (e.g., BDI). You can extract PROJECT_CODE from URLs https://example.eu1.qasphere.com/project/%PROJECT_CODE%/...`,
  { projectCode: z.string().regex(/^[A-Z0-9]+$/, 'Marker must be in format PROJECT_CODE (e.g., BDI)') },
  async ({ projectCode }: { projectCode: string }) => {
    try {
      const response = await axios.get<Project>(
        `${QASPHERE_TENANT_URL}/api/public/v0/project/${projectCode}`,
        {
          headers: {
            'Authorization': `ApiKey ${QASPHERE_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const projectData = response.data;
      if (!projectData.id || !projectData.title) {
        throw new Error('Invalid project data: missing required fields (id or title)');
      }

      return {
        content: [{ type: "text", text: JSON.stringify(projectData) }]
      };
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
           throw new Error(`Project with code '${projectCode}' not found.`);
        }
        throw new Error(`Failed to fetch project: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }
);




// Start receiving messages on stdin and sending messages on stdout
async function startServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('QA Sphere MCP server started');
}

startServer().catch(console.error); 