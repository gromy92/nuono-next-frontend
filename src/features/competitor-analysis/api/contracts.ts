export type CompetitorWatchProductQuery = {
  storeCode?: string
  siteCode?: string
  productSearch?: string
  keywordSearch?: string
  competitorSearch?: string
  status?: 'active' | 'paused'
  confirmedCompetitorCountZero?: boolean
  pendingCandidateCountZero?: boolean
  sortBy?:
    | 'candidateCountDesc'
    | 'candidateCountAsc'
    | 'monitoredCountDesc'
    | 'monitoredCountAsc'
    | 'recent7dChangeCountDesc'
    | 'recent7dChangeCountAsc'
  page?: number
  pageSize?: number
}

export type CompetitorProductOptionQuery = {
  storeCode: string
  siteCode: string
  keyword?: string
  limit?: number
}

export type CompetitorDashboardQuery = {
  storeCode: string
  siteCode: string
  days?: 1 | 7 | 14 | 30
  rankDirection?: 'UP' | 'DOWN'
}

export type CompetitorWatchProductCreateInput = {
  storeCode: string
  siteCode: string
  productSiteOfferId?: string
  partnerSku?: string
  selfNoonProductCode?: string
}

export type CompetitorRefreshRun = {
  taskId?: string
  runId?: string
  watchProductId?: string
  taskStatus?: string
  runStatus?: string
  progressPercent?: number
  message?: string
  errorCode?: string
  errorMessage?: string
  keywordTotal?: number
  keywordSuccess?: number
  keywordFailed?: number
}

export type CompetitorTask = {
  taskId?: string
  taskType?: string
  naturalKey?: string
  status?: string
  progressPercent?: number
  message?: string
  resultJson?: string
  errorCode?: string
  startedAt?: string
  finishedAt?: string
  updatedAt?: string
}
