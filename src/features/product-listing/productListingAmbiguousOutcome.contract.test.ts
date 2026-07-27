import assert from 'node:assert/strict'
import { ApiError } from '../../shared/api'
import {
  isAmbiguousProductListingCommandError,
  isDangerousProductListingRecoveryAction,
  shouldAwaitDangerousProductListingActionWorkflow
} from './productListingAmbiguousOutcome'

assert.equal(isAmbiguousProductListingCommandError(new TypeError('network lost')), true)
assert.equal(
  isAmbiguousProductListingCommandError(new ApiError(400, 'bad request')),
  false
)
assert.equal(
  isAmbiguousProductListingCommandError(new ApiError(409, 'explicit rejection')),
  false
)
assert.equal(
  isAmbiguousProductListingCommandError(new ApiError(422, 'validation failed')),
  false
)
assert.equal(
  isAmbiguousProductListingCommandError(new ApiError(408, 'request timeout')),
  true
)
assert.equal(
  isAmbiguousProductListingCommandError(new ApiError(425, 'too early')),
  true
)
assert.equal(
  isAmbiguousProductListingCommandError(new ApiError(429, 'rate limited')),
  true
)
assert.equal(
  isAmbiguousProductListingCommandError(new ApiError(500, 'server error')),
  true
)
assert.equal(
  isAmbiguousProductListingCommandError(new ApiError(503, 'unavailable')),
  true
)
assert.equal(isDangerousProductListingRecoveryAction('CONTINUE_AFTER_CREATE'), true)
assert.equal(isDangerousProductListingRecoveryAction('REPLAY_PROJECTION'), true)
assert.equal(isDangerousProductListingRecoveryAction('CHECK_CREATE_RESULT'), false)
assert.equal(isDangerousProductListingRecoveryAction('VERIFY_READBACK'), false)

assert.equal(
  shouldAwaitDangerousProductListingActionWorkflow(
    'CONTINUE_AFTER_CREATE',
    undefined
  ),
  true
)
assert.equal(
  shouldAwaitDangerousProductListingActionWorkflow('CONTINUE_AFTER_CREATE', {
    phase: 'ACTION_REQUIRED',
    writeCertainty: 'WRITTEN',
    nextAction: 'CONTINUE_AFTER_CREATE'
  }),
  true
)
assert.equal(
  shouldAwaitDangerousProductListingActionWorkflow('CONTINUE_AFTER_CREATE', {
    phase: 'PUBLISHING',
    writeCertainty: 'WRITTEN',
    nextAction: 'WAIT'
  }),
  false
)
