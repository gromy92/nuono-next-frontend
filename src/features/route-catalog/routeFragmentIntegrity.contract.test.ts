import { strict as assert } from 'node:assert'
import {
  mergeUniqueRouteDefinitionFragments,
  routeFragmentKeyOwnershipIssues
} from './routeFragmentIntegrity'

const duplicateFragments = [
  { owner: 'product', definitions: { shared: { key: 'shared' } } },
  { owner: 'fulfillment', definitions: { shared: { key: 'shared' } } }
] as const

assert.deepEqual(routeFragmentKeyOwnershipIssues(duplicateFragments), [
  'duplicate route key ownership shared: product, fulfillment'
])
assert.throws(
  () => mergeUniqueRouteDefinitionFragments(duplicateFragments),
  /Invalid route fragment ownership:\nduplicate route key ownership shared: product, fulfillment/
)

assert.deepEqual(
  mergeUniqueRouteDefinitionFragments([
    { owner: 'product', definitions: { product: { key: 'product' } } },
    { owner: 'fulfillment', definitions: { warehouse: { key: 'warehouse' } } }
  ] as const),
  {
    product: { key: 'product' },
    warehouse: { key: 'warehouse' }
  }
)
