export type ProductLifecycleAnalysisQuery = {
  storeCode: string
  siteCode: string
}

export type ProductLifecycleAnalysisSummary = {
  storeCode: string
  siteCode: string
  totalProductCount: number
  readyProductCount: number
  missingParameterProductCount: number
  expectedLifecycleChangeProductCount?: number
  forecastWindowDays?: number
}

export type ProductLifecycleTimelinePoint = {
  date: string
  lifecycleCode?: string | null
  lifecycleLabel?: string | null
}

export type ProductLifecycleAnalysisRow = {
  partnerSku: string
  sku: string
  productTitle?: string | null
  imageUrl?: string | null
  brand?: string | null
  productFulltype?: string | null
  lifecycleCode?: string | null
  lifecycleLabel?: string | null
  analysisState?: string | null
  analysisStateLabel?: string | null
  analysisDate?: string | null
  listingDate?: string | null
  currentStageStartDate?: string | null
  listingDateSource?: string | null
  ruleVersion?: string | null
  currentStock?: number | null
  recent30DaySales?: number | null
  earliestFactDate?: string | null
  latestFactDate?: string | null
  projectionState?: string | null
  projectionMessage?: string | null
  projectionMissingRequirements?: string[]
  currentStageElapsedDays?: number | null
  currentStageRemainingDays?: number | null
  nextLifecycleCode?: string | null
  nextLifecycleLabel?: string | null
  nextTransitionDate?: string | null
  futureTimeline?: ProductLifecycleTimelinePoint[]
}

export type ProductLifecycleAnalysisOverview = {
  summary: ProductLifecycleAnalysisSummary
  rows: ProductLifecycleAnalysisRow[]
}

export type ProductLifecycleAnalysisRecalculation = {
  jobId?: number | null
  status: string
  message?: string | null
  storeCode: string
  siteCode: string
  anchorDate?: string | null
  processedCount: number
  changedCount: number
  heldCount: number
  dataInsufficientCount: number
}
