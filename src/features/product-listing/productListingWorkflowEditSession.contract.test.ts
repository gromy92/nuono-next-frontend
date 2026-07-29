import assert from 'node:assert/strict'
import {
  resolveProductListingWorkflowActionPlacement,
  resolveProductListingWorkflowEditSession
} from './productListingWorkflowEditSession'

const readyWorkflow = {
  phase: 'READY_TO_CONFIRM',
  writeCertainty: 'NOT_STARTED',
  nextAction: 'CONFIRM_PUBLISH',
  message: '可以确认'
} as const

assert.deepEqual(resolveProductListingWorkflowEditSession(readyWorkflow), {
  canReturnToEdit: true,
  canEditAndSave: false,
  canConfirm: true
})

assert.deepEqual(
  resolveProductListingWorkflowEditSession(
    {
      phase: 'PUBLISHING',
      writeCertainty: 'UNKNOWN',
      nextAction: 'WAIT'
    }
  ),
  {
    canReturnToEdit: false,
    canEditAndSave: false,
    canConfirm: false
  }
)

assert.deepEqual(
  resolveProductListingWorkflowEditSession({
    phase: 'EDITING',
    writeCertainty: 'NOT_STARTED',
    nextAction: 'REVIEW_DRAFT'
  }),
  {
    canReturnToEdit: false,
    canEditAndSave: true,
    canConfirm: false
  }
)

for (const nextAction of ['EDIT_DRAFT', 'REVIEW_DRAFT'] as const) {
  assert.deepEqual(
    resolveProductListingWorkflowEditSession({
      phase: 'ACTION_REQUIRED',
      writeCertainty: 'NOT_STARTED',
      nextAction
    }),
    {
      canReturnToEdit: false,
      canEditAndSave: false,
      canConfirm: false
    },
    'ACTION_REQUIRED must remain locked until its source dry-run is reopened'
  )
}

assert.deepEqual(
  resolveProductListingWorkflowActionPlacement({
    phase: 'EDITING',
    writeCertainty: 'NOT_STARTED',
    nextAction: 'REVIEW_DRAFT'
  }),
  {
    showReviewActionInEditor: true,
    hideWorkflowPanelAction: true
  },
  'editable drafts should keep one REVIEW_DRAFT action beside the save button'
)

assert.deepEqual(
  resolveProductListingWorkflowActionPlacement({
    phase: 'ACTION_REQUIRED',
    writeCertainty: 'NOT_STARTED',
    nextAction: 'REVIEW_DRAFT'
  }),
  {
    showReviewActionInEditor: false,
    hideWorkflowPanelAction: false
  },
  'failed drafts must expose REVIEW_DRAFT outside the disabled editor fieldset'
)
