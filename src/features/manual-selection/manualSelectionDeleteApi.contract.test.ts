import assert from 'node:assert/strict'
import {
  deleteManualSelectionCollection,
  deleteManualSelectionGroupMaterial
} from './api'

const originalFetch = globalThis.fetch
const requests: Array<{ url: string; method?: string }> = []

globalThis.fetch = (async (input, init) => {
  requests.push({
    url: String(input),
    method: init?.method
  })
  return new Response(null, { status: 204 })
}) as typeof fetch

try {
  await deleteManualSelectionCollection('86001', 'STR108065-NSA')
  await deleteManualSelectionGroupMaterial(
    '91001',
    '86001',
    'unlink-and-delete-source',
    'STR108065-NSA'
  )

  assert.equal(requests[0]?.method, 'DELETE')
  assert.match(requests[0]?.url || '', /source-collections\/86001\?storeCode=STR108065-NSA$/)
  assert.equal(requests[1]?.method, 'DELETE')
  assert.match(requests[1]?.url || '', /groups\/91001\/materials\/86001\?/)
  assert.match(requests[1]?.url || '', /deleteSourceCollection=true/)
  assert.match(requests[1]?.url || '', /storeCode=STR108065-NSA/)
} finally {
  globalThis.fetch = originalFetch
}
