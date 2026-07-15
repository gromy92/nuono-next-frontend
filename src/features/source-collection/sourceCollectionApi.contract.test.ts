import assert from 'node:assert/strict'
import { loadSourceCollections } from './api'

const originalWindow = globalThis.window
const originalFetch = globalThis.fetch

let requestedHeaders: Headers | undefined

Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: {
    location: {
      hostname: '127.0.0.1'
    },
    localStorage: {
      getItem(key: string) {
        if (key !== 'nuono-next-session') {
          return null
        }
        return JSON.stringify({
          userId: 307,
          roleId: 2,
          level: 1
        })
      }
    }
  }
})

globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
  requestedHeaders = new Headers(init?.headers)
  return new Response(JSON.stringify([]), {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  })
}) as typeof fetch

try {
  await loadSourceCollections('xingyao', 'STR245027-NAE')

  assert.equal(requestedHeaders?.get('X-Nuono-Dev-Session-User-Id'), '307')
  assert.equal(requestedHeaders?.get('X-Nuono-Dev-Session-Role-Id'), '2')
  assert.equal(requestedHeaders?.get('X-Nuono-Dev-Session-Level'), '1')
} finally {
  globalThis.fetch = originalFetch
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: originalWindow
  })
}
