import type { ReplenishmentPlanInboundBatch, ReplenishmentPlanItem, ReplenishmentPlanMissingEtaBatch, ReplenishmentQuantity } from './types'

export type MissingEtaSummary = {
  itemCount: number
  batchCount: number
  quantity: number
}

type MissingEtaSummaryRow = Pick<
  ReplenishmentPlanItem,
  'missingEtaBatches' | 'missingEtaBatchCount' | 'missingEtaInboundQty'
>

export type PastEtaReviewSummary = {
  itemCount: number
  batchCount: number
}

type PastEtaReviewRow = Pick<ReplenishmentPlanItem, 'inboundBatches'>

export function summarizeMissingEta(rows: MissingEtaSummaryRow[]): MissingEtaSummary {
  let itemCount = 0
  let batchCount = 0
  let quantity = 0
  const seenBatchKeys = new Set<string>()

  rows.forEach((row, rowIndex) => {
    const missingEtaBatches = row.missingEtaBatches || []
    const rowBatchCount = missingEtaBatches.length || row.missingEtaBatchCount || 0
    const rowQuantity = numericQuantity(row.missingEtaInboundQty)
    if (rowBatchCount <= 0 && rowQuantity <= 0) return

    itemCount += 1
    quantity += rowQuantity

    if (!missingEtaBatches.length) {
      batchCount += Math.max(0, row.missingEtaBatchCount || 0)
      return
    }

    missingEtaBatches.forEach((batch, batchIndex) => {
      const key = missingEtaBatchKey(batch, rowIndex, batchIndex)
      if (seenBatchKeys.has(key)) return
      seenBatchKeys.add(key)
      batchCount += 1
    })
  })

  return { itemCount, batchCount, quantity }
}

export function summarizePastEtaReview(rows: PastEtaReviewRow[]): PastEtaReviewSummary {
  let itemCount = 0
  const seenBatchKeys = new Set<string>()

  rows.forEach((row, rowIndex) => {
    let itemRequiresReview = false
    const inboundBatches = row.inboundBatches || []
    inboundBatches.forEach((batch, batchIndex) => {
      if (!batch.etaReviewRequired) return
      itemRequiresReview = true
      seenBatchKeys.add(inboundBatchIdentityKey(batch, rowIndex, batchIndex))
    })
    if (itemRequiresReview) itemCount += 1
  })

  return { itemCount, batchCount: seenBatchKeys.size }
}

function missingEtaBatchKey(batch: ReplenishmentPlanMissingEtaBatch, rowIndex: number, batchIndex: number) {
  return inboundBatchIdentityKey(batch, rowIndex, batchIndex)
}

function inboundBatchIdentityKey(
  batch: ReplenishmentPlanInboundBatch | ReplenishmentPlanMissingEtaBatch,
  rowIndex: number,
  batchIndex: number
) {
  if (batch.batchId !== null && batch.batchId !== undefined) {
    return `id:${batch.batchId}`
  }
  const referenceNo = (batch.batchReferenceNo || '').trim().toUpperCase()
  if (referenceNo) {
    return `ref:${referenceNo}`
  }
  return `row:${rowIndex}:batch:${batchIndex}`
}

function numericQuantity(value?: ReplenishmentQuantity | null) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}
