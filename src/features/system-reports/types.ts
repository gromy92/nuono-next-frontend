export type StoreDataReportMetric = {
  key: string
  title: string
  value: number
  unit?: string
  state?: string
}

export type StoreDataReportRow = {
  ownerUserId: number
  logicalStoreId: number
  projectCode: string
  projectName?: string | null
  storeCode: string
  siteCode: string
  siteStatus?: string | null
  siteOfferCount: number
  crossStoreOfferCount: number
  missingDetailBaselineCount: number
  missingTitleEnCount: number
  missingDescriptionEnCount: number
  missingBrandCount: number
  missingProductFulltypeCount: number
  missingImageCount: number
  offersWithSalesFacts: number
  offersWithoutSalesFacts: number
  salesProductKeyCount: number
  salesKeysWithoutOfferCount: number
  salesFactRows: number
  latestFactDate?: string | null
  salesImportBatchCount: number
  latestSalesImportStatus?: string | null
  latestSalesImportedAt?: string | null
  lifecycleCurrentCount: number
  lifecycleMissingCount: number
  lifecycleDataInsufficientCount: number
  detailState: string
  salesState: string
  lifecycleState: string
  overallState: string
}

export type StoreDataReportOverview = {
  title: string
  generatedAt: string
  metrics: StoreDataReportMetric[]
  rows: StoreDataReportRow[]
}

export type NoonDataReportMetric = {
  key: string
  title: string
  value: number
  unit?: string | null
  state?: string | null
}

export type NoonDataDistributionItem = {
  key: string
  label: string
  value: number
}

export type NoonDataCompletenessRow = {
  id?: number | null
  ownerUserId?: number | null
  storeCode?: string | null
  siteCode?: string | null
  category?: string | null
  latestStatus?: string | null
  historyStatus?: string | null
  latestDataDate?: string | null
  historyCoveredFrom?: string | null
  historyCoveredTo?: string | null
  patrolEnabled?: boolean | null
  nextPatrolAt?: string | null
  activeGapCount?: number | null
}

export type NoonDataCompletenessFilters = {
  ownerUserId?: number | string | null
  storeCode?: string | null
  siteCode?: string | null
  category?: string | null
  latestStatus?: string | null
  historyStatus?: string | null
}

export type NoonDataCompletenessOverview = {
  title: string
  generatedAt: string
  metrics: NoonDataReportMetric[]
  categoryDistribution: NoonDataDistributionItem[]
  latestStatusDistribution: NoonDataDistributionItem[]
  historyStatusDistribution: NoonDataDistributionItem[]
  rows: NoonDataCompletenessRow[]
}

export type NoonDataGapRow = {
  id?: number | null
  completenessId?: number | null
  ownerUserId?: number | null
  storeCode?: string | null
  siteCode?: string | null
  category?: string | null
  windowType?: string | null
  dateFrom?: string | null
  dateTo?: string | null
  status?: string | null
  attempts?: number | null
  nextRetryAt?: string | null
  linkedPullTaskId?: number | null
  linkedSourceBatchId?: string | null
  rowOrItemCount?: number | null
  failureType?: string | null
  retryable?: boolean | null
  requiresManualAction?: boolean | null
  diagnosticSummary?: string | null
}

export type NoonDataGapPatrol = {
  title: string
  generatedAt: string
  metrics: NoonDataReportMetric[]
  statusDistribution: NoonDataDistributionItem[]
  failureDistribution?: NoonDataDistributionItem[]
  rows: NoonDataGapRow[]
}

export type NoonDataGapFilters = {
  ownerUserId?: number | string | null
  storeCode?: string | null
  siteCode?: string | null
  category?: string | null
  status?: string | null
  failureType?: string | null
  retryable?: boolean | null
}

export type NoonCallStoreCategoryCell = {
  category: string
  label: string
  completenessId?: number | null
  marker?: string | null
  latestStatus?: string | null
  historyStatus?: string | null
  latestDataDate?: string | null
  historyCoveredFrom?: string | null
  historyCoveredTo?: string | null
  activeGapCount?: number | null
  latestTaskId?: number | null
  latestTaskStatus?: string | null
  readinessState?: string | null
  failureType?: string | null
  processedItemCount?: number | null
  requestCount?: number | null
  lastSyncAt?: string | null
  syncable?: boolean | null
  requiresManualAction?: boolean | null
  diagnosticSummary?: string | null
}

export type NoonCallStoreDataRow = {
  ownerUserId: number
  storeName?: string | null
  storeCode: string
  siteCode: string
  overallMarker?: string | null
  lastSyncAt?: string | null
  categories: NoonCallStoreCategoryCell[]
}

export type NoonCallStoreDataView = {
  title: string
  generatedAt: string
  metrics: NoonDataReportMetric[]
  rows: NoonCallStoreDataRow[]
}

export type NoonCallStoreDataSyncResult = {
  gapId?: number | null
  status?: string | null
  plannedTaskCount: number
  plannedTaskIds?: number[]
  message?: string | null
}
