export type ReplenishmentQuantity = number | string

export type ReplenishmentPlanQuery = {
  storeCode: string
  siteCode: string
}

export type ReplenishmentPlanOverview = {
  state: 'empty' | 'ready'
  storeCode: string
  siteCode: string
  calculationVersion: string
  configSnapshot: ReplenishmentPlanConfigSnapshot
  anchorDate: string | null
  rows: ReplenishmentPlanItem[]
}

export type ReplenishmentPlanItem = {
  calculationVersion: string
  configSnapshot: ReplenishmentPlanConfigSnapshot
  partnerSku: string
  sku: string | null
  productTitle: string | null
  imageUrl: string | null
  listingAt: string | null
  latestFactDate: string | null
  observedDays: number
  historyUnits7: number
  historyUnits30: number
  historyUnits60: number
  historyUnits90: number
  adjustedHistoryUnits7: ReplenishmentQuantity
  adjustedHistoryUnits30: ReplenishmentQuantity
  adjustedHistoryUnits60: ReplenishmentQuantity
  adjustedHistoryUnits90: ReplenishmentQuantity
  forecastUnits30: number
  forecastUnits60: number
  forecastUnits90: number
  forecastUnits100: ReplenishmentQuantity
  confidenceLabel: string | null
  shortReason: string | null
  currentStockUnits: ReplenishmentQuantity | null
  fbnStockUnits: ReplenishmentQuantity | null
  supermallStockUnits: ReplenishmentQuantity | null
  knownInboundUnits: ReplenishmentQuantity
  inboundBatches: ReplenishmentPlanInboundBatch[]
  nearestInboundEtaDate: string | null
  missingEtaInboundQty: ReplenishmentQuantity
  missingEtaBatchCount: number
  firstStockoutDay: number | null
  stockoutWindowLabel: string | null
  airWindowStartDay: number
  airWindowEndDay: number
  airWindowForecastUnits: ReplenishmentQuantity
  airCalculatedUnits: ReplenishmentQuantity
  airSuggestedUnits: ReplenishmentQuantity
  seaWindowStartDay: number
  seaWindowEndDay: number
  seaWindowForecastUnits: ReplenishmentQuantity
  seaCalculatedUnits: ReplenishmentQuantity
  seaSuggestedUnits: ReplenishmentQuantity
  calculationBlocked: boolean
  dailyProjection: ReplenishmentPlanDailyProjection[]
  missingEtaBatches: ReplenishmentPlanMissingEtaBatch[]
  warnings: string[]
  explanation: string | null
}

export type ReplenishmentPlanConfigSnapshot = {
  versionNo: string
  airLeadDays: number
  airCoverDays: number
  seaLeadDays: number
  seaCoverDays: number
  forecastHorizonDays: number
  inventorySources: string[]
  requireInboundEtaDate: boolean
  airEmergencyOnly: boolean
  roundingMode: string
  forecastStaleWarningDays: number
  forecastStaleBlockingDays: number
}

export type ReplenishmentPlanDailyProjection = {
  day: number
  date: string
  forecastDemand: ReplenishmentQuantity
  inboundUnits: ReplenishmentQuantity
  projectedStock: ReplenishmentQuantity
}

export type ReplenishmentPlanInboundBatch = {
  batchId: number | null
  batchReferenceNo: string | null
  transportMode: string | null
  batchStatus: string | null
  etaDate: string | null
  remainingQuantity: ReplenishmentQuantity
  coverageIncluded: boolean
  etaReviewRequired: boolean
}

export type ReplenishmentPlanMissingEtaBatch = {
  batchId: number | null
  batchReferenceNo: string | null
  transportMode: string | null
  batchStatus: string | null
  remainingQuantity: ReplenishmentQuantity
}
