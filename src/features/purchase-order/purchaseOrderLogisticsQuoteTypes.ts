import type { PurchaseSiteCode, PurchaseTransportMode } from './types';

export type PurchaseOrderLogisticsQuoteSummary = {
  totalLineCount: number
  pendingLineCount: number
  confirmedLineCount: number
  submittedLineCount: number
  newProductLineCount: number
  shippingSubmitStatus: 'NOT_SUBMITTED' | 'SUBMITTED' | string
}

export type PurchaseOrderLogisticsQuoteChannelOption = {
  routeCode: string
  routeName?: string
  serviceCode?: string
  serviceName?: string
  quoteVersionCode?: string
  siteCode?: PurchaseSiteCode
  transportMode?: PurchaseTransportMode
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
  publishedPrices?: PurchaseOrderLogisticsQuotePublishedPrice[]
  surcharges?: PurchaseOrderLogisticsQuoteSurcharge[]
  lineQuotes?: PurchaseOrderLogisticsQuoteChannelLine[]
}

export type PurchaseOrderLogisticsQuotePublishedPrice = {
  priceRuleCode?: string
  cargoCategoryCode?: string
  cargoCategoryName?: string
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

export type PurchaseOrderLogisticsQuoteSurcharge = {
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

export type PurchaseOrderLogisticsQuoteChannelLine = {
  shippingOrderLineId?: string
  purchaseOrderItemSiteId?: string
  partnerSku?: string
  barcode?: string
  quoteStatus?: 'PENDING_QUOTE' | 'CONFIRMED' | string
  unitPrice?: string | number | null
  currency?: string
  billingUnit?: string
  yiteMaterial?: string
}

export type PurchaseOrderLogisticsQuoteForwarderOption = {
  forwarderCode: string
  forwarderName?: string
  templateType?: string
  templateName?: string
  channels: PurchaseOrderLogisticsQuoteChannelOption[]
}

export type PurchaseOrderLogisticsQuoteOptions = {
  purchaseOrderId: string
  purchaseOrderNo?: string
  pendingLineCount: number
  unsupportedChannelCount: number
  forwarders: PurchaseOrderLogisticsQuoteForwarderOption[]
}

export type PurchaseOrderLogisticsQuoteExportSelection = {
  forwarderCode: string
  routeCode: string
}

export type PurchaseOrderLogisticsQuoteImportResult = {
  totalRows: number
  updatedRows: number
  skippedRows: number
  errors?: Array<{
    rowNumber?: number
    message?: string
  }>
}

export type PurchaseOrderShippingSubmitResult = {
  purchaseOrderId: string
  purchaseOrderNo: string
  shippingSubmitStatus: 'SUBMITTED' | string
  submittedLineCount: number
}
