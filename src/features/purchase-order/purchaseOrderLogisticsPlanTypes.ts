import type {
  PurchaseSiteCode,
  PurchaseTransportMode,
  SiteAllocation
} from './purchaseOrderBaseTypes'

export type LogisticsPlanSiteSummary = {
  site: PurchaseSiteCode
  siteName: string
  transportMode?: PurchaseTransportMode
  transportModeLabel?: string
  quantity: number
}

export type PurchaseOrderLogisticsPlanLine = {
  itemId: string
  partnerSku: string
  productTitle: string
  productImageUrl?: string
  totalQuantity: number
  allocations: SiteAllocation[]
  productDimensionsText?: string
  productWeightText?: string
  cartonDimensionsText?: string
  cartonWeightText?: string
  cartonQuantity?: number
  looseVolumeCbm?: number
  looseVolumeCbmText?: string
  seaQuantity?: number
  seaLooseVolumeCbm?: number
  seaLooseVolumeCbmText?: string
  airQuantity?: number
  airActualWeightKg?: number
  airActualWeightKgText?: string
  airLooseVolumeCbm?: number
  airLooseVolumeCbmText?: string
  specSourceType?: string
  missingFields: string[]
}

export type PurchaseOrderLogisticsCostComponent = {
  componentType: string
  componentName: string
  currency?: string
  unitPrice?: number
  billingUnit?: string
  billableQuantity?: number
  amount?: number
  amountText?: string
  amountStatus?: string
  includedInTotal: boolean
  formulaText?: string
  sourceServiceCode?: string
  sourceId?: number
  sourceFeeName?: string
  remark?: string
}

export type PurchaseOrderLogisticsRecommendation = {
  rank: number
  recommended: boolean
  routeCode?: string
  routeName?: string
  forwarderCode?: string
  forwarderName?: string
  serviceCode?: string
  serviceName?: string
  transportMode?: PurchaseTransportMode
  country?: string
  targetPlatform?: string
  deliveryCity?: string
  destinationNode?: string
  transitTimeText?: string
  priceSummary?: string
  cargoCategorySummary?: string
  estimateStatus?: string
  estimatedCostText?: string
  estimatedTotalAmount?: number
  estimatedTotalCostText?: string
  recurringAmountPerDay?: number
  recurringCostText?: string
  costComponents?: PurchaseOrderLogisticsCostComponent[]
  excludedCostNotes?: string[]
  reasons: string[]
  risks: string[]
}

export type PurchaseOrderLogisticsPlan = {
  id: string
  planNo: string
  purchaseOrderId: string
  purchaseOrderNo: string
  purchaseOrderTitle: string
  storeName: string
  storeCode: string
  status: string
  transportMode: string
  generatedAt: string
  itemCount: number
  skuCount: number
  totalQuantity: number
  missingItemCount: number
  estimatedSeaVolumeCbm?: number
  estimatedSeaVolumeCbmText?: string
  estimatedAirChargeableWeightKg?: number
  estimatedAirChargeableWeightKgText?: string
  recommendationStatus?: string
  siteSummaries: LogisticsPlanSiteSummary[]
  messages: string[]
  recommendations: PurchaseOrderLogisticsRecommendation[]
  lines: PurchaseOrderLogisticsPlanLine[]
}
