import { describe, it, expect } from 'vitest'
import { projectCodeSchema, testCaseMarkerSchema } from '../../schemas.js'

describe('Schema Validation Tests', () => {
  describe('projectCodeSchema', () => {
    it('should validate valid project codes', () => {
      expect(() => projectCodeSchema.parse('BDI')).not.toThrow()
      expect(() => projectCodeSchema.parse('TEST')).not.toThrow()
      expect(() => projectCodeSchema.parse('A1')).not.toThrow()
      expect(() => projectCodeSchema.parse('ABC12')).not.toThrow()
    })

    it('should fail when project code is too short', () => {
      expect(() => projectCodeSchema.parse('A')).toThrow()
    })

    it('should fail when project code is too long', () => {
      expect(() => projectCodeSchema.parse('ABCDEF')).toThrow()
    })

    it('should fail when project code is lowercase', () => {
      expect(() => projectCodeSchema.parse('bdi')).toThrow()
    })

    it('should fail when project code contains special characters', () => {
      expect(() => projectCodeSchema.parse('BD-I')).toThrow()
      expect(() => projectCodeSchema.parse('BD_I')).toThrow()
      expect(() => projectCodeSchema.parse('BD I')).toThrow()
    })
  })

  describe('testCaseMarkerSchema', () => {
    it('should validate valid test case markers', () => {
      expect(() => testCaseMarkerSchema.parse('BDI-123')).not.toThrow()
      expect(() => testCaseMarkerSchema.parse('TEST-1')).not.toThrow()
      expect(() => testCaseMarkerSchema.parse('A1-999')).not.toThrow()
    })

    it('should fail when marker format is invalid', () => {
      expect(() => testCaseMarkerSchema.parse('BDI123')).toThrow()
      expect(() => testCaseMarkerSchema.parse('BDI-')).toThrow()
      expect(() => testCaseMarkerSchema.parse('-123')).toThrow()
    })

    it('should fail when marker has invalid project code', () => {
      expect(() => testCaseMarkerSchema.parse('A-123')).toThrow()
      expect(() => testCaseMarkerSchema.parse('ABCDEF-123')).toThrow()
    })
  })
})
