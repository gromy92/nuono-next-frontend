export type SalesAnalyticsSummary = {
  netUnits: number
  grossUnits: number
  shippedUnits: number
  cancelledUnits: number
  revenueShipped: number
  yourVisitors: number
  totalVisitors: number
  conversionVisitorsPercentage?: number | null
  buyBoxVisitorPercentage?: number | null
  syncStatus?: {
    state?: string
    label?: string
    latestAvailableSalesDate?: string
    businessMetricsAllowed?: boolean
  } | null
  businessMetricsAvailable?: boolean
}

export type SalesTrendBucket = Partial<SalesAnalyticsSummary> & {
  bucketStart: string
  bucketLabel: string
}

export type SalesProductRow = Partial<SalesAnalyticsSummary> & {
  partnerSku: string
  sku: string
  productTitle?: string
  latestFactDate?: string
  sourceSystems?: string[]
  lifecycleCode?: string
  lifecycleLabel?: string
  lifecycleExplanation?: string
  lifecycleRuleVersion?: string
  lifecycleQualityState?: string
  lifecycleEvidenceJson?: string
  lifecycleWarningCodes?: string[]
  brand?: string | null
  productFulltype?: string | null
  imageUrl?: string | null
  currentStock?: number | null
  fbnStock?: number | null
  supermallStock?: number | null
  fbpStock?: number | null
  stockCoverDays?: number | null
  dimensionMatched?: boolean
  dimensionSource?: string | null
  dimensionQualityCodes?: string[]
  dataQualityCodes?: string[]
  latestNetUnits?: number
  latestGrossUnits?: number
  latestShippedUnits?: number
  latestCancelledUnits?: number
  latestRevenueShipped?: number
  latestYourVisitors?: number
  latestConversionVisitorsPercentage?: number | null
}

export type DailySalesFact = Partial<SalesAnalyticsSummary> & {
  factDate: string
  sourceSystem: string
  partnerSku: string
  sku: string
  productTitle?: string
}

export type SalesPriceTrendBucket = {
  bucketStart: string
  bucketLabel: string
  avgOfferPrice?: number | null
  minOfferPrice?: number | null
  maxOfferPrice?: number | null
  orderLineCount: number
  currencyCode?: string | null
}

export type SalesPriceTrendState = {
  state: 'ready' | 'no_order_price_facts' | 'mixed_currency' | 'invalid_order_price_facts'
  label: string
  message: string
}

export type SalesHistoryBackfillStatus = {
  state:
    | 'covered'
    | 'needs_backfill'
    | 'backfill_pending'
    | 'backfill_queued'
    | 'backfill_running'
    | 'backfill_failed'
    | 'retention_limited'
    | 'manual_action'
  label: string
  message: string
  actionAvailable: boolean
  gapIds?: number[]
  taskIds?: number[]
  categories?: string[]
}

export type SalesHistoryCoverage = {
  requestedDateFrom: string
  requestedDateTo: string
  salesFactDateFrom?: string | null
  salesFactDateTo?: string | null
  priceDateFrom?: string | null
  priceDateTo?: string | null
  salesFactsFullyCovered: boolean
  priceFactsFullyCovered: boolean
  backfill: SalesHistoryBackfillStatus
}

export type SalesHistoryBackfillResult = {
  plannedTaskCount: number
  plannedTaskIds: number[]
  gapIds: number[]
  categories: string[]
  message: string
}

export type SalesProductDetail = {
  partnerSku: string
  sku: string
  productTitle?: string
  latestFactDate?: string
  sourceSystems?: string[]
  imageUrl?: string | null
  currentStock?: number | null
  fbnStock?: number | null
  supermallStock?: number | null
  fbpStock?: number | null
  stockCoverDays?: number | null
  summary: SalesAnalyticsSummary
  facts: DailySalesFact[]
  priceTrend?: SalesPriceTrendBucket[]
  priceTrendState?: SalesPriceTrendState | null
  historyCoverage?: SalesHistoryCoverage | null
}

export type SalesAnalyticsQuery = {
  storeCode: string
  siteCode: string
  dateFrom: string
  dateTo: string
  search?: string
  brand?: string
  productFulltype?: string
  dataQualityCode?: string
  lifecycleCode?: string
  partnerSkuList?: string[]
}

export type SalesActivityWindow = {
  id: number
  name: string
  activityType: string
  categoryScope?: string
  dateFrom: string
  dateTo: string
  factor: number
  enabled: boolean
  versionNo: number
}

export type SalesActivityWindowSnapshot = {
  windows: SalesActivityWindow[]
}

export type SalesActivityWindowInput = {
  id?: number
  storeCode: string
  siteCode: string
  name: string
  activityType: string
  categoryScope?: string
  dateFrom: string
  dateTo: string
  factor: number
  enabled: boolean
}
