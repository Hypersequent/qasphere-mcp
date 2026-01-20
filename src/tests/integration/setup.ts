import { config } from 'dotenv'
import { login, validateEnvVars } from './helpers.js'

// Load .env file for local development
config()

// Global session token shared across all integration tests
export let globalSessionToken: string

// Global setup - runs once before all test files
export async function setup() {
  console.log('Validating environment variables...')
  validateEnvVars()

  console.log('Logging in for integration tests...')
  globalSessionToken = await login()
  console.log('Login successful')

  return () => {
    // Teardown - runs after all tests
    console.log('Integration tests complete')
  }
}
