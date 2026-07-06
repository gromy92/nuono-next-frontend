export type SalesForecastEmptyState = {
  code: string
  title: string
  description: string
}

export type SalesForecastOverview = {
  state: 'empty' | 'ready'
  storeCode: string
  siteCode: string
  sourceDataDate?: string | null
  calculatedAt?: string | null
  calculationVersion?: string | null
  configVersion?: string | null
  emptyState?: SalesForecastEmptyState | null
  rows: SalesForecastRow[]
}

export type SalesForecastQuery = {
  storeCode: string
  siteCode: string
}

export type ReplenishmentQuantity = number | string

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
  currentStockUnits: ReplenishmentQuantity | null
  fbnStockUnits: ReplenishmentQuantity | null
  supermallStockUnits: ReplenishmentQuantity | null
  knownInboundUnits: ReplenishmentQuantity
  missingEtaInboundQty: ReplenishmentQuantity
  missingEtaBatchCount: number
  firstStockoutDay: number | null
  stockoutWindowLabel: string | null
  airWindowStartDay: number
  airWindowEndDay: number
  airSuggestedUnits: ReplenishmentQuantity
  seaWindowStartDay: number
  seaWindowEndDay: number
  seaSuggestedUnits: ReplenishmentQuantity
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
}

export type ReplenishmentPlanDailyProjection = {
  day: number
  date: string
  forecastDemand: ReplenishmentQuantity
  inboundUnits: ReplenishmentQuantity
  projectedStock: ReplenishmentQuantity
}

export type ReplenishmentPlanMissingEtaBatch = {
  batchId: number | null
  batchReferenceNo: string | null
  transportMode: string | null
  batchStatus: string | null
  remainingQuantity: ReplenishmentQuantity
}

export type SalesForecastFollowUpInput = {
  storeCode: string
  siteCode: string
  partnerSku: string
  sku?: string | null
  marked: boolean
}

export type SalesForecastFollowUpResult = {
  partnerSku: string
  sku?: string | null
  marked: boolean
}

export type SalesForecastRunStatus = {
  runId?: number | null
  status: string
  failureReason?: string | null
  sourceDataDate?: string | null
  calculatedAt?: string | null
  resultCount: number
}

export type SalesForecastExportOptions = {
  forecastWindow: 30 | 60 | 90
  searchKeyword: string
  lifecycleFilter: string
  riskFilter: string
  confidenceFilter: string
}

export type SalesForecastRow = {
  partnerSku: string
  sku: string
  productTitle?: string | null
  latestFactDate?: string | null
  historyUnits7: number
  historyUnits30: number
  historyUnits60: number
  historyUnits90: number
  forecastUnits30: number
  forecastUnits60: number
  forecastUnits90: number
  currentStock?: number | null
  stockCoverDays?: number | string | null
  lifecycleCode?: string | null
  lifecycleLabel?: string | null
  confidenceLevel?: string | null
  confidenceLabel?: string | null
  confidenceExplanation?: string | null
  dataQualityWarnings?: string[]
  riskLabels?: SalesForecastRiskLabel[]
  calculationVersion?: string | null
  configVersion?: string | null
  activityWindowSummary?: string | null
  activityExplanation?: string | null
  followUpMarked?: boolean
  shortReason?: string | null
  detail?: SalesForecastDetail | null
}

export type SalesForecastDetail = {
  featureValues: SalesForecastFeatureValues
  factorBreakdown: SalesForecastFactorBreakdown
  lifecycleExplanation?: string | null
  calculationVersion?: string | null
  configVersion?: string | null
}

export type SalesForecastRiskLabel = {
  code: string
  label: string
  severity?: string | null
  explanation?: string | null
}

export type SalesForecastFeatureValues = {
  latestFactDate?: string | null
  historyUnits7: number
  historyUnits30: number
  historyUnits60: number
  historyUnits90: number
  observedDays: number
  currentStock?: number | null
  stockCoverDays?: number | string | null
}

export type SalesForecastFactorBreakdown = {
  baseDailySales?: number | string | null
  recentDailyTrendRate?: number | string | null
  trendFactor?: number | string | null
  lifecycleFactor?: number | string | null
  futureFactor?: number | string | null
  futureFactor30?: number | string | null
  futureFactor60?: number | string | null
  futureFactor90?: number | string | null
  forecastUnits30: number
  forecastUnits60: number
  forecastUnits90: number
  dailyForecasts?: SalesForecastDailyForecast[]
}

export type SalesForecastDailyForecast = {
  dayIndex: number
  forecastDate?: string | null
  calendarFactor?: number | string | null
  forecastUnits?: number | string | null
}
