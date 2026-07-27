import assert from 'node:assert/strict'
import type { ProductListingWorkflowView } from './types'
import {
  canApplyProductListingWorkflowResponse,
  isProductListingWorkflowLoadedForScope,
  matchesProductListingPartnerSku,
  productListingWorkflowIdentity,
  sameProductListingWorkflowIdentity,
  validateProductListingWorkflowResponse
} from './productListingWorkflowIdentity'

assert.equal(
  isProductListingWorkflowLoadedForScope(undefined, undefined, undefined),
  true,
  'a new unsaved draft may be edited before it has a backend workflow'
)
assert.equal(
  isProductListingWorkflowLoadedForScope(
    { draftId: 1001, storeCode: 'str-one' },
    1001,
    ' STR-ONE '
  ),
  true
)
assert.equal(
  isProductListingWorkflowLoadedForScope(
    { draftId: 1001, storeCode: 'STR-ONE' },
    1002,
    'STR-ONE'
  ),
  false,
  'switching persisted drafts must invalidate the previously loaded workflow'
)
assert.equal(
  isProductListingWorkflowLoadedForScope(
    { draftId: 1001, storeCode: 'STR-ONE' },
    1001,
    'STR-TWO'
  ),
  false,
  'switching stores must invalidate the previously loaded workflow'
)
assert.equal(
  isProductListingWorkflowLoadedForScope(undefined, 1001, 'STR-ONE'),
  false,
  'a persisted draft must fail closed until its first valid workflow response'
)

const firstDraftIdentity = productListingWorkflowIdentity(
  {
    phase: 'ACTION_REQUIRED',
    writeCertainty: 'UNKNOWN',
    nextAction: 'CHECK_CREATE_RESULT',
    draft: {
      draftId: 1001,
      storeCode: 'STR-ONE',
      status: 'draft',
      validationIssues: []
    },
    realRunTask: {
      taskId: 2001,
      draftId: 1001,
      storeCode: 'STR-ONE',
      mode: 'REAL_RUN',
      status: 'written_verify_failed',
      validationIssues: []
    },
    dryRunTask: {
      taskId: 1901,
      draftId: 1001,
      storeCode: 'STR-ONE',
      mode: 'DRY_RUN',
      status: 'validated',
      validationIssues: []
    }
  },
  1001
)

const secondDraftIdentity = productListingWorkflowIdentity(
  {
    phase: 'EDITING',
    writeCertainty: 'NOT_STARTED',
    nextAction: 'REVIEW_DRAFT',
    draft: {
      draftId: 1002,
      storeCode: 'STR-TWO',
      status: 'draft',
      validationIssues: []
    }
  },
  1002
)

assert.equal(
  canApplyProductListingWorkflowResponse({
    requestSequence: 4,
    latestSequence: 5,
    requestedDraftId: 1001,
    activeDraftId: 1001,
    expectedIdentity: firstDraftIdentity,
    currentIdentity: firstDraftIdentity
  }),
  false,
  'an older response for the same task must not overwrite a newer terminal response'
)
assert.equal(firstDraftIdentity.storeCode, 'STR-ONE')
assert.equal(
  sameProductListingWorkflowIdentity(firstDraftIdentity, {
    ...firstDraftIdentity,
    storeCode: 'STR-TWO'
  }),
  false
)
assert.equal(
  canApplyProductListingWorkflowResponse({
    requestSequence: 5,
    latestSequence: 5,
    requestedDraftId: 1001,
    activeDraftId: 1002,
    expectedIdentity: firstDraftIdentity,
    currentIdentity: secondDraftIdentity
  }),
  false
)
assert.equal(
  canApplyProductListingWorkflowResponse({
    requestSequence: 5,
    latestSequence: 5,
    requestedDraftId: 1001,
    activeDraftId: 1001,
    expectedIdentity: firstDraftIdentity,
    currentIdentity: firstDraftIdentity
  }),
  true
)
assert.equal(matchesProductListingPartnerSku(' psku-1001 ', 'PSKU-1001'), true)
assert.equal(matchesProductListingPartnerSku(undefined, 'PSKU-1001'), true)
assert.equal(matchesProductListingPartnerSku('PSKU-1002', 'PSKU-1001'), false)
assert.equal(matchesProductListingPartnerSku('PSKU-1001', undefined), false)

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

assert.equal(sameProductListingWorkflowIdentity(firstDraftIdentity, firstDraftIdentity), true)
assert.equal(
  sameProductListingWorkflowIdentity(firstDraftIdentity, secondDraftIdentity),
  false,
  'a late response for draft 1001 must not overwrite hydrated draft 1002'
)
assert.equal(
  sameProductListingWorkflowIdentity(firstDraftIdentity, {
    ...firstDraftIdentity,
    realRunTaskId: 2002
  }),
  false,
  'a late response for an older real-run task must not unlock the current task'
)
