import type { Dayjs } from 'dayjs'
import type { Ali1688SkuPurchaseHistoryView } from '../../ali1688-historical-orders/types'

export type AssignmentTargetStore = {
  storeCode: string
  projectCode?: string
  projectName?: string
  site?: string
}

export type Ali1688SkuPurchaseHistoryPageProps = {
  storeCode?: string
  siteCode?: string
  availableStores?: AssignmentTargetStore[]
}

export type FilterState = {
  storeCode?: string
  siteCode?: string
  keyword: string
  linkStatus: 'all' | 'linked' | 'unlinked'
  purchaseRange: [Dayjs | null, Dayjs | null] | null
}

export type PurchaseBatchSource = {
  key: string
  orderId?: number
  itemId?: number
  assignmentId?: number
  orderNo?: string
  orderTime?: string
  supplierName?: string
  assignedQuantity?: string | number | null
  allocatedCost?: string | number | null
  unitPrice?: string | number | null
  amountBasis?: string | number | null
  priceQuality?: 'ready' | 'ok' | 'missing_price_basis' | string
}

export type PurchaseBatch = {
  id: string
  batchId?: number
  label: string
  sources: PurchaseBatchSource[]
  countedQuantity: number | null
  countedCost: number | null
  note?: string
}

export type SourceMatchFormState = {
  orderNo: string
  offerId: string
  skuId: string
}

export type PurchaseBatchMetrics = {
  purchaseCount: number
  totalQuantity: number | null
  totalCost: number | null
  averageUnitPrice: number | null
  recentUnitPrice: number | null
  recentPurchaseTime?: string
  lowestUnitPrice: number | null
  highestUnitPrice: number | null
}

export const EMPTY_VIEW: Ali1688SkuPurchaseHistoryView = {
  items: [],
  pagination: { page: 1, pageSize: 20, total: 0 },
  unlinkedAssignedLineCount: 0
}

export const EMPTY_SOURCE_MATCH_FORM: SourceMatchFormState = {
  orderNo: '',
  offerId: '',
  skuId: ''
}

export const SOURCE_MATCH_REJECTION_MESSAGES: Record<string, string> = {
  unsafe_match_key: '请完整填写订单号、offer_id、sku_id。',
  batch_not_found: '批次不存在或已删除，请刷新后重试。',
  no_match: '没有找到同时匹配当前批次店铺、站点、SKU 的 1688 来源。',
  ambiguous_match: '匹配到多条来源，请收窄订单号、offer_id、sku_id 后重试。'
}
