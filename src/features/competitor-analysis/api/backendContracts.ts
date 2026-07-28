export type BackendListResponse = {
  items?: BackendWatchProductListItem[]
  pagination?: {
    page?: number
    pageSize?: number
    total?: number
    totalPages?: number
  }
}

export type BackendWatchProduct = {
  id?: number | string
  ownerUserId?: number | string
  storeCode?: string
  siteCode?: string
  productSiteOfferId?: number | string
  skuParent?: string
  partnerSku?: string
  childSku?: string
  pskuCode?: string
  selfNoonProductCode?: string
  selfCodeType?: string
  title?: string
  titleCn?: string
  titleZh?: string
  chineseTitle?: string
  brand?: string
  imageUrl?: string
  productFulltype?: string
  status?: string
  latestRunId?: number | string
  latestRunStatus?: string
  latestRunAt?: string
}

export type BackendWatchProductListItem = BackendWatchProduct & {
  activeKeywordCount?: number
  activeKeywords?: string[]
  activeKeywordStats?: BackendKeywordCount[]
  pendingCandidateCount?: number
  confirmedCompetitorCount?: number
  recent7dChangedCompetitorCount?: number
  recent7dCompetitorChangeCount?: number
}

export type BackendKeywordCount = {
  keyword?: string
  monitoredCount?: number
  previousRankStatus?: string
  previousRankNo?: number | string
  previousDate?: string
  rankStatus?: string
  rankNo?: number | string
  currentDate?: string
  rankDelta?: number | string
}

export type BackendProductOption = {
  productSiteOfferId?: number | string
  productMasterId?: number | string
  productVariantId?: number | string
  storeCode?: string
  siteCode?: string
  skuParent?: string
  partnerSku?: string
  childSku?: string
  noonProductCode?: string
  codeType?: string
  title?: string
  brand?: string
  imageUrl?: string
  productFulltype?: string
}

export type BackendKeyword = {
  id?: number | string
  watchProductId?: number | string
  keyword?: string
  keywordNorm?: string
  locale?: string
  status?: string
  displayOrder?: number
  lastProviderStatus?: string
  lastSucceededAt?: string
  lastErrorCode?: string
  lastErrorMessage?: string
}

export type BackendCandidate = {
  id?: number | string
  watchProductId?: number | string
  noonProductCode?: string
  codeType?: string
  canonicalUrl?: string
  titleSnapshot?: string
  brandSnapshot?: string
  imageUrlSnapshot?: string
  priceAmountSnapshot?: number
  currencyCodeSnapshot?: string
  ratingSnapshot?: number
  reviewCountSnapshot?: number
  ownedByCurrentStore?: boolean
  sourceType?: string
  reviewStatus?: string
  firstSeenAt?: string
  lastSeenAt?: string
}

export type BackendKeywordRelation = {
  id?: number | string
  keywordId?: number | string
  competitorProductId?: number | string
  relationStatus?: string
  firstSeenRunId?: number | string
  lastSeenRunId?: number | string
  firstSeenRankNo?: number
  lastSeenRankNo?: number
  lastSeenSponsored?: boolean
  lastSeenAt?: string
}

export type BackendRankPoint = {
  id?: number | string
  keywordId?: number | string
  keyword?: string
  trackedProductType?: string
  noonProductCode?: string
  rankStatus?: string
  rankNo?: number
  rankChannel?: string
  scanDepth?: number
  sponsored?: boolean
  isSponsored?: boolean
  priceAmount?: number
  currencyCode?: string
  factTime?: string
  factDate?: string
}

export type BackendDetailResponse = {
  watchProduct?: BackendWatchProduct
  keywords?: BackendKeyword[]
  candidates?: BackendCandidate[]
  keywordRelations?: BackendKeywordRelation[]
  latestRankPoints?: BackendRankPoint[]
}

export type BackendRankHistoryResponse = BackendRankPoint[] | { items?: BackendRankPoint[] }

export type BackendProductChangeField = {
  fieldKey?: string
  fieldLabel?: string
  changeType?: string
  oldValue?: unknown
  newValue?: unknown
  severity?: string
}

export type BackendProductChangeGroup = {
  id?: number | string
  factDate?: string
  noonProductCode?: string
  productName?: string
  subjectType?: string
  changes?: BackendProductChangeField[]
}

export type BackendProductChangeBaselineSummary = {
  monitoredCompetitorCount?: number
  snapshotCompetitorCount?: number
  firstSnapshotDate?: string
  latestSnapshotDate?: string
  latestCapturedAt?: string
}

export type BackendProductChangeResponse = BackendProductChangeGroup[] | {
  items?: BackendProductChangeGroup[]
  baselineSummary?: BackendProductChangeBaselineSummary
}

export type BackendDashboardSummaryItem = {
  issueType?: string
  label?: string
  value?: number
  changeType?: string
  productSiteOfferId?: number | string
  partnerSku?: string
  watchProductId?: number | string
  competitorOfferId?: number | string
  date?: string
}

export type BackendDashboardTrendItem = BackendDashboardSummaryItem & {
  date?: string
}

export type BackendDashboardProductItem = BackendDashboardSummaryItem & {
  partnerSku?: string
  title?: string
  targetValue?: number
}

export type BackendDashboardRankChangeItem = {
  watchProductId?: number | string
  productSiteOfferId?: number | string
  partnerSku?: string
  title?: string
  imageUrl?: string
  keywordId?: number | string
  keyword?: string
  trackedProductType?: string
  noonProductCode?: string
  previousRankStatus?: string
  previousRankNo?: number
  previousDate?: string
  rankStatus?: string
  rankNo?: number
  currentDate?: string
  rankDelta?: number
  priceChangeSummary?: string
  titleChangeSummary?: string
  adChangeSummary?: string
}

export type BackendDashboardAttributeChangeItem = {
  watchProductId?: number | string
  productSiteOfferId?: number | string
  partnerSku?: string
  title?: string
  productImageUrl?: string
  selfPreviousValue?: string
  selfCurrentValue?: string
  selfCurrentDate?: string
  selfSnapshotCount?: number
  selfLatestValue?: string
  selfLatestDate?: string
  noonProductCode?: string
  competitorTitle?: string
  competitorImageUrl?: string
  changeType?: string
  label?: string
  previousValue?: string
  currentValue?: string
  currentDate?: string
  latestRankKeyword?: string
  changeDateRankNo?: number
  latestRankNo?: number
  selfLatestRankKeyword?: string
  selfLatestRankStatus?: string
  selfLatestRankNo?: number
  selfLatestScanDepth?: number
}

export type BackendCompetitorDashboard = {
  storeCode?: string
  siteCode?: string
  days?: number
  competitorAttributeChangeDate?: string
  competitorAttributeSnapshotCount?: number
  issueSummary?: BackendDashboardSummaryItem[]
  issueTrend?: BackendDashboardTrendItem[]
  coverageTopProducts?: BackendDashboardProductItem[]
  rankIssueTopProducts?: BackendDashboardProductItem[]
  changeTypeDistribution?: BackendDashboardSummaryItem[]
  changedProductTop?: BackendDashboardProductItem[]
  selfRankChanges?: BackendDashboardRankChangeItem[]
  competitorRankChanges?: BackendDashboardRankChangeItem[]
  competitorAttributeChanges?: BackendDashboardAttributeChangeItem[]
}

