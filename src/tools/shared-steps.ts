import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp'
import axios from 'axios'
import { z } from 'zod'
import { QASPHERE_API_KEY, QASPHERE_TENANT_URL } from '../config.js'
import { projectCodeSchema } from '../schemas.js'
import type {
  CreateSharedStepRequest,
  CreateSharedStepResponse,
  CreateSharedStepSubStep,
  MessageResponse,
  SharedStep,
  SharedStepListResponse,
  UpdateSharedStepRequest,
  UpdateSharedStepSubStep,
} from '../types.js'

const sharedStepIdSchema = z
  .number()
  .int()
  .positive('Shared step ID must be a positive integer')
  .describe('Identifier of the shared step')

const baseSubStepSchema = z
  .object({
    description: z
      .string()
      .optional()
      .transform((value) => (value !== undefined ? value.trim() : value)),
    expected: z
      .string()
      .optional()
      .transform((value) => (value !== undefined ? value.trim() : value)),
  })
  .refine(
    (data) => {
      const hasDescription = data.description !== undefined && data.description.length > 0
      const hasExpected = data.expected !== undefined && data.expected.length > 0
      return hasDescription || hasExpected
    },
    {
      message: 'Each sub-step must include at least a description or expected result',
      path: ['description'],
    }
  )

const createSubStepSchema = baseSubStepSchema

const updateSubStepSchema = baseSubStepSchema.and(
  z.object({
    id: z.number().int().positive('Sub-step ID must be a positive integer').optional(),
  })
)

const sanitizeSubSteps = <T extends CreateSharedStepSubStep | UpdateSharedStepSubStep>(
  subSteps: T[]
): T[] => {
  return subSteps.map((subStep) => {
    const sanitized: T = { ...subStep }

    if ('description' in sanitized && typeof sanitized.description === 'string') {
      sanitized.description = sanitized.description.trim()
    }

    if ('expected' in sanitized && typeof sanitized.expected === 'string') {
      sanitized.expected = sanitized.expected.trim()
    }

    return sanitized
  })
}

