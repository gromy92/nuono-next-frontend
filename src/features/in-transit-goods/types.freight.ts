export type InTransitActualFreightBill = {
  id: number
  batchId?: number | null
  standardForwarderId?: number | null
  forwarderCode?: string | null
  forwarderName?: string | null
  transportMode?: string | null
  destinationCode?: string | null
  targetSiteCode?: string | null
  sourceType?: string | null
  sourceSystem?: string | null
  billNo?: string | null
  billStatus?: string | null
  businessOccurredAt?: string | null
  billDate?: string | null
  paidAt?: string | null
  currencyCode?: string | null
  originalTotalAmount?: number | null
  cnyTotalAmount?: number | null
  freightAmountCny?: number | null
  customsAmountCny?: number | null
  storageAmountCny?: number | null
  handlingAmountCny?: number | null
  deliveryAmountCny?: number | null
  interestAmountCny?: number | null
  postedAmountCny?: number | null
  balanceAmountCny?: number | null
}

export type InTransitActualFreightComponent = {
  id: number
  actualBillId?: number | null
  batchId?: number | null
  packageId?: number | null
  boxNo?: string | null
  externalBoxNo?: string | null
  psku?: string | null
  transportMode?: string | null
  destinationCode?: string | null
  targetSiteCode?: string | null
  rawFeeName?: string | null
  standardFeeType?: string | null
  chargeQuantity?: number | null
  chargeUnit?: string | null
  unitPrice?: number | null
  currencyCode?: string | null
  originalAmount?: number | null
  cnyAmount?: number | null
  quantity?: number | null
  measuredWeightKg?: number | null
  measuredVolumeCbm?: number | null
  volumeWeightKg?: number | null
  chargeableWeightKg?: number | null
  allocationBasis?: string | null
}

export type InTransitBatchFreightCost = {
  bills: InTransitActualFreightBill[]
  components: InTransitActualFreightComponent[]
}

export type InTransitFreightStatisticsRow = {
  month?: string | null
  standardForwarderId?: number | null
  transportMode?: string | null
  destinationCode?: string | null
  targetSiteCode?: string | null
  forwarderCode?: string | null
  forwarderName?: string | null
  batchCount?: number | null
  billCount?: number | null
  componentCount?: number | null
  totalAmountCny?: number | null
  freightAmountCny?: number | null
  customsAmountCny?: number | null
  chargeableWeightKg?: number | null
}

export type InTransitFreightStatistics = {
  items: InTransitFreightStatisticsRow[]
}

export type InTransitSkuFreightCostHistoryRow = {
  psku?: string | null
  targetSiteCode?: string | null
  transportMode?: string | null
  destinationCode?: string | null
  standardForwarderId?: number | null
  forwarderName?: string | null
  standardFeeType?: string | null
  quantity?: number | null
  chargeQuantity?: number | null
  chargeUnit?: string | null
  totalAmountCny?: number | null
  unitAmountCny?: number | null
  businessOccurredAt?: string | null
}

export type InTransitSkuFreightCostHistory = {
  items: InTransitSkuFreightCostHistoryRow[]
}

export type InTransitForwarderFreightComparisonRow = {
  standardForwarderId?: number | null
  forwarderCode?: string | null
  forwarderName?: string | null
  transportMode?: string | null
  destinationCode?: string | null
  targetSiteCode?: string | null
  standardFeeType?: string | null
  chargeUnit?: string | null
  totalAmountCny?: number | null
  totalChargeQuantity?: number | null
  totalQuantity?: number | null
  amountPerUnit?: number | null
  shipmentCount?: number | null
}

export type InTransitForwarderFreightComparison = {
  items: InTransitForwarderFreightComparisonRow[]
}
