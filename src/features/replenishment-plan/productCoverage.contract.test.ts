import assert from 'node:assert/strict'
import { matchesProductCoverageFilter } from './replenishmentDomain'
import type { ProductCoverageFilter } from './pageTypes'
import type { ReplenishmentPlanItem } from './types'

const activeStates = ['ACTIVE', 'INACTIVE', 'UNKNOWN'] as const
const rows = activeStates.map((activeState) => ({ activeState }) as ReplenishmentPlanItem)

function matchedStates(filter: ProductCoverageFilter) {
  return rows
    .filter((row) => matchesProductCoverageFilter(row, filter))
    .map((row) => row.activeState)
}

assert.deepEqual(matchedStates('all'), activeStates)
assert.deepEqual(matchedStates('active'), ['ACTIVE'])
assert.deepEqual(matchedStates('inactive'), ['INACTIVE'])
assert.deepEqual(matchedStates('unknown'), ['UNKNOWN'])
assert.equal(
  matchesProductCoverageFilter({} as ReplenishmentPlanItem, 'active'),
  true,
  'rows from the previous backend contract remain visible as forecast-participating products'
)
