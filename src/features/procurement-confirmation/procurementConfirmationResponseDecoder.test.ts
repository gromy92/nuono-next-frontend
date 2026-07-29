import assert from 'node:assert/strict'
import { ApiResponseDecodeError } from '../../shared/responseDecoder'
import {
  decodeRequirementConfirmationDetailResponse,
  decodeRequirementConfirmationListResponse
} from './procurementConfirmationResponseDecoder'

const validListResponse = {
  mode: 'local-db',
  ready: true,
  page: 1,
  pageSize: 50,
  total: 1,
  items: [
    {
      demandItemId: 70001,
      demandTitle: '香薰炉采购需求',
      candidateCollectionTask: {
        id: 80001,
        status: 'SUCCESS',
        resultCount: 1
      },
      previewCandidate: {
        candidateId: 43101,
        offerId: '798448813101',
        title: '香薰炉候选'
      }
    }
  ]
}

assert.strictEqual(
  decodeRequirementConfirmationListResponse(validListResponse),
  validListResponse
)

const validDetailResponse = {
  mode: 'local-db',
  ready: true,
  demand: {
    demandItemId: 70001,
    orderNo: 'PO-70001'
  },
  pool: {
    poolId: 90001,
    status: 'POOL_INQUIRY_FINISHED',
    items: [
      {
        poolItemId: 91001,
        candidateId: 43101,
        status: 'REPLIED',
        title: '香薰炉候选'
      }
    ]
  },
  backupCandidates: [
    {
      candidateId: 43102,
      title: '香薰炉备选'
    }
  ],
  finalCandidates: [
    {
      poolItemId: 91001,
      candidateId: 43101,
      finalPickType: 'PRIMARY'
    }
  ],
  summary: {
    summaryText: '主候选报价更优。',
    snapshotId: 92001
  }
}

assert.strictEqual(
  decodeRequirementConfirmationDetailResponse(validDetailResponse),
  validDetailResponse
)

assert.throws(
  () => decodeRequirementConfirmationListResponse({
    ...validListResponse,
    items: {}
  }),
  (error) =>
    error instanceof ApiResponseDecodeError
    && error.path === '$.items'
    && error.message === '后端响应字段 $.items 应为数组'
)

assert.throws(
  () => decodeRequirementConfirmationListResponse({
    ...validListResponse,
    items: [{ demandItemId: '70001' }]
  }),
  (error) =>
    error instanceof ApiResponseDecodeError
    && error.path === '$.items[0].demandItemId'
)

assert.throws(
  () => decodeRequirementConfirmationDetailResponse({
    ...validDetailResponse,
    pool: {
      ...validDetailResponse.pool,
      items: [{ poolItemId: 91001, candidateId: '43101' }]
    }
  }),
  (error) =>
    error instanceof ApiResponseDecodeError
    && error.path === '$.pool.items[0].candidateId'
)

assert.throws(
  () => decodeRequirementConfirmationDetailResponse({
    ...validDetailResponse,
    finalCandidates: [{
      poolItemId: 91001,
      candidateId: 43101,
      finalPickType: 'SECONDARY'
    }]
  }),
  (error) =>
    error instanceof ApiResponseDecodeError
    && error.path === '$.finalCandidates[0].finalPickType'
)
