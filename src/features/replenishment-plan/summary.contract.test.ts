import assert from 'node:assert/strict'
import { summarizeMissingEta, summarizePastEtaReview } from './summary'
import type { ReplenishmentPlanInboundBatch, ReplenishmentPlanItem, ReplenishmentPlanMissingEtaBatch } from './types'

function missingBatch(
  batchId: number | null,
  batchReferenceNo: string | null,
  remainingQuantity: number
): ReplenishmentPlanMissingEtaBatch {
  return {
    batchId,
    batchReferenceNo,
    transportMode: 'SEA',
    batchStatus: 'in_transit',
    remainingQuantity,
    destinationCode: null
  }
}

function row(
  partnerSku: string,
  missingEtaInboundQty: number | string,
  missingEtaBatches: ReplenishmentPlanMissingEtaBatch[],
  missingEtaBatchCount = missingEtaBatches.length
): ReplenishmentPlanItem {
  return {
    partnerSku,
    missingEtaInboundQty,
    missingEtaBatchCount,
    missingEtaBatches
  } as ReplenishmentPlanItem
}

const summary = summarizeMissingEta([
  row('PAPER-A', 20, [missingBatch(1001, 'XGGEKSA04088', 20)]),
  row('PAPER-B', 30, [missingBatch(1001, 'XGGEKSA04088', 30)]),
  row('PAPER-C', 15, [missingBatch(null, 'YT2607000001', 15)]),
  row('PAPER-D', 5, [missingBatch(null, ' yt2607000001 ', 5)]),
  row('PAPER-E', 0, [])
])

assert.deepEqual(
  summary,
  { itemCount: 4, batchCount: 2, quantity: 70 },
  'missing ETA summary must de-duplicate batch count while preserving per-product quantity'
)

assert.deepEqual(
  summarizeMissingEta([
    row('LEGACY-A', '12.5', [], 3)
  ]),
  { itemCount: 1, batchCount: 3, quantity: 12.5 },
  'missing ETA summary must keep backend aggregate fallback when batch detail is absent'
)

function reviewBatch(
  batchId: number | null,
  batchReferenceNo: string | null,
  etaReviewRequired = true
): ReplenishmentPlanInboundBatch {
  return {
    batchId,
    batchReferenceNo,
    transportMode: 'SEA',
    batchStatus: 'in_transit',
    etaDate: '2026-07-31',
    remainingQuantity: 10,
    destinationCode: 'RUH',
    coverageIncluded: false,
    etaReviewRequired
  }
}

function reviewRow(partnerSku: string, inboundBatches: ReplenishmentPlanInboundBatch[]) {
  return { partnerSku, inboundBatches } as ReplenishmentPlanItem
}

assert.deepEqual(
  summarizePastEtaReview([
    reviewRow('PAPER-A', [reviewBatch(2001, 'YT-A'), reviewBatch(2002, 'YT-B')]),
    reviewRow('PAPER-B', [reviewBatch(2001, 'YT-A-COPY')]),
    reviewRow('PAPER-C', [reviewBatch(null, 'YT-C')]),
    reviewRow('PAPER-D', [reviewBatch(null, ' yt-c ')]),
    reviewRow('PAPER-E', [reviewBatch(null, null)]),
    reviewRow('PAPER-F', [reviewBatch(null, null)]),
    reviewRow('PAPER-G', [reviewBatch(2003, 'YT-NOT-PAST', false)])
  ]),
  { itemCount: 6, batchCount: 5 },
  'past ETA summary must count physical batches once and affected products once'
)

assert.deepEqual(
  summarizePastEtaReview([]),
  { itemCount: 0, batchCount: 0 },
  'past ETA summary must stay empty without review-required inbound batches'
)
