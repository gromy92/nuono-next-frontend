export type CreateOrderFormValues = {
  storeCode: string
  title: string
  remark?: string
  items?: PskuEntryFormValue[]
}

export type AddItemsFormValues = {
  items: PskuEntryFormValue[]
}

export type UpdateItemFormValues = {
  psku?: string
  fulfillmentType?: PurchaseOrderFulfillmentType
  fulfillmentSourceName?: string
  siteQuantities?: SiteQuantityFormValue[]
}

export type UpdateOrderFormValues = {
  title: string
  remark?: string
}

export type ProductDataCompletionFormValues = {
  sourcingSpec?: string
  sourcingSize?: string
  sourcingColor?: string
  productLengthCm?: number | null
  productWidthCm?: number | null
  productHeightCm?: number | null
  productWeightG?: number | null
  cartonLengthCm?: number | null
  cartonWidthCm?: number | null
  cartonHeightCm?: number | null
  cartonWeightKg?: number | null
  cartonQuantity?: number | null
  batteryType?: string
  electricType?: string
  magneticType?: string
  liquidType?: string
  powderType?: string
  woodenMaterialType?: string
  bladeWeaponType?: string
}

export type PskuEntryFormValue = {
  psku?: string
  site?: PurchaseSiteCode
  transportMode?: PurchaseTransportMode
  quantity?: number | null
  fulfillmentType?: PurchaseOrderFulfillmentType
  fulfillmentSourceName?: string
}

export type SiteQuantityFormValue = {
  siteCode?: PurchaseSiteCode
  transportMode?: PurchaseTransportMode
  quantity?: number | null
}

export type OrderSummary = {
  itemCount: number
  pskuCount: number
  skuCount: number
  totalQuantity: number
  progress: number
  status: PurchaseOrderStatus
}

export type AllocationSummary = {
  site: PurchaseSiteCode
  siteName?: string
  transportMode?: PurchaseTransportMode
  transportModeLabel?: string
  pskuCount: number
  quantity: number
}

export type PurchaseItemFilterOption = {
  key: string
  label: string
  count: number
  site?: PurchaseSiteCode
  transportMode?: PurchaseTransportMode
}

export type PurchaseOrderIssueSummary = {
  issueItemCount: number
  missingImageCount: number
  missingAllocationCount: number
  missingTransportCount: number
  quantityIssueCount: number
  missingProductSpecCount: number
  missingCartonSpecCount: number
  missingLogisticsAttributeCount: number
  collectionFailedCount: number
}

export type PurchaseOrderAli1688HistoryEntry = {
  key: string
  siteCode?: string
  record?: PurchaseOrderAli1688HistoryRecord
}

export type DeleteItemTarget = {
  order: PurchaseOrder
  item: PurchaseOrderItem
}

export type ProductDataCompletionTarget = DeleteItemTarget & {
  focusIssue?: ProductDataCompletionIssue
}

export type ProductDataCompletionIssue = '产品规格缺失' | '箱规缺失' | '商品属性缺失'

export type ProductDataSpecField = {
  key: keyof Pick<
    ProductDataCompletionFormValues,
    | 'productLengthCm'
    | 'productWidthCm'
    | 'productHeightCm'
    | 'productWeightG'
    | 'cartonLengthCm'
    | 'cartonWidthCm'
    | 'cartonHeightCm'
    | 'cartonWeightKg'
    | 'cartonQuantity'
  >
  label: string
  min: number
  precision: number
}

export type ProductDataLogisticsField = {
  key: keyof Pick<
    ProductDataCompletionFormValues,
    | 'batteryType'
    | 'electricType'
    | 'magneticType'
    | 'liquidType'
    | 'powderType'
    | 'woodenMaterialType'
    | 'bladeWeaponType'
  >
  label: string
  options: Array<{ label: string; value: string }>
}
import type {
  PurchaseOrder,
  PurchaseOrderAli1688HistoryRecord,
  PurchaseOrderFulfillmentType,
  PurchaseOrderItem,
  PurchaseOrderStatus,
  PurchaseSiteCode,
  PurchaseTransportMode
} from '../types'
