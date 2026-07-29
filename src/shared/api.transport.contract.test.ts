import { strict as assert } from 'node:assert'
import {
  ApiError,
  SESSION_EXPIRED_EVENT,
  apiFetch,
  apiRequestDecoded,
  apiRequestJson,
  apiRequestNoContent
} from './api'
import {
  ApiResponseDecodeError,
  requiredResponseBoolean,
  responseRecord
} from './responseDecoder'

type FetchCall = {
  input: RequestInfo | URL
  init?: RequestInit
}

const previousFetch = globalThis.fetch
const previousWindowDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'window')
const calls: FetchCall[] = []
const dispatchedEvents: string[] = []
let hostname = 'localhost'
let origin = 'http://localhost:9620'
let nextFetch: () => Promise<Response> = async () => new Response()

Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: {
    location: {
      get hostname() {
        return hostname
      },
      get origin() {
        return origin
      }
    },
    localStorage: {
      getItem: () => JSON.stringify({
        userId: 307,
        roleId: 8,
        level: 1,
        activeRoleView: 'operator'
      })
    },
    dispatchEvent: (event: Event) => {
      dispatchedEvents.push(event.type)
      return true
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
  const payload = await apiRequestJson<{ ok: boolean }>('/api/transport-json', {
    method: 'POST',
    headers: {
      'X-Custom': 'kept',
      'X-Nuono-Dev-Session-User-Id': 'caller-owned'
    },
    body: '{"value":1}',
    signal: controller.signal
  })
  assert.deepEqual(payload, { ok: true })
  assert.equal(calls[0].input, '/api/transport-json')
  assert.equal(calls[0].init?.method, 'POST')
  assert.equal(calls[0].init?.body, '{"value":1}')
  assert.strictEqual(calls[0].init?.signal, controller.signal)
  const localHeaders = new Headers(calls[0].init?.headers)
  assert.equal(localHeaders.get('X-Custom'), 'kept')
  assert.equal(localHeaders.get('X-Nuono-Dev-Session-User-Id'), 'caller-owned')
  assert.equal(localHeaders.get('X-Nuono-Dev-Session-Role-Id'), '8')
  assert.equal(localHeaders.get('X-Nuono-Dev-Session-Level'), '1')
  assert.equal(localHeaders.get('X-Nuono-Role-View'), 'operator')

  hostname = 'example.com'
  origin = 'https://example.com'
  nextFetch = async () => Response.json({ remote: true })
  await apiRequestJson('/api/transport-remote')
  const remoteHeaders = new Headers(calls[1].init?.headers)
  assert.equal(remoteHeaders.has('X-Nuono-Dev-Session-User-Id'), false)
  assert.equal(remoteHeaders.has('X-Nuono-Dev-Session-Role-Id'), false)
  assert.equal(remoteHeaders.get('X-Nuono-Role-View'), 'operator')

  nextFetch = async () => new Response(null, { status: 204 })
  assert.equal(
    await apiRequestNoContent('/api/transport-delete', { method: 'DELETE', signal: controller.signal }),
    undefined
  )
  assert.equal(calls[2].init?.method, 'DELETE')
  assert.strictEqual(calls[2].init?.signal, controller.signal)

  nextFetch = async () => new Response('sku,quantity\nA-1,2', {
    headers: { 'Content-Type': 'text/csv' }
  })
  const textResponse = await apiFetch('/api/transport-export')
  assert.equal(await textResponse.text(), 'sku,quantity\nA-1,2')

  nextFetch = async () => new Response(new Blob(['template-bytes']))
  const blobResponse = await apiFetch('/api/transport-template')
  assert.equal(await (await blobResponse.blob()).text(), 'template-bytes')

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
    apiRequestJson('/api/transport-structured-error', undefined, 'fallback'),
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
    apiRequestJson('/api/transport-legacy-error', undefined, 'fallback'),
    (error) => error instanceof ApiError && error.status === 409 && error.message === 'legacy message'
  )

  nextFetch = async () => new Response(null, { status: 503 })
  await assert.rejects(
    apiRequestJson('/api/transport-empty-error', undefined, (status) => `fallback:${status}`),
    (error) => error instanceof ApiError && error.message === '服务正在更新，请稍后重试'
  )

  nextFetch = async () => new Response('gateway unavailable', { status: 502 })
  await assert.rejects(
    apiRequestNoContent('/api/transport-text-error', undefined, 'fallback'),
    (error) => error instanceof ApiError && error.message === '服务正在更新，请稍后重试'
  )

  nextFetch = async () => new Response('{malformed', { status: 200 })
  await assert.rejects(apiRequestJson('/api/transport-malformed-success'), SyntaxError)

  nextFetch = async () => Response.json({ ok: true })
  assert.deepEqual(
    await apiRequestDecoded('/api/transport-decoded', (value) => {
      const record = responseRecord(value)
      return { ok: requiredResponseBoolean(record, 'ok', '$') }
    }),
    { ok: true }
  )

  nextFetch = async () => Response.json({ ok: 'true' })
  await assert.rejects(
    apiRequestDecoded('/api/transport-invalid-shape', (value) => {
      const record = responseRecord(value)
      return { ok: requiredResponseBoolean(record, 'ok', '$') }
    }),
    (error) =>
      error instanceof ApiResponseDecodeError
      && error.path === '$.ok'
      && error.message === '后端响应字段 $.ok 应为布尔值'
  )

  const abortError = new DOMException('cancelled', 'AbortError')
  nextFetch = async () => Promise.reject(abortError)
  await assert.rejects(
    apiRequestJson('/api/transport-abort', { signal: controller.signal }),
    (error) => error === abortError
  )

  nextFetch = async () => {
    const response = new Response(null, { status: 401 })
    Object.defineProperty(response, 'url', { value: 'https://example.com/api/protected' })
    return response
  }
  await apiFetch('/api/protected')
  assert.deepEqual(dispatchedEvents, [SESSION_EXPIRED_EVENT])

  nextFetch = async () => {
    const response = new Response(null, { status: 401 })
    Object.defineProperty(response, 'url', { value: 'https://example.com/api/auth/login' })
    return response
  }
  await apiFetch('/api/auth/login')
  assert.deepEqual(
    dispatchedEvents,
    [SESSION_EXPIRED_EVENT],
    'login failures must not invalidate a previously stored session'
  )

  nextFetch = async () => {
    const response = new Response(null, { status: 401 })
    Object.defineProperty(response, 'url', { value: 'https://example.com/api/auth/logout' })
    return response
  }
  await apiFetch('/api/auth/logout')
  assert.deepEqual(
    dispatchedEvents,
    [SESSION_EXPIRED_EVENT],
    'logout failures must not dispatch a redundant session-expired event'
  )

  nextFetch = async () => Response.json({ authorized: true })
  await apiFetch('/api/transport-authorized', {
    headers: {
      Authorization: 'Bearer caller-token',
      'X-Nuono-Role-View': 'boss'
    }
  })
  const authorizedHeaders = new Headers(calls.at(-1)?.init?.headers)
  assert.equal(authorizedHeaders.get('Authorization'), 'Bearer caller-token')
  assert.equal(authorizedHeaders.get('X-Nuono-Role-View'), 'boss')
  assert.equal(authorizedHeaders.has('X-Nuono-Dev-Session-User-Id'), false)

  nextFetch = async () => Response.json({ external: true })
  await apiFetch('https://uploads.example.net/file')
  const externalHeaders = new Headers(calls.at(-1)?.init?.headers)
  assert.equal(externalHeaders.has('X-Nuono-Role-View'), false)
  assert.equal(externalHeaders.has('X-Nuono-Dev-Session-User-Id'), false)
} finally {
  globalThis.fetch = previousFetch
  if (previousWindowDescriptor) {
    Object.defineProperty(globalThis, 'window', previousWindowDescriptor)
  } else {
    delete (globalThis as { window?: unknown }).window
  }
}
