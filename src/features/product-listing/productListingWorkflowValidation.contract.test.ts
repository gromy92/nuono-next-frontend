import assert from 'node:assert/strict'
import type { ProductListingWorkflowView } from './types'
import { validateProductListingWorkflowResponse } from './productListingWorkflowIdentity'

const validWorkflow: ProductListingWorkflowView = {
  phase: 'PUBLISHING',
  writeCertainty: 'UNKNOWN',
  nextAction: 'WAIT',
  draft: {
    draftId: 1001,
    storeCode: 'STR-ONE',
    status: 'draft',
    validationIssues: []
  },
  dryRunTask: {
    taskId: 1901,
    draftId: 1001,
    storeCode: 'STR-ONE',
    mode: 'DRY_RUN',
    status: 'validated',
    validationIssues: []
  },
  realRunTask: {
    taskId: 2001,
    draftId: 1001,
    storeCode: 'STR-ONE',
    mode: 'REAL_RUN',
    status: 'running',
    sourceTaskId: 1901,
    validationIssues: []
  }
}

assert.equal(
  validateProductListingWorkflowResponse(validWorkflow, {
    draftId: 1001,
    storeCode: 'STR-ONE'
  }).valid,
  true
)

for (const writeCertainty of [
  'NOT_STARTED', 'UNKNOWN', 'WRITTEN', 'VERIFIED'
] as const) {
  assert.equal(
    validateProductListingWorkflowResponse(
      {
        ...validWorkflow,
        phase: 'ACTION_REQUIRED',
        writeCertainty,
        nextAction: 'NONE'
      },
      { draftId: 1001, storeCode: 'STR-ONE' }
    ).valid,
    true,
    `ACTION_REQUIRED/${writeCertainty}/NONE is a valid projector state`
  )
}

for (const runtimeInvalid of [
  { ...validWorkflow, phase: 'UNKNOWN_PHASE' },
  { ...validWorkflow, phase: 'ACTION_REQUIRED', writeCertainty: 'UNKNOWN_CERTAINTY', nextAction: 'NONE' }
] as unknown as ProductListingWorkflowView[]) {
  assert.equal(
    validateProductListingWorkflowResponse(runtimeInvalid, { draftId: 1001, storeCode: 'STR-ONE' }).reason,
    'workflow_state_tuple_invalid',
    'unknown runtime workflow enums must fail closed'
  )
}
assert.equal(
  validateProductListingWorkflowResponse(
    {
      ...validWorkflow,
      draft: { ...validWorkflow.draft!, storeCode: 'STR-TWO' }
    },
    { draftId: 1001, storeCode: 'STR-ONE' }
  ).valid,
  false
)

for (const invalidTuple of [
  {
    ...validWorkflow,
    phase: 'READY_TO_CONFIRM' as const,
    writeCertainty: 'NOT_STARTED' as const,
    nextAction: 'EDIT_DRAFT' as const
  },
  {
    ...validWorkflow,
    phase: 'PUBLISHING' as const,
    writeCertainty: 'WRITTEN' as const,
    nextAction: 'WAIT' as const
  },
  {
    ...validWorkflow,
    phase: 'PUBLISHED' as const,
    writeCertainty: 'UNKNOWN' as const,
    nextAction: 'NONE' as const
  },
  {
    ...validWorkflow,
    phase: 'ACTION_REQUIRED' as const,
    writeCertainty: 'UNKNOWN' as const,
    nextAction: 'EDIT_DRAFT' as const
  },
  {
    ...validWorkflow,
    phase: 'ACTION_REQUIRED' as const,
    writeCertainty: 'WRITTEN' as const,
    nextAction: 'REPLAY_PROJECTION' as const
  }
]) {
  assert.equal(
    validateProductListingWorkflowResponse(invalidTuple, {
      draftId: 1001,
      storeCode: 'STR-ONE'
    }).reason,
    'workflow_state_tuple_invalid',
    `${invalidTuple.phase}/${invalidTuple.writeCertainty}/${invalidTuple.nextAction} must fail closed`
  )
}
assert.equal(
  validateProductListingWorkflowResponse(
    {
      ...validWorkflow,
      realRunTask: { ...validWorkflow.realRunTask!, sourceTaskId: 9999 }
    },
    { draftId: 1001, storeCode: 'STR-ONE' }
  ).valid,
  false
)
assert.equal(
  validateProductListingWorkflowResponse(
    {
      ...validWorkflow,
      dryRunTask: { ...validWorkflow.dryRunTask!, draftId: 1002 }
    },
    { draftId: 1001, storeCode: 'STR-ONE' }
  ).valid,
  false
)
assert.equal(
  validateProductListingWorkflowResponse(
    { ...validWorkflow, draft: undefined },
    { draftId: 1001, storeCode: 'STR-ONE' }
  ).valid,
  false
)
