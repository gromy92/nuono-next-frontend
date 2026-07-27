import assert from 'node:assert/strict'
import {
  createEditingProductListingWorkflow,
  presentProductListingWorkflow
} from './productListingWorkflowPresentation'
import type {
  ProductListingWorkflowNextAction,
  ProductListingWorkflowPhase,
  ProductListingWorkflowView
} from './types'

function workflow(
  phase: ProductListingWorkflowPhase,
  nextAction: ProductListingWorkflowNextAction,
  values: Partial<ProductListingWorkflowView> = {}
): ProductListingWorkflowView {
  return {
    phase,
    writeCertainty: 'NOT_STARTED',
    nextAction,
    message: '后端给出的当前处理说明',
    ...values
  }
}

const phaseCases: Array<[ProductListingWorkflowPhase, string]> = [
  ['EDITING', '编辑中'],
  ['READY_TO_CONFIRM', '待确认'],
  ['PUBLISHING', '上架中'],
  ['PUBLISHED', '上架成功'],
  ['ACTION_REQUIRED', '需要处理']
]

for (const [phase, expectedLabel] of phaseCases) {
  assert.equal(presentProductListingWorkflow(workflow(phase, 'NONE')).phaseLabel, expectedLabel)
}

const publishing = presentProductListingWorkflow(workflow('PUBLISHING', 'WAIT'))
assert.deepEqual(
  {
    allowSave: publishing.allowSave,
    allowPrepare: publishing.allowPrepare,
    allowCloseReview: publishing.allowCloseReview,
    actionLabel: publishing.action?.label
  },
  {
    allowSave: false,
    allowPrepare: false,
    allowCloseReview: false,
    actionLabel: undefined
  }
)
assert.equal(
  presentProductListingWorkflow(
    workflow('PUBLISHING', 'CONFIRM_PUBLISH')
  ).action,
  undefined,
  'publishing must stay non-interactive even if a malformed response carries an action'
)

const unknownCreateOutcome = presentProductListingWorkflow(
  workflow('ACTION_REQUIRED', 'CHECK_CREATE_RESULT', {
    writeCertainty: 'UNKNOWN',
    reasonCode: 'noon_create_outcome_unknown'
  })
)
assert.equal(unknownCreateOutcome.action?.label, '系统正在核对 Noon 创建结果')
assert.equal(unknownCreateOutcome.action?.danger, false)
assert.equal(unknownCreateOutcome.allowSave, false)
assert.equal(unknownCreateOutcome.allowPrepare, false)

const foundCreateOutcome = presentProductListingWorkflow(
  workflow('ACTION_REQUIRED', 'CONTINUE_AFTER_CREATE', {
    writeCertainty: 'WRITTEN',
    reasonCode: 'noon_create_found'
  })
)
assert.equal(foundCreateOutcome.action?.label, '继续完成剩余写入')
assert.equal(foundCreateOutcome.action?.danger, true)
assert.equal(foundCreateOutcome.allowSave, false)

const readyToConfirm = presentProductListingWorkflow(
  workflow('READY_TO_CONFIRM', 'CONFIRM_PUBLISH')
)
assert.equal(readyToConfirm.allowSave, false)
assert.equal(readyToConfirm.allowPrepare, false)

const editableFailure = presentProductListingWorkflow(
  workflow('ACTION_REQUIRED', 'EDIT_DRAFT')
)
assert.equal(
  editableFailure.allowSave,
  false,
  'terminal NOT_STARTED failures must reopen their source dry-run before editing'
)
assert.equal(editableFailure.allowPrepare, false)

const reviewableFailure = presentProductListingWorkflow(
  workflow('ACTION_REQUIRED', 'REVIEW_DRAFT')
)
assert.equal(
  reviewableFailure.allowSave,
  false,
  'terminal NOT_STARTED failures must reopen before another review can be prepared'
)
assert.equal(reviewableFailure.allowPrepare, false)

const unsafeEditableFailure = presentProductListingWorkflow(
  workflow('ACTION_REQUIRED', 'EDIT_DRAFT', { writeCertainty: 'UNKNOWN' })
)
assert.equal(unsafeEditableFailure.allowSave, false)
assert.equal(unsafeEditableFailure.allowPrepare, false)

for (const illegalWorkflow of [
  workflow('PUBLISHED', 'REVIEW_DRAFT', { writeCertainty: 'NOT_STARTED' }),
  workflow('PUBLISHING', 'EDIT_DRAFT', { writeCertainty: 'NOT_STARTED' }),
  workflow('EDITING', 'REVIEW_DRAFT', { writeCertainty: 'WRITTEN' }),
  workflow('EDITING', 'CONTINUE_AFTER_CREATE', { writeCertainty: 'NOT_STARTED' })
]) {
  const illegalPresentation = presentProductListingWorkflow(illegalWorkflow)
  assert.equal(illegalPresentation.allowSave, false)
  assert.equal(illegalPresentation.allowPrepare, false)
}

assert.equal(
  presentProductListingWorkflow(workflow('ACTION_REQUIRED', 'VERIFY_READBACK')).action?.label,
  '重新回读 Noon'
)
assert.equal(
  presentProductListingWorkflow(workflow('ACTION_REQUIRED', 'REPLAY_PROJECTION')).action?.label,
  '恢复本地商品资料'
)

const editing = createEditingProductListingWorkflow()
assert.equal(editing.phase, 'EDITING')
assert.equal(editing.nextAction, 'REVIEW_DRAFT')
assert.equal(presentProductListingWorkflow(editing).allowSave, true)
