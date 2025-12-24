import { z } from 'zod'

export const projectCodeSchema = z
  .string()
  .regex(/^[A-Z0-9]{2,5}$/, 'Marker must be 2 to 5 characters in format PROJECT_CODE (e.g., BDI)')
  .describe('Project code identifier (e.g., BDI)')

export const testCaseMarkerSchema = z
  .string()
  .regex(
    /^[A-Z0-9]{2,5}-\d+$/,
    'Marker must be in format PROJECT_CODE-SEQUENCE (e.g., BDI-123). Project code must be 2 to 5 characters in format PROJECT_CODE (e.g., BDI). Sequence must be a number.'
  )
  .describe('Test case marker in format PROJECT_CODE-SEQUENCE (e.g., BDI-123)')
