import assert from 'node:assert/strict'
import { summarizeMissingEta } from './summary'
import type { ReplenishmentPlanItem, ReplenishmentPlanMissingEtaBatch } from './types'

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
