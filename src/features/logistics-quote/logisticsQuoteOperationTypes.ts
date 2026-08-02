export type LogisticsQuoteOperationPriceItemsSummaryDto = {
  totalItems: number
  airItemCount: number
  seaItemCount: number
  warehouseItemCount: number
}

export type LogisticsQuoteOperationPriceItemDto = {
  targetId: number
  targetType: string
  numericField: string
  quoteVersionId?: number
  quoteVersionNo?: string
  forwarderId?: number
  forwarderName?: string
  serviceCode?: string
  serviceName?: string
  transportMode?: string
  targetPlatform?: string
  deliveryCity?: string
  cargoCategoryCode?: string
  cargoCategoryName?: string
  categoryLevel1?: string
  categoryLevel2?: string
  pricingModel?: string
  currency?: string
  standardValue?: number | null
  effectiveValue?: number | null
  billingUnit?: string
  billingBasis?: string
  minCharge?: number | null
  minBillableUnit?: number | null
  priceStatus?: string
  sourceFileName?: string
  sourceLocator?: string
  remark?: string
  updatedAt?: string
}

export type LogisticsQuoteOperationPriceItemsResponse = {
  mode: string
  ready: boolean
  message?: string
  summary: LogisticsQuoteOperationPriceItemsSummaryDto
  items: LogisticsQuoteOperationPriceItemDto[]
}
