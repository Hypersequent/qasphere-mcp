import type { Mock } from 'vitest'

export type MockedAxios = {
  get: Mock
  post: Mock
  patch: Mock
  isAxiosError: Mock
}
