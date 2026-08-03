export type WarehouseQuotePriceSource =
  | 'SHIPPING_ORDER_SNAPSHOT'
  | 'PRODUCT_CURRENT'
  | 'LEGACY_CHANNEL_QUOTE'
  | string

export type ForwarderEligibilityStatus =
  | 'SUPPORTED'
  | 'INQUIRY_REQUIRED'
  | 'UNSUPPORTED'
  | 'UNKNOWN'
  | string

export type OrderLogisticsQuoteSummary = {
  totalLineCount: number
  pendingLineCount: number
  confirmedLineCount: number
  submittedLineCount: number
  newProductLineCount: number
  supportedLineCount?: number
  inquiryRequiredLineCount?: number
  unsupportedLineCount?: number
  shippingSubmitStatus: 'NOT_SUBMITTED' | 'SUBMITTED' | string
}

export type OrderLogisticsQuoteChannelOption = {
  routeCode: string
  routeName?: string
  serviceCode?: string
  serviceName?: string
  quoteVersionCode?: string
  quoteEffectiveFrom?: string
  quoteRecordedAt?: string
  latestProductQuoteAt?: string
  siteCode?: string
  transportMode?: string
  transportModeLabel?: string
  country?: string
  targetPlatform?: string
  deliveryCity?: string
  destinationNode?: string
  transitTimeText?: string
  priceSummary?: string
  totalLineCount?: number
  pendingLineCount: number
  confirmedLineCount?: number
  newProductLineCount: number
  supportedLineCount?: number
  inquiryRequiredLineCount?: number
  unsupportedLineCount?: number
  publishedPrices?: OrderLogisticsQuotePublishedPrice[]
  surcharges?: OrderLogisticsQuoteSurcharge[]
  lineQuotes?: OrderLogisticsQuoteChannelLine[]
}

export type OrderLogisticsQuotePublishedPrice = {
  priceRuleCode?: string
  cargoCategoryCode?: string
  cargoCategoryName?: string
  cargoCategoryDescription?: string
  priceStatus?: string
  currency?: string
  unitPrice?: string | number | null
  billingUnit?: string
  billingBasis?: string
  volumeDivisor?: string | number | null
  minBillableUnit?: string | number | null
  minBillableUnitType?: string
  minCharge?: string | number | null
}

export type OrderLogisticsQuoteSurcharge = {
  feeName?: string
  feeType?: string
  triggerCondition?: string
  currency?: string
  amount?: string | number | null
  rate?: string | number | null
  billingUnit?: string
  billingBasis?: string
  minCharge?: string | number | null
  minBillableUnit?: string | number | null
}

export type OrderLogisticsQuoteChannelLine = {
  shippingOrderLineId?: string
  purchaseOrderItemSiteId?: string
  partnerSku?: string
  barcode?: string
  quoteStatus?: 'PENDING_QUOTE' | 'CONFIRMED' | string
  unitPrice?: string | number | null
  currency?: string
  billingUnit?: string
  yiteMaterial?: string
  priceSource?: WarehouseQuotePriceSource
  priceUpdatedAt?: string
  eligibilityStatus?: ForwarderEligibilityStatus
}

export type OrderLogisticsQuoteForwarderOption = {
  forwarderCode: string
  forwarderName?: string
  templateType?: string
  templateName?: string
  channels: OrderLogisticsQuoteChannelOption[]
}

export type OrderLogisticsQuoteOptions = {
  purchaseOrderId: string
  purchaseOrderNo?: string
  pendingLineCount: number
  unsupportedChannelCount: number
  forwarders: OrderLogisticsQuoteForwarderOption[]
}

export type OrderLogisticsQuoteExportSelection = {
  forwarderCode: string
  routeCode: string
}

export type OrderLogisticsQuoteImportResult = {
  totalRows: number
  updatedRows: number
  skippedRows: number
  errors?: Array<{
    rowNumber?: number
    message?: string
  }>
}
