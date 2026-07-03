export type CompetitorReviewStatus = 'pending' | 'confirmed' | 'ignored'

export type CompetitorCandidateSource = 'search_discovery' | 'manual_add'

export type NoonProductCodeType = 'Z_CODE' | 'N_CODE'

export type RankStatus = 'ranked' | 'not_in_top_20' | 'not_in_scan_depth'

export type SearchRunStatus =
  | 'succeeded'
  | 'partial_failed'
  | 'failed'
  | 'running'
  | 'captcha_required'
  | 'parse_failed'
  | 'provider_unavailable'

export type CompetitorKeywordRankChange = {
  previousRankStatus?: RankStatus
  previousRankNo?: number
  previousDate?: string
  rankStatus?: RankStatus
  rankNo?: number
  currentDate?: string
  rankDelta?: number
}

export type CompetitorKeyword = {
  id: string
  keyword: string
  locale: string
  status: 'active' | 'paused'
  displayOrder: number
  lastRunStatus: SearchRunStatus
  lastSucceededAt?: string
  lastErrorCode?: string
  monitoredCount?: number
  selfRankChange?: CompetitorKeywordRankChange
}

export type CompetitorCandidate = {
  id: string
  noonProductCode: string
  codeType: NoonProductCodeType
  canonicalUrl: string
  title: string
  brand: string
  imageUrl: string
  priceAmount?: number
  currencyCode?: string
  rating?: number
  reviewCount?: number
  isSponsored?: boolean
  ownedByCurrentStore?: boolean
  latestRankNo?: number
  sourceType: CompetitorCandidateSource
  reviewStatus: CompetitorReviewStatus
  keywordReviewStatus?: Record<string, CompetitorReviewStatus>
  keywordLastSeenRunIds?: Record<string, string>
  keywordEvidence: string[]
  lastSeenAt: string
}

export type CompetitorRankPoint = {
  id: string
  keywordId: string
  noonProductCode: string
  factDate: string
  rankStatus: RankStatus
  rankNo?: number
  rankChannel?: 'organic' | 'sponsored'
  scanDepth?: number
  isSelf: boolean
  isConfirmedCompetitor: boolean
  isSponsored: boolean
  priceAmount?: number
  currencyCode?: string
}

export type CompetitorWatchProduct = {
  id: string
  productSiteOfferId: string
  skuParent: string
  title: string
  titleCn?: string
  brand: string
  imageUrl: string
  storeCode: string
  siteCode: string
  partnerSku: string
  childSku: string
  pskuCode: string
  productFulltype: string
  selfNoonProductCode: string
  status: 'active' | 'paused'
  latestRunAt: string
  latestRunStatus: SearchRunStatus
  latestRunId: string
  activeKeywordCount?: number
  pendingCandidateCount?: number
  confirmedCompetitorCount?: number
  recent7dChangedCompetitorCount?: number
  recent7dCompetitorChangeCount?: number
  keywords: CompetitorKeyword[]
  candidates: CompetitorCandidate[]
  rankPoints: CompetitorRankPoint[]
}

export type CompetitorProductOption = {
  productSiteOfferId: string
  productMasterId: string
  productVariantId: string
  storeCode: string
  siteCode: string
  skuParent: string
  partnerSku: string
  childSku: string
  noonProductCode: string
  codeType: NoonProductCodeType
  title: string
  brand: string
  imageUrl: string
  productFulltype: string
}

export type RankSummary = {
  bestRank?: number
  sponsoredCount: number
  notInScanDepthCount: number
  label: string
}

export type CompetitorDashboardIssueType =
  | 'PENDING_CANDIDATE'
  | 'MONITORING_SHORTAGE'
  | 'RANK_ANOMALY'
  | 'COMPETITOR_CHANGE'

export type CompetitorDashboardChangeType = 'PRICE' | 'RATING' | 'REVIEW_COUNT' | 'IMAGE' | 'TITLE' | 'BRAND'

export type CompetitorDashboardDrill = {
  issueType?: CompetitorDashboardIssueType
  productSiteOfferId?: string
  partnerSku?: string
  watchProductId?: string
  competitorOfferId?: string
  date?: string
  changeType?: CompetitorDashboardChangeType
}

export type CompetitorDashboardSummaryItem = CompetitorDashboardDrill & {
  label: string
  value: number
}

export type CompetitorDashboardTrendItem = CompetitorDashboardDrill & {
  date: string
  label: string
  value: number
}

export type CompetitorDashboardProductItem = CompetitorDashboardDrill & {
  label: string
  partnerSku: string
  title: string
  value: number
  targetValue?: number
}

export type CompetitorDashboardRankChangeItem = {
  watchProductId?: string
  productSiteOfferId?: string
  partnerSku: string
  title: string
  imageUrl?: string
  keywordId?: string
  keyword: string
  trackedProductType: 'self' | 'competitor'
  noonProductCode: string
  previousRankStatus: RankStatus
  previousRankNo?: number
  previousDate?: string
  rankStatus: RankStatus
  rankNo?: number
  currentDate?: string
  rankDelta: number
  priceChangeSummary?: string
  titleChangeSummary?: string
  adChangeSummary?: string
}

export type CompetitorDashboardAttributeChangeItem = {
  watchProductId?: string
  productSiteOfferId?: string
  partnerSku: string
  title: string
  productImageUrl?: string
  selfPreviousValue?: string
  selfCurrentValue?: string
  selfCurrentDate?: string
  selfSnapshotCount: number
  selfLatestValue?: string
  selfLatestDate?: string
  noonProductCode: string
  competitorTitle: string
  competitorImageUrl?: string
  changeType: CompetitorDashboardChangeType
  label: string
  previousValue: string
  currentValue: string
  currentDate?: string
  latestRankKeyword?: string
  changeDateRankNo?: number
  latestRankNo?: number
  selfLatestRankKeyword?: string
  selfLatestRankStatus?: RankStatus
  selfLatestRankNo?: number
  selfLatestScanDepth?: number
}

export type CompetitorDashboard = {
  storeCode: string
  siteCode: string
  days: 1 | 7 | 14 | 30
  competitorAttributeChangeDate?: string
  competitorAttributeSnapshotCount: number
  issueSummary: CompetitorDashboardSummaryItem[]
  issueTrend: CompetitorDashboardTrendItem[]
  coverageTopProducts: CompetitorDashboardProductItem[]
  rankIssueTopProducts: CompetitorDashboardProductItem[]
  changeTypeDistribution: CompetitorDashboardSummaryItem[]
  changedProductTop: CompetitorDashboardProductItem[]
  selfRankChanges: CompetitorDashboardRankChangeItem[]
  competitorRankChanges: CompetitorDashboardRankChangeItem[]
  competitorAttributeChanges: CompetitorDashboardAttributeChangeItem[]
}

export type CompetitorProductChangeField = {
  fieldKey: string
  fieldLabel: string
  changeType: string
  oldValue?: unknown
  newValue?: unknown
  severity?: 'info' | 'warning' | 'critical'
}

export type CompetitorProductChangeGroup = {
  id: string
  factDate: string
  noonProductCode: string
  productName: string
  subjectType: 'self' | 'competitor'
  changes: CompetitorProductChangeField[]
}

export type CompetitorProductChangeBaselineSummary = {
  monitoredCompetitorCount: number
  snapshotCompetitorCount: number
  firstSnapshotDate?: string
  latestSnapshotDate?: string
  latestCapturedAt?: string
}

export type CompetitorProductChangesResult = {
  items: CompetitorProductChangeGroup[]
  baselineSummary?: CompetitorProductChangeBaselineSummary
}
