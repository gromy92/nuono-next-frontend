import { strict as assert } from 'node:assert'
import { createPackingRequestEpochGate } from './packingRequestEpoch'

const gate = createPackingRequestEpochGate()
const staleBeforeRefresh = gate.begin('batch-a')
const refreshedEpoch = gate.invalidate()
const currentAfterRefresh = gate.begin('batch-a')
assert.equal(gate.isCurrent(staleBeforeRefresh), false, 'refresh must invalidate cached detail work')
assert.equal(gate.isEpochCurrent(refreshedEpoch), true)
assert.equal(gate.isCurrent(currentAfterRefresh), true)

const olderResponse = gate.begin('batch-a')
const latestResponse = gate.begin('batch-a')
assert.equal(gate.isCurrent(olderResponse), false, 'an out-of-order older response must be ignored')
assert.equal(gate.isCurrent(latestResponse), true)

const refreshResponse = gate.begin('refresh')
const detailAfterRefresh = gate.begin('batch-a')
assert.equal(
  gate.isCurrent(refreshResponse),
  false,
  'a refresh response that arrives after a newer detail request must not replace its batch state'
)
assert.equal(gate.isCurrent(detailAfterRefresh), true)
