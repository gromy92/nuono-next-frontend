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
  notInTop20Count: number
  label: string
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
