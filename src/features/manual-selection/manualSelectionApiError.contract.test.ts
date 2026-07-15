import assert from 'node:assert/strict'
import { loadManualSelectionGroups } from './api'

const originalFetch = globalThis.fetch

globalThis.fetch = (async () => new Response(JSON.stringify({ message: 'No message available' }), {
  status: 500,
  headers: {
    'Content-Type': 'application/json'
  }
})) as typeof fetch

try {
  await assert.rejects(
    () => loadManualSelectionGroups('xingyao', 'STR245027-NAE'),
    (error) => error instanceof Error && error.message === 'Request failed: 500'
  )
} finally {
  globalThis.fetch = originalFetch
}
