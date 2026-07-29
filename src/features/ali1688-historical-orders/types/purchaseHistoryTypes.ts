import type { Ali1688HistoricalOrderPagination } from './orderTypes'

export type Ali1688SkuPurchaseHistoryRecord = {
  orderId?: number
  itemId?: number
  assignmentId?: number
  productLinkId?: number
  orderNo?: string
  orderTime?: string
  supplierName?: string
  assignedQuantity?: string | number | null
  allocatedCost?: string | number | null
  unitPrice?: string | number | null
  amountBasis?: string | number | null
  priceQuality?: 'ready' | 'ok' | 'missing_price_basis' | string
}

export type Ali1688SkuPurchaseHistoryBatchSource = {
  orderId?: number
  itemId?: number
  assignmentId?: number
  orderNo?: string
  orderTime?: string
  supplierName?: string
}

export type Ali1688SkuPurchaseHistoryBatch = {
  id?: number
  label?: string
  batchSequence?: number
  countedQuantity?: string | number | null
  countedCost?: string | number | null
  unitPrice?: string | number | null
  note?: string
  sources?: Ali1688SkuPurchaseHistoryBatchSource[]
}

export type Ali1688SkuPurchaseHistoryItem = {
  storeCode?: string
  siteCode?: string
  linkStatus?: 'linked' | 'unlinked' | string
  assignmentId?: number
  orderId?: number
  itemId?: number
  orderNo?: string
  orderTime?: string
  supplierName?: string
  skuParent?: string
  partnerSku?: string
  pskuCode?: string
  productTitle?: string
  productTitleCn?: string
  productImageUrl?: string
  sourceOfferId?: string
  sourceSkuId?: string
  sourceProductCode?: string
  sourceSingleProductCode?: string
  purchaseCount?: number
  totalQuantity?: string
  totalCost?: string
  averageUnitPrice?: string
  recentUnitPrice?: string
  recentPurchaseTime?: string
  lowestUnitPrice?: string
  highestUnitPrice?: string
  amountBasis?: string
  dataQualityFlags?: string[]
  history?: Ali1688SkuPurchaseHistoryRecord[]
  purchaseBatches?: Ali1688SkuPurchaseHistoryBatch[]
}

export type Ali1688SkuPurchaseHistoryView = {
  items: Ali1688SkuPurchaseHistoryItem[]
  pagination: Ali1688HistoricalOrderPagination
  unlinkedAssignedLineCount?: number
}

export type Ali1688SkuPurchaseBatchSaveRequest = {
  storeCode?: string
  siteCode?: string
  skuParent?: string
  partnerSku?: string
  pskuCode?: string
  batches: Array<{
    label?: string
    countedQuantity?: number | null
    countedCost?: number | null
    note?: string
    sources: Ali1688SkuPurchaseHistoryBatchSource[]
  }>
}

export type Ali1688SkuPurchaseBatchSaveResult = {
  savedBatchCount: number
  savedSourceCount: number
}

export type Ali1688SkuPurchaseBatchSourceMatchPreviewRequest = {
  batchId?: number
  orderNo?: string
  offerId?: string
  skuId?: string
}

export type Ali1688SkuPurchaseBatchSourceMatchCandidate = {
  orderId?: number
  itemId?: number
  assignmentId?: number
  orderNo?: string
  orderTime?: string
  supplierName?: string
  offerId?: string
  skuId?: string
  assignedQuantity?: number
}

export type Ali1688SkuPurchaseBatchSourceMatchPreviewResult = {
  batchId?: number
  matchedCount: number
  candidates: Ali1688SkuPurchaseBatchSourceMatchCandidate[]
  rejectionReason?: string | null
}

export type Ali1688SkuPurchaseBatchSourceMatchSaveRequest = {
  batchId?: number
  sources: Ali1688SkuPurchaseHistoryBatchSource[]
}

export type Ali1688SkuPurchaseBatchSourceMatchSaveResult = {
  batchId?: number
  savedSourceCount: number
  replacedSourceCount: number
}