export const registerTools = (server: McpServer) => {
  server.tool(
    'list_shared_steps',
    'List reusable shared steps for a project. Supports sorting by title or creation date and can include test case usage counts.',
    {
      projectCode: projectCodeSchema,
      sortField: z.enum(['created_at', 'title']).optional().describe('Field to sort results by'),
      sortOrder: z
        .enum(['asc', 'desc'])
        .optional()
        .describe('Sort direction (ascending or descending). Requires sortField.'),
      include: z
        .enum(['tcaseCount'])
        .optional()
        .describe(
          'Include optional fields like the number of test cases referencing each shared step'
        ),
    },
    async ({ projectCode, sortField, sortOrder, include }) => {
      try {
        if (sortOrder && !sortField) {
          throw new Error('sortOrder can only be specified when sortField is provided.')
        }

        const params = new URLSearchParams()
        if (sortField) params.append('sortField', sortField)
        if (sortOrder) params.append('sortOrder', sortOrder)
        if (include) params.append('include', include)

        const url = `${QASPHERE_TENANT_URL}/api/public/v0/project/${projectCode}/shared-step`

        const response = await axios.get<SharedStepListResponse>(url, {
          params,
          headers: {
            Authorization: `ApiKey ${QASPHERE_API_KEY}`,
            'Content-Type': 'application/json',
          },
        })

        const sharedSteps = response.data

        if (!sharedSteps || !Array.isArray(sharedSteps.sharedSteps)) {
          throw new Error('Invalid response: expected an object with a "sharedSteps" array')
        }

        if (sharedSteps.sharedSteps.length > 0) {
          const first = sharedSteps.sharedSteps[0]
          if (!first.id || !first.title || !Array.isArray(first.subSteps)) {
            throw new Error(
              'Invalid shared step data: missing required fields (id, title, or subSteps)'
            )
          }
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(sharedSteps),
            },
          ],
        }
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          const status = error.response?.status
          const message = error.response?.data?.message || error.message

          if (status === 400) {
            throw new Error(`Invalid request data: ${message}`)
          }
          if (status === 401) {
            throw new Error('Invalid or missing API key')
          }
          if (status === 403) {
            throw new Error('Insufficient permissions or suspended tenant')
          }
          if (status === 404) {
            throw new Error(`Project with code '${projectCode}' not found.`)
          }
          if (status === 500) {
            throw new Error('Internal server error while fetching shared steps')
          }

          throw new Error(`Failed to fetch shared steps: ${message}`)
        }
        throw error
      }
    }
  )

  server.tool(
    'get_shared_step',
    'Fetch details for a single shared step by ID.',
    {
      projectCode: projectCodeSchema,
      sharedStepId: sharedStepIdSchema,
    },
    async ({ projectCode, sharedStepId }) => {
      try {
        const url = `${QASPHERE_TENANT_URL}/api/public/v0/project/${projectCode}/shared-step/${sharedStepId}`

        const response = await axios.get<SharedStep>(url, {
          headers: {
            Authorization: `ApiKey ${QASPHERE_API_KEY}`,
            'Content-Type': 'application/json',
          },
        })

        const sharedStep = response.data

        if (!sharedStep.id || !sharedStep.title || !Array.isArray(sharedStep.subSteps)) {
          throw new Error(
            'Invalid shared step data: missing required fields (id, title, or subSteps)'
          )
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(sharedStep),
            },
          ],
        }
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          const status = error.response?.status
          const message = error.response?.data?.message || error.message

          if (status === 400) {
            throw new Error(`Invalid request data: ${message}`)
          }
          if (status === 401) {
            throw new Error('Invalid or missing API key')
          }
          if (status === 403) {
            throw new Error('Insufficient permissions or suspended tenant')
          }
          if (status === 404) {
            throw new Error(
              `Project or shared step not found: ${message || `Shared step ${sharedStepId}`}`
            )
          }
          if (status === 500) {
            throw new Error('Internal server error while fetching shared step')
          }

          throw new Error(`Failed to fetch shared step: ${message}`)
        }
        throw error
      }
    }
  )

  server.tool(
    'create_shared_step',
    'Create a reusable shared step comprised of one or more sub-steps. Each sub-step must include a description, expected result, or both.',
    {
      projectCode: projectCodeSchema,
      title: z
        .string()
        .min(1, 'Title must be at least 1 character')
        .max(255, 'Title must be at most 255 characters')
        .describe('Title of the shared step'),
      subSteps: z
        .array(createSubStepSchema)
        .min(1, 'At least one sub-step is required')
        .describe('List of sub-steps. Order determines execution order.'),
    },
    async ({ projectCode, title, subSteps }) => {
      try {
        const sanitizedSubSteps = sanitizeSubSteps(subSteps)
        if (sanitizedSubSteps.length === 0) {
          throw new Error('Provide at least one valid sub-step with description or expected text.')
        }

        const url = `${QASPHERE_TENANT_URL}/api/public/v0/project/${projectCode}/shared-step`

        const requestBody: CreateSharedStepRequest = {
          title,
          subSteps: sanitizedSubSteps.map((step) => {
            const payload: CreateSharedStepSubStep = {}
            if (step.description) payload.description = step.description
            if (step.expected) payload.expected = step.expected
            return payload
          }),
        }

        const response = await axios.post<CreateSharedStepResponse>(url, requestBody, {
          headers: {
            Authorization: `ApiKey ${QASPHERE_API_KEY}`,
            'Content-Type': 'application/json',
          },
        })

        const result = response.data

        if (!result.id) {
          throw new Error('Invalid response: missing id for created shared step')
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result),
            },
          ],
        }
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          const status = error.response?.status
          const message = error.response?.data?.message || error.message

          if (status === 400) {
            throw new Error(`Invalid request data: ${message}`)
          }
          if (status === 401) {
            throw new Error('Invalid or missing API key')
          }
          if (status === 403) {
            throw new Error('Insufficient permissions or suspended tenant')
          }
          if (status === 404) {
            throw new Error(`Project with code '${projectCode}' not found.`)
          }
          if (status === 409) {
            throw new Error(`A shared step with the same title already exists: ${message}`)
          }
          if (status === 500) {
            throw new Error('Internal server error while creating shared step')
          }

          throw new Error(`Failed to create shared step: ${message}`)
        }
        throw error
      }
    }
  )

  server.tool(
    'update_shared_step',
    'Update the title and/or sub-steps of an existing shared step. Updates create a new version while preserving history.',
    {
      projectCode: projectCodeSchema,
      sharedStepId: sharedStepIdSchema,
      title: z
        .string()
        .min(1, 'Title must be at least 1 character')
        .max(255, 'Title must be at most 255 characters')
        .optional()
        .describe('Updated title of the shared step'),
      subSteps: z
        .array(updateSubStepSchema)
        .min(1, 'At least one sub-step is required when updating sub-steps')
        .optional()
        .describe('Updated list of sub-steps. Omitted IDs create new sub-steps.'),
    },
    async ({ projectCode, sharedStepId, title, subSteps }) => {
      try {
        if (title === undefined && subSteps === undefined) {
          throw new Error('Provide at least one of title or subSteps to update the shared step.')
        }

        let sanitizedSubSteps: UpdateSharedStepSubStep[] | undefined
        if (subSteps) {
          sanitizedSubSteps = sanitizeSubSteps(subSteps)

          if (sanitizedSubSteps.length === 0) {
            throw new Error(
              'Provide at least one valid sub-step with description or expected text.'
            )
          }
        }

        const url = `${QASPHERE_TENANT_URL}/api/public/v0/project/${projectCode}/shared-step/${sharedStepId}`

        const requestBody: UpdateSharedStepRequest = {}
        if (title !== undefined) requestBody.title = title
        if (sanitizedSubSteps !== undefined) {
          requestBody.subSteps = sanitizedSubSteps.map((step) => {
            const payload: UpdateSharedStepSubStep = {}
            if (step.id !== undefined) payload.id = step.id
            if (step.description) payload.description = step.description
            if (step.expected) payload.expected = step.expected
            return payload
          })
        }

        const response = await axios.patch<MessageResponse>(url, requestBody, {
          headers: {
            Authorization: `ApiKey ${QASPHERE_API_KEY}`,
            'Content-Type': 'application/json',
          },
        })

        const result = response.data

        if (!result.message) {
          throw new Error('Invalid response: missing confirmation message for updated shared step')
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result),
            },
          ],
        }
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          const status = error.response?.status
          const message = error.response?.data?.message || error.message

          if (status === 400) {
            throw new Error(
              `Invalid request data, validation errors, or invalid sub-step ID: ${message}`
            )
          }
          if (status === 401) {
            throw new Error('Invalid or missing API key')
          }
          if (status === 403) {
            throw new Error('Insufficient permissions or suspended tenant')
          }
          if (status === 404) {
            throw new Error(`Project or shared step not found: ${message}`)
          }
          if (status === 500) {
            throw new Error('Internal server error while updating shared step')
          }

          throw new Error(`Failed to update shared step: ${message}`)
        }
        throw error
      }
    }
  )
}
