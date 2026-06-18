import assert from 'node:assert/strict'
import { devSessionHeaders } from './api'

const originalWindow = globalThis.window

try {
  setWindowSearch('?devSession=1')
  assert.deepEqual(devSessionHeaders(), {
    'X-Nuono-Dev-Session-User-Id': '307',
    'X-Nuono-Dev-Session-Role-Id': '2',
    'X-Nuono-Dev-Session-Level': '1'
  })

  setWindowSearch('?devSession=1&devRole=procurement')
  assert.deepEqual(devSessionHeaders(), {
    'X-Nuono-Dev-Session-User-Id': '90001',
    'X-Nuono-Dev-Session-Role-Id': '5',
    'X-Nuono-Dev-Session-Level': '3'
  })
} finally {
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: originalWindow
  })
}

function setWindowSearch(search: string) {
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      location: {
        hostname: '127.0.0.1',
        search
      },
      localStorage: {
        getItem: () => null
      }
    }
  })
}
