import assert from 'node:assert/strict'
import { isProductListingReviewInteractionLocked } from './productListingReviewInteraction'

const unlocked = {
  phase: 'READY_TO_CONFIRM' as const,
  preparing: false,
  confirming: false,
  confirmationAwaitingWorkflow: false,
  returningToEdit: false,
  integrityBlocked: false
}

assert.equal(isProductListingReviewInteractionLocked(unlocked), false)
assert.equal(isProductListingReviewInteractionLocked({ ...unlocked, phase: 'PUBLISHING' }), true)
assert.equal(isProductListingReviewInteractionLocked({ ...unlocked, preparing: true }), true)
assert.equal(isProductListingReviewInteractionLocked({ ...unlocked, confirming: true }), true)
assert.equal(
  isProductListingReviewInteractionLocked({
    ...unlocked,
    confirmationAwaitingWorkflow: true
  }),
  true
)
assert.equal(isProductListingReviewInteractionLocked({ ...unlocked, returningToEdit: true }), true)
assert.equal(isProductListingReviewInteractionLocked({ ...unlocked, integrityBlocked: true }), true)
