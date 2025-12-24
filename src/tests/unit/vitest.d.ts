import 'vitest'
import type { Mock } from 'vitest'

declare module 'axios' {
  const axios: {
    get: Mock
    post: Mock
    patch: Mock
    isAxiosError: Mock
  }
  export default axios
}
