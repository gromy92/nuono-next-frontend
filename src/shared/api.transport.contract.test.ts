import { strict as assert } from 'node:assert'
import {
  ApiError,
  apiRequestJson,
  apiRequestNoContent
} from './api'

type FetchCall = {
  input: RequestInfo | URL
  init?: RequestInit
}

const previousFetch = globalThis.fetch
const previousWindowDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'window')
const calls: FetchCall[] = []
let hostname = 'localhost'
let nextFetch: () => Promise<Response> = async () => new Response()

Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: {
    location: {
      get hostname() {
        return hostname
      }
    },
    localStorage: {
      getItem: () => JSON.stringify({ userId: 307, roleId: 8, level: 1 })
    }
  }
})
globalThis.fetch = async (input, init) => {
  calls.push({ input, init })
  return nextFetch()
}

try {
  const controller = new AbortController()
  nextFetch = async () => Response.json({ ok: true })
  const payload = await apiRequestJson<{ ok: boolean }>('/transport-json', {
    method: 'POST',
    headers: {
      'X-Custom': 'kept',
      'X-Nuono-Dev-Session-User-Id': 'caller-owned'
    },
    body: '{"value":1}',
    signal: controller.signal
  })
  assert.deepEqual(payload, { ok: true })
  assert.equal(calls[0].input, '/transport-json')
  assert.equal(calls[0].init?.method, 'POST')
  assert.equal(calls[0].init?.body, '{"value":1}')
  assert.strictEqual(calls[0].init?.signal, controller.signal)
  const localHeaders = new Headers(calls[0].init?.headers)
  assert.equal(localHeaders.get('X-Custom'), 'kept')
  assert.equal(localHeaders.get('X-Nuono-Dev-Session-User-Id'), 'caller-owned')
  assert.equal(localHeaders.get('X-Nuono-Dev-Session-Role-Id'), '8')
  assert.equal(localHeaders.get('X-Nuono-Dev-Session-Level'), '1')

  hostname = 'example.com'
  nextFetch = async () => Response.json({ remote: true })
  await apiRequestJson('/transport-remote')
  const remoteHeaders = new Headers(calls[1].init?.headers)
  assert.equal(remoteHeaders.has('X-Nuono-Dev-Session-User-Id'), false)
  assert.equal(remoteHeaders.has('X-Nuono-Dev-Session-Role-Id'), false)

  nextFetch = async () => new Response(null, { status: 204 })
  assert.equal(
    await apiRequestNoContent('/transport-delete', { method: 'DELETE', signal: controller.signal }),
    undefined
  )
  assert.equal(calls[2].init?.method, 'DELETE')
  assert.strictEqual(calls[2].init?.signal, controller.signal)

  const structuredResponse = new Response(
    JSON.stringify({
      code: 'PARTIAL_WRITE',
      message: '远端已创建，请勿重试',
      category: 'BUSINESS_VALIDATION',
      operation: 'CREATE_REMOTE',
      retryable: false,
      partialSuccess: true,
      reference: 'REMOTE-1',
      details: { itemIds: [1, 2] }
    }),
    { status: 422, headers: { 'Content-Type': 'application/json' } }
  )
  nextFetch = async () => structuredResponse
  await assert.rejects(
    apiRequestJson('/transport-structured-error', undefined, 'fallback'),
    (error) => {
      assert.ok(error instanceof ApiError)
      assert.equal(error.status, 422)
      assert.equal(error.message, '远端已创建，请勿重试')
      assert.deepEqual(error.problem, {
        code: 'PARTIAL_WRITE',
        message: '远端已创建，请勿重试',
        category: 'BUSINESS_VALIDATION',
        operation: 'CREATE_REMOTE',
        retryable: false,
        partialSuccess: true,
        reference: 'REMOTE-1',
        details: { itemIds: [1, 2] }
      })
      return true
    }
  )
  assert.equal(structuredResponse.bodyUsed, true)

  nextFetch = async () => new Response(JSON.stringify({ message: 'legacy message' }), { status: 409 })
  await assert.rejects(
    apiRequestJson('/transport-legacy-error', undefined, 'fallback'),
    (error) => error instanceof ApiError && error.status === 409 && error.message === 'legacy message'
  )

  nextFetch = async () => new Response(null, { status: 503 })
  await assert.rejects(
    apiRequestJson('/transport-empty-error', undefined, (status) => `fallback:${status}`),
    (error) => error instanceof ApiError && error.message === 'fallback:503'
  )

  nextFetch = async () => new Response('gateway unavailable', { status: 502 })
  await assert.rejects(
    apiRequestNoContent('/transport-text-error', undefined, 'fallback'),
    (error) => error instanceof ApiError && error.message === 'gateway unavailable'
  )

  nextFetch = async () => new Response('{malformed', { status: 200 })
  await assert.rejects(apiRequestJson('/transport-malformed-success'), SyntaxError)

  const abortError = new DOMException('cancelled', 'AbortError')
  nextFetch = async () => Promise.reject(abortError)
  await assert.rejects(
    apiRequestJson('/transport-abort', { signal: controller.signal }),
    (error) => error === abortError
  )
} finally {
  globalThis.fetch = previousFetch
  if (previousWindowDescriptor) {
    Object.defineProperty(globalThis, 'window', previousWindowDescriptor)
  } else {
    delete (globalThis as { window?: unknown }).window
  }
}
