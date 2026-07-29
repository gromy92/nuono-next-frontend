export type LogisticsBillComponent = {
  id: string
  shippingOrderSegmentId?: string
  shippingOrderLineId?: string
  quoteLineId?: string
  barcode?: string
  pskuCode?: string
  siteCode?: string
  feeType?: string
  quantity?: number
  chargeQuantity?: number
  chargeUnit?: string
  unitPrice?: number
  currency?: string
  expectedAmount?: number
  expectedAmountCny?: number
}

export type LogisticsBill = {
  id: string
  expectedBillNo: string
  shippingOrderId: string
  shippingOrderNo: string
  shippingOrderTitle?: string
  shippingOrderSegmentId?: string
  shippingOrderSegmentNo?: string
  forwarderCode?: string
  forwarderName?: string
  routeCode?: string
  routeName?: string
  serviceCode?: string
  serviceName?: string
  transportMode?: string
  currency?: string
  expectedTotalAmount?: number
  expectedTotalCny?: number
  actualTotalCny?: number
  diffAmountCny?: number
  componentCount?: number
  billStatus?: string
  reconciliationStatus?: string
  createdAt?: string
  updatedAt?: string
  components?: LogisticsBillComponent[]
}

