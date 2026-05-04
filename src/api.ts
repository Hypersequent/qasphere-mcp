import type { z } from 'zod'
import { QASPHERE_API_KEY, QASPHERE_TENANT_URL } from './config.js'

export class ApiError extends Error {
  status: number
  body: unknown

  constructor(message: string, status: number, body?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

export class ResponseValidationError extends Error {
  body: unknown

  constructor(message: string, body?: unknown) {
    super(message)
    this.name = 'ResponseValidationError'
    this.body = body
  }
}

type QueryValue = string | number | boolean | string[] | number[] | undefined

export interface ApiQueryOptions<T extends z.ZodTypeAny> {
  schema: T
  method?: 'GET' | 'POST' | 'PATCH'
  query?: Record<string, QueryValue>
  body?: unknown
}

const buildQueryString = (query?: Record<string, QueryValue>): string => {
  if (!query) return ''
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) continue
    if (Array.isArray(value)) {
      for (const item of value) params.append(key, String(item))
    } else {
      params.append(key, String(value))
    }
  }
  const str = params.toString()
  return str ? `?${str}` : ''
}

export async function apiQuery<T extends z.ZodTypeAny>(
  path: string,
  opts: ApiQueryOptions<T>
): Promise<z.infer<T>> {
  const url = `${QASPHERE_TENANT_URL}${path}${buildQueryString(opts.query)}`
  const method = opts.method ?? 'GET'
  const headers: Record<string, string> = {
    Authorization: `ApiKey ${QASPHERE_API_KEY}`,
  }
  if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  const res = await fetch(url, {
    method,
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  })

  if (!res.ok) {
    let body: unknown
    let message = res.statusText
    try {
      body = await res.json()
      if (body && typeof body === 'object' && 'message' in body) {
        const m = (body as { message?: unknown }).message
        if (typeof m === 'string' && m.length > 0) message = m
      }
    } catch {
      // ignore JSON parse failures; fall back to statusText
    }
    throw new ApiError(message, res.status, body)
  }

  const raw = await res.json()
  const parsed = opts.schema.safeParse(raw)
  if (!parsed.success) {
    throw new ResponseValidationError(`Response validation failed: ${parsed.error.message}`, raw)
  }
  return parsed.data
}
