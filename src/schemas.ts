import { z } from 'zod'

export const projectCodeSchema = z
  .string()
  .regex(/^[A-Z0-9]{2,5}$/, 'Marker must be 2 to 5 characters in format PROJECT_CODE (e.g., BDI)')
  .describe('Project code identifier (e.g., BDI)')
