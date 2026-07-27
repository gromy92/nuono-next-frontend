import assert from 'node:assert/strict'
import {
  fetchActiveProductListingDraft,
  fetchProductListingWorkflow,
  replayProductListingProjection,
  reopenProductListingReview,
  verifyProductListingCreateOutcome
} from './api'

const originalFetch = globalThis.fetch
const requests: Array<{ url: string; method: string; body?: string }> = []

globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(input)
  requests.push({
    url,
    method: init?.method || 'GET',
    body: typeof init?.body === 'string' ? init.body : undefined
  })
  if (url.includes('/drafts/by-source?')) {
    return Response.json([{
      draftId: 10033,
      draftNo: 'PLD-10033',
      storeCode: 'STR245027-NSA',
      status: 'ready_for_dry_run',
      validationIssues: []
    }])
  }
  if (url.endsWith('/verify-create-outcome')) {
    return Response.json({
      taskId: 20044,
      status: 'found',
      message: '已找到 Noon 商品',
      skuParent: 'SP-1001',
      pskuCode: 'PSKU-1001'
    })
  }
  if (url.endsWith('/replay-projection')) {
    return Response.json({
      taskId: 20044,
      draftId: 10033,
      storeCode: 'STR245027-NSA',
      mode: 'REAL_RUN',
      status: 'succeeded',
      validationIssues: []
    })
  }
  if (url.endsWith('/reopen-review')) {
    return Response.json({
      phase: 'EDITING',
      writeCertainty: 'NOT_STARTED',
      nextAction: 'REVIEW_DRAFT',
      message: '旧检查已失效，请修改商品资料'
    })
  }
  return Response.json({
    phase: 'ACTION_REQUIRED',
    writeCertainty: 'UNKNOWN',
    nextAction: 'CHECK_CREATE_RESULT',
    message: '需要核对创建结果'
  })
}) as typeof fetch

try {
  const activeDraft = await fetchActiveProductListingDraft(
    'STR245027-NSA',
    'manual_selection_group',
    91001
  )
  assert.equal(activeDraft?.draftId, 10033)

  const workflow = await fetchProductListingWorkflow(10033)
  assert.equal(workflow.nextAction, 'CHECK_CREATE_RESULT')

  const verification = await verifyProductListingCreateOutcome(20044)
  assert.equal(verification.status, 'found')
  assert.equal(verification.skuParent, 'SP-1001')

  const replayed = await replayProductListingProjection(20044)
  assert.equal(replayed.status, 'succeeded')

  const reopened = await reopenProductListingReview(20045)
  assert.equal(reopened.phase, 'EDITING')

  assert.deepEqual(requests, [
    {
      url: '/api/product-listing/drafts/by-source?storeCode=STR245027-NSA&sourceType=manual_selection_group&sourceRefId=91001',
      method: 'GET',
      body: undefined
    },
    {
      url: '/api/product-listing/drafts/10033/workflow',
      method: 'GET',
      body: undefined
    },
    {
      url: '/api/product-listing/tasks/20044/verify-create-outcome',
      method: 'POST',
      body: '{}'
    },
    {
      url: '/api/product-listing/tasks/20044/replay-projection',
      method: 'POST',
      body: '{}'
    },
    {
      url: '/api/product-listing/tasks/20045/reopen-review',
      method: 'POST',
      body: '{}'
    }
  ])
} finally {
  globalThis.fetch = originalFetch
}
