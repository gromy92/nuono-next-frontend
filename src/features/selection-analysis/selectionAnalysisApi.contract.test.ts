import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import {
  loadManualSelectionGroup,
  loadManualSelectionGroupProfitEstimate,
  saveManualSelectionGroupProfitEstimate
} from './api'

const requests: Array<{ url: string; init?: RequestInit }> = []
const originalFetch = globalThis.fetch
globalThis.fetch = (async (input, init) => {
  const url = String(input)
  requests.push({ url, init })
  if (url.endsWith('/profit-estimate')) {
    return new Response(JSON.stringify({ groupId: 'group/1', profitAmount: 18.5 }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }
  return new Response(JSON.stringify({
    groupId: 'group/1',
    groupName: '选品组',
    materials: []
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
}) as typeof fetch

try {
  const group = await loadManualSelectionGroup('group/1')
  assert.equal(group.groupId, 'group/1')
  assert.match(requests[0].url, /\/api\/product-selection\/groups\/group%2F1$/)

  const snapshot = await loadManualSelectionGroupProfitEstimate('group/1')
  assert.equal(snapshot.profitAmount, 18.5)
  assert.equal(requests[1].init?.method, undefined)

  await saveManualSelectionGroupProfitEstimate('group/1', {
    currencyCode: 'SAR',
    profitAmount: 20,
    snapshot: { schemaVersion: 3 }
  })
  assert.equal(requests[2].init?.method, 'POST')
  assert.deepEqual(JSON.parse(String(requests[2].init?.body)), {
    currencyCode: 'SAR',
    profitAmount: 20,
    snapshot: { schemaVersion: 3 }
  })
} finally {
  globalThis.fetch = originalFetch
}

const productListingSources = [
  'src/features/product-listing/sourcePrefill.ts',
  'src/features/product-listing/sourcePrefillHydration.ts'
].map((path) => readFileSync(path, 'utf8')).join('\n')
const selectionAnalysisSources = [
  'src/features/selection-analysis/api.ts',
  'src/features/selection-analysis/types.ts'
].map((path) => readFileSync(path, 'utf8')).join('\n')
const dependencyPolicy = readFileSync('scripts/check_feature_dependencies.mjs', 'utf8')

assert.doesNotMatch(productListingSources, /\.\.\/manual-selection\//)
assert.doesNotMatch(selectionAnalysisSources, /\.\.\/(?:manual-selection|product-listing)\//)
assert.doesNotMatch(dependencyPolicy, /manual-selection\|product-listing/)
