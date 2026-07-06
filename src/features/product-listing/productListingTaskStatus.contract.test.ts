import assert from 'node:assert/strict'
import {
  isProductListingRealWriteAttempt,
  isProductListingTaskPending,
  isProductListingTaskTerminal
} from './taskStatus'

assert.equal(isProductListingTaskPending('submitted'), true)
assert.equal(isProductListingTaskPending('running'), true)
assert.equal(isProductListingTaskPending('succeeded'), false)
assert.equal(isProductListingTaskPending('failed'), false)
assert.equal(isProductListingTaskPending('rejected'), false)

assert.equal(isProductListingTaskTerminal('validated'), true)
assert.equal(isProductListingTaskTerminal('validation_failed'), true)
assert.equal(isProductListingTaskTerminal('succeeded'), true)
assert.equal(isProductListingTaskTerminal('failed'), true)
assert.equal(isProductListingTaskTerminal('rejected'), true)
assert.equal(isProductListingTaskTerminal('written_verify_failed'), true)
assert.equal(isProductListingTaskTerminal('submitted'), false)
assert.equal(isProductListingTaskTerminal('running'), false)

assert.equal(isProductListingRealWriteAttempt({ status: 'submitted' }), true)
assert.equal(isProductListingRealWriteAttempt({ status: 'written_verify_failed' }), true)
assert.equal(isProductListingRealWriteAttempt({ status: 'validated' }), false)
assert.equal(isProductListingRealWriteAttempt({ status: 'rejected', failureCode: 'real_run_already_attempted' }), true)
