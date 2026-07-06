import { apiFetch, parseApiResponse } from '../../shared/api'
import { normalizeNoonImageUrl } from '../product-management/utils/common'
import type {
  CompetitorCandidate,
  CompetitorCandidateSource,
  CompetitorDashboard,
  CompetitorDashboardAttributeChangeItem,
  CompetitorDashboardChangeType,
  CompetitorDashboardIssueType,
  CompetitorDashboardProductItem,
  CompetitorDashboardRankChangeItem,
  CompetitorDashboardSummaryItem,
  CompetitorDashboardTrendItem,
  CompetitorKeyword,
  CompetitorProductChangeBaselineSummary,
  CompetitorProductChangeField,
  CompetitorProductChangeGroup,
  CompetitorProductChangesResult,
  CompetitorProductOption,
  CompetitorRankPoint,
  CompetitorReviewStatus,
  CompetitorWatchProduct,
  NoonProductCodeType,
  RankStatus,
  SearchRunStatus
} from './types'

const DEFAULT_RANK_SCAN_DEPTH = 100

type BackendListResponse = {
  items?: BackendWatchProductListItem[]
  pagination?: {
    page?: number
    pageSize?: number
    total?: number
    totalPages?: number
  }
}

type BackendWatchProduct = {
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

type BackendWatchProductListItem = BackendWatchProduct & {
  activeKeywordCount?: number
  activeKeywords?: string[]
  activeKeywordStats?: BackendKeywordCount[]
  pendingCandidateCount?: number
  confirmedCompetitorCount?: number
  recent7dChangedCompetitorCount?: number
  recent7dCompetitorChangeCount?: number
}

type BackendKeywordCount = {
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

type BackendProductOption = {
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

type BackendKeyword = {
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

type BackendCandidate = {
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

type BackendKeywordRelation = {
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

type BackendRankPoint = {
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

type BackendDetailResponse = {
  watchProduct?: BackendWatchProduct
  keywords?: BackendKeyword[]
  candidates?: BackendCandidate[]
  keywordRelations?: BackendKeywordRelation[]
  latestRankPoints?: BackendRankPoint[]
}

type BackendRankHistoryResponse = BackendRankPoint[] | { items?: BackendRankPoint[] }

type BackendProductChangeField = {
  fieldKey?: string
  fieldLabel?: string
  changeType?: string
  oldValue?: unknown
  newValue?: unknown
  severity?: string
}

type BackendProductChangeGroup = {
  id?: number | string
  factDate?: string
  noonProductCode?: string
  productName?: string
  subjectType?: string
  changes?: BackendProductChangeField[]
}

type BackendProductChangeBaselineSummary = {
  monitoredCompetitorCount?: number
  snapshotCompetitorCount?: number
  firstSnapshotDate?: string
  latestSnapshotDate?: string
  latestCapturedAt?: string
}

type BackendProductChangeResponse = BackendProductChangeGroup[] | {
  items?: BackendProductChangeGroup[]
  baselineSummary?: BackendProductChangeBaselineSummary
}

type BackendDashboardSummaryItem = {
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

type BackendDashboardTrendItem = BackendDashboardSummaryItem & {
  date?: string
}

type BackendDashboardProductItem = BackendDashboardSummaryItem & {
  partnerSku?: string
  title?: string
  targetValue?: number
}

type BackendDashboardRankChangeItem = {
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

type BackendDashboardAttributeChangeItem = {
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

type BackendCompetitorDashboard = {
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
  productSiteOfferId: string
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

const EMPTY_IMAGE =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=='

function imageUrlValue(value: unknown) {
  return normalizeNoonImageUrl(value) || EMPTY_IMAGE
}

function optionalImageUrlValue(value: unknown) {
  return normalizeNoonImageUrl(value) || undefined
}

export async function fetchCompetitorWatchProducts(query: CompetitorWatchProductQuery = {}, signal?: AbortSignal) {
  const params = new URLSearchParams()
  appendSearchParam(params, 'storeCode', query.storeCode)
  appendSearchParam(params, 'siteCode', query.siteCode)
  appendSearchParam(params, 'productSearch', query.productSearch)
  appendSearchParam(params, 'keywordSearch', query.keywordSearch)
  appendSearchParam(params, 'competitorSearch', query.competitorSearch)
  appendSearchParam(params, 'status', query.status?.toUpperCase())
  appendBooleanParam(params, 'confirmedCompetitorCountZero', query.confirmedCompetitorCountZero)
  appendBooleanParam(params, 'pendingCandidateCountZero', query.pendingCandidateCountZero)
  appendSearchParam(params, 'sortBy', query.sortBy)
  if (query.page) {
    params.set('page', String(query.page))
  }
  if (query.pageSize) {
    params.set('pageSize', String(query.pageSize))
  }
  const suffix = params.toString() ? `?${params.toString()}` : ''
  const response = await apiFetch(`/api/competitor-analysis/watch-products${suffix}`, { signal })
  const payload = await parseApiResponse<BackendListResponse>(response, '读取竞品监控列表失败')
  return {
    items: (payload.items || []).map(mapListItem),
    pagination: payload.pagination
  }
}

export async function fetchCompetitorProductBaselines(query: CompetitorWatchProductQuery = {}, signal?: AbortSignal) {
  const params = new URLSearchParams()
  appendSearchParam(params, 'storeCode', query.storeCode)
  appendSearchParam(params, 'siteCode', query.siteCode)
  appendSearchParam(params, 'productSearch', query.productSearch)
  appendSearchParam(params, 'keywordSearch', query.keywordSearch)
  appendSearchParam(params, 'competitorSearch', query.competitorSearch)
  appendSearchParam(params, 'status', query.status?.toUpperCase())
  appendBooleanParam(params, 'confirmedCompetitorCountZero', query.confirmedCompetitorCountZero)
  appendBooleanParam(params, 'pendingCandidateCountZero', query.pendingCandidateCountZero)
  appendSearchParam(params, 'sortBy', query.sortBy)
  if (query.page) {
    params.set('page', String(query.page))
  }
  if (query.pageSize) {
    params.set('pageSize', String(query.pageSize))
  }
  const response = await apiFetch(`/api/competitor-analysis/product-baselines?${params}`, { signal })
  const payload = await parseApiResponse<BackendListResponse>(response, '读取商品基线列表失败')
  return {
    items: (payload.items || []).map(mapListItem),
    pagination: payload.pagination
  }
}

export async function fetchCompetitorDashboard(query: CompetitorDashboardQuery, signal?: AbortSignal) {
  const params = new URLSearchParams({
    storeCode: query.storeCode,
    siteCode: query.siteCode,
    days: String(query.days || 7)
  })
  appendSearchParam(params, 'rankDirection', query.rankDirection)
  const response = await apiFetch(`/api/competitor-analysis/dashboard?${params}`, { signal })
  return mapDashboard(await parseApiResponse<BackendCompetitorDashboard>(response, '读取竞品看板失败'))
}

export async function fetchCompetitorWatchProductDetail(watchProductId: string, signal?: AbortSignal) {
  const response = await apiFetch(`/api/competitor-analysis/watch-products/${watchProductId}`, { signal })
  return mapDetail(await parseApiResponse<BackendDetailResponse>(response, '读取竞品监控详情失败'))
}

export async function fetchCompetitorProductOptions(query: CompetitorProductOptionQuery, signal?: AbortSignal) {
  const params = new URLSearchParams({
    storeCode: query.storeCode,
    siteCode: query.siteCode
  })
  appendSearchParam(params, 'keyword', query.keyword)
  if (query.limit) {
    params.set('limit', String(query.limit))
  }
  const response = await apiFetch(`/api/competitor-analysis/product-options?${params}`, { signal })
  const payload = await parseApiResponse<BackendProductOption[]>(response, '读取可监控商品失败')
  return payload.map(mapProductOption).filter((item): item is CompetitorProductOption => Boolean(item.productSiteOfferId))
}

export async function createCompetitorWatchProduct(input: CompetitorWatchProductCreateInput) {
  const response = await apiFetch('/api/competitor-analysis/watch-products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  })
  return mapDetail(await parseApiResponse<BackendDetailResponse>(response, '新增监控商品失败'))
}

export async function addCompetitorKeyword(watchProductId: string, keyword: string, locale?: string) {
  const response = await apiFetch(`/api/competitor-analysis/watch-products/${watchProductId}/keywords`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ keyword, locale })
  })
  return mapDetail(await parseApiResponse<BackendDetailResponse>(response, '新增关键词失败'))
}

export async function updateCompetitorKeyword(
  keywordId: string,
  input: { keyword?: string; locale?: string; status?: 'active' | 'paused'; displayOrder?: number }
) {
  const response = await apiFetch(`/api/competitor-analysis/keywords/${keywordId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...input,
      status: input.status?.toUpperCase()
    })
  })
  return mapDetail(await parseApiResponse<BackendDetailResponse>(response, '更新关键词失败'))
}

export async function deleteCompetitorKeyword(keywordId: string) {
  const response = await apiFetch(`/api/competitor-analysis/keywords/${keywordId}`, {
    method: 'DELETE'
  })
  return mapDetail(await parseApiResponse<BackendDetailResponse>(response, '删除关键词失败'))
}

export async function addManualCompetitor(watchProductId: string, input: string, keywordId: string) {
  const response = await apiFetch(`/api/competitor-analysis/watch-products/${watchProductId}/manual-competitors`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input, keywordId })
  })
  return mapDetail(await parseApiResponse<BackendDetailResponse>(response, '手工添加竞品失败'))
}

export async function confirmCompetitorCandidate(keywordId: string, competitorProductId: string) {
  const response = await apiFetch(
    `/api/competitor-analysis/keywords/${keywordId}/candidates/${competitorProductId}/confirm`,
    { method: 'POST' }
  )
  return mapDetail(await parseApiResponse<BackendDetailResponse>(response, '确认竞品失败'))
}

export async function ignoreCompetitorCandidate(keywordId: string, competitorProductId: string) {
  const response = await apiFetch(
    `/api/competitor-analysis/keywords/${keywordId}/candidates/${competitorProductId}/ignore`,
    { method: 'POST' }
  )
  return mapDetail(await parseApiResponse<BackendDetailResponse>(response, '忽略竞品失败'))
}

export async function removeCompetitorCandidate(keywordId: string, competitorProductId: string) {
  const response = await apiFetch(
    `/api/competitor-analysis/keywords/${keywordId}/candidates/${competitorProductId}/remove`,
    { method: 'POST' }
  )
  return mapDetail(await parseApiResponse<BackendDetailResponse>(response, '移除竞品失败'))
}

export async function requestCompetitorRefresh(watchProductId: string) {
  const response = await apiFetch(`/api/competitor-analysis/watch-products/${watchProductId}/refresh`, {
    method: 'POST'
  })
  return mapRefreshRun(await parseApiResponse<CompetitorRefreshRun>(response, '提交竞品刷新失败'))
}

export async function fetchCompetitorRefreshRun(runId: string) {
  const response = await apiFetch(`/api/competitor-analysis/refresh-runs/${runId}`)
  return mapRefreshRun(await parseApiResponse<CompetitorRefreshRun>(response, '读取竞品刷新状态失败'))
}

export async function fetchCompetitorTask(taskId: string) {
  const response = await apiFetch(`/api/competitor-analysis/tasks/${taskId}`)
  return mapTask(await parseApiResponse<CompetitorTask>(response, '读取竞品刷新任务失败'))
}

export async function requestCompetitorMonitoring(storeCode: string, siteCode: string) {
  const params = new URLSearchParams({ storeCode, siteCode })
  const response = await apiFetch(`/api/competitor-analysis/monitoring-runs/manual?${params}`, {
    method: 'POST'
  })
  return mapTask(await parseApiResponse<CompetitorTask>(response, '提交手动监控失败'))
}

export async function fetchCompetitorRankHistory(
  watchProductId: string,
  query: { keywordId: string; rangeDays: number },
  signal?: AbortSignal
) {
  const params = new URLSearchParams({
    keywordId: query.keywordId,
    rangeDays: String(query.rangeDays)
  })
  const response = await apiFetch(`/api/competitor-analysis/watch-products/${watchProductId}/rank-history?${params}`, {
    signal
  })
  const payload = await parseApiResponse<BackendRankHistoryResponse>(response, '读取排名历史失败')
  const rows = Array.isArray(payload) ? payload : payload.items || []
  return rows.map(mapRankPoint)
}

export async function fetchCompetitorProductChanges(
  watchProductId: string,
  limit = 100,
  signal?: AbortSignal
): Promise<CompetitorProductChangesResult> {
  const params = new URLSearchParams({ limit: String(limit) })
  const response = await apiFetch(`/api/competitor-analysis/watch-products/${watchProductId}/product-changes?${params}`, {
    signal
  })
  const payload = await parseApiResponse<BackendProductChangeResponse>(response, '读取商品详情变化失败')
  const rows = Array.isArray(payload) ? payload : payload.items || []
  return {
    items: rows.map(mapProductChangeGroup),
    baselineSummary: Array.isArray(payload) ? undefined : mapProductChangeBaselineSummary(payload.baselineSummary)
  }
}

export function mapDetail(payload: BackendDetailResponse): CompetitorWatchProduct {
  const watchProduct = payload.watchProduct || {}
  const keywords = (payload.keywords || []).map(mapKeyword)
  const relations = payload.keywordRelations || []
  const rankPoints = (payload.latestRankPoints || []).map(mapRankPoint)
  const candidates = (payload.candidates || []).map((candidate) =>
    mapCandidate(candidate, keywords, relations, rankPoints)
  )
  return {
    ...mapWatchProductBase(watchProduct),
    activeKeywordCount: keywords.filter((keyword) => keyword.status === 'active').length,
    pendingCandidateCount: candidates.filter((candidate) => candidate.reviewStatus === 'pending').length,
    confirmedCompetitorCount: candidates.filter((candidate) => candidate.reviewStatus === 'confirmed').length,
    keywords,
    candidates,
    rankPoints
  }
}

function mapListItem(row: BackendWatchProductListItem): CompetitorWatchProduct {
  const base = mapWatchProductBase(row)
  const keywords = mapListKeywords(base, row.activeKeywordStats, row.activeKeywords)
  const activeKeywordCount = numberValue(row.activeKeywordCount)
  return {
    ...base,
    activeKeywordCount: activeKeywordCount || keywords.length,
    pendingCandidateCount: numberValue(row.pendingCandidateCount),
    confirmedCompetitorCount: numberValue(row.confirmedCompetitorCount),
    recent7dChangedCompetitorCount: numberValue(row.recent7dChangedCompetitorCount),
    recent7dCompetitorChangeCount: numberValue(row.recent7dCompetitorChangeCount),
    keywords,
    candidates: [],
    rankPoints: []
  }
}

function mapListKeywords(
  product: Pick<CompetitorWatchProduct, 'id' | 'productSiteOfferId' | 'storeCode' | 'partnerSku' | 'siteCode'>,
  activeKeywordStats?: BackendKeywordCount[],
  activeKeywords?: string[]
): CompetitorKeyword[] {
  const stableProductIdentity = [product.storeCode, product.siteCode, product.partnerSku]
    .map((value) => stringValue(value).toUpperCase())
    .filter(Boolean)
    .join(':')
  const baseId = product.id || stableProductIdentity || product.productSiteOfferId || 'product'
  const keywordRows = activeKeywordStats?.length
    ? activeKeywordStats.map((item) => ({
        keyword: stringValue(item.keyword),
        monitoredCount: numberValue(item.monitoredCount),
        selfRankChange: mapKeywordSelfRankChange(item)
      }))
    : (activeKeywords || []).map((keyword) => ({
        keyword: stringValue(keyword),
        monitoredCount: undefined,
        selfRankChange: undefined
      }))
  return keywordRows
    .filter((item) => item.keyword)
    .map((item, index) => ({
      id: `${baseId}-keyword-${index}-${item.keyword}`,
      keyword: item.keyword,
      keywordNorm: normalizeKeywordNorm(item.keyword),
      locale: product.siteCode ? `en-${product.siteCode}` : '',
      status: 'active',
      displayOrder: index,
      lastRunStatus: 'failed',
      monitoredCount: item.monitoredCount,
      selfRankChange: item.selfRankChange
    }))
}

function mapKeywordSelfRankChange(row: BackendKeywordCount): CompetitorKeyword['selfRankChange'] | undefined {
  const previousRankStatus = stringValue(row.previousRankStatus)
  const rankStatus = stringValue(row.rankStatus)
  const previousRankNo = optionalNumberValue(row.previousRankNo)
  const rankNo = optionalNumberValue(row.rankNo)
  const rankDelta = optionalNumberValue(row.rankDelta)
  const previousDate = formatFactDate(row.previousDate)
  const currentDate = formatFactDate(row.currentDate)

  if (!previousRankStatus && !rankStatus && previousRankNo === undefined && rankNo === undefined) {
    return undefined
  }

  return {
    previousRankStatus: previousRankStatus ? normalizeRankStatus(previousRankStatus) : undefined,
    previousRankNo,
    previousDate: previousDate || undefined,
    rankStatus: rankStatus ? normalizeRankStatus(rankStatus) : undefined,
    rankNo,
    currentDate: currentDate || undefined,
    rankDelta
  }
}

function mapProductOption(row: BackendProductOption): CompetitorProductOption {
  const noonProductCode = stringValue(row.noonProductCode)
  return {
    productSiteOfferId: idValue(row.productSiteOfferId),
    productMasterId: idValue(row.productMasterId),
    productVariantId: idValue(row.productVariantId),
    storeCode: stringValue(row.storeCode),
    siteCode: stringValue(row.siteCode),
    skuParent: stringValue(row.skuParent),
    partnerSku: stringValue(row.partnerSku),
    childSku: stringValue(row.childSku),
    noonProductCode,
    codeType: normalizeCodeType(row.codeType, noonProductCode),
    title: stringValue(row.title) || '未命名商品',
    brand: stringValue(row.brand),
    imageUrl: imageUrlValue(row.imageUrl),
    productFulltype: stringValue(row.productFulltype)
  }
}

function mapWatchProductBase(row: BackendWatchProduct) {
  const selfNoonProductCode = stringValue(row.selfNoonProductCode)
  return {
    id: idValue(row.id),
    productSiteOfferId: idValue(row.productSiteOfferId),
    skuParent: stringValue(row.skuParent),
    title: stringValue(row.title) || '未命名商品',
    titleCn: firstText(row.titleCn, row.titleZh, row.chineseTitle) || undefined,
    brand: stringValue(row.brand),
    imageUrl: imageUrlValue(row.imageUrl),
    storeCode: stringValue(row.storeCode),
    siteCode: stringValue(row.siteCode),
    partnerSku: stringValue(row.partnerSku),
    childSku: stringValue(row.childSku),
    pskuCode: stringValue(row.pskuCode),
    productFulltype: stringValue(row.productFulltype),
    selfNoonProductCode,
    status: normalizeActiveStatus(row.status),
    latestRunId: idValue(row.latestRunId),
    latestRunAt: formatDateTime(row.latestRunAt),
    latestRunStatus: normalizeRunStatus(row.latestRunStatus)
  } satisfies Omit<
    CompetitorWatchProduct,
    | 'activeKeywordCount'
    | 'pendingCandidateCount'
    | 'confirmedCompetitorCount'
    | 'keywords'
    | 'candidates'
    | 'rankPoints'
  >
}

function mapKeyword(row: BackendKeyword): CompetitorKeyword {
  return {
    id: idValue(row.id),
    keyword: stringValue(row.keyword),
    keywordNorm: stringValue(row.keywordNorm) || normalizeKeywordNorm(row.keyword),
    locale: stringValue(row.locale),
    status: normalizeActiveStatus(row.status),
    displayOrder: numberValue(row.displayOrder),
    lastRunStatus: normalizeRunStatus(row.lastProviderStatus),
    lastSucceededAt: formatDateTime(row.lastSucceededAt),
    lastErrorCode: stringValue(row.lastErrorCode) || undefined
  }
}

function mapCandidate(
  row: BackendCandidate,
  keywords: CompetitorKeyword[],
  relations: BackendKeywordRelation[],
  rankPoints: CompetitorRankPoint[]
): CompetitorCandidate {
  const candidateId = idValue(row.id)
  const candidateRelations = relations.filter((relation) => idValue(relation.competitorProductId) === candidateId)
  const keywordById = new Map(keywords.map((keyword) => [keyword.id, keyword]))
  const keywordReviewStatus = Object.fromEntries(
    candidateRelations.map((relation) => [idValue(relation.keywordId), normalizeRelationStatus(relation.relationStatus)])
  )
  const keywordLastSeenRunIds = Object.fromEntries(
    candidateRelations
      .map((relation) => [idValue(relation.keywordId), idValue(relation.lastSeenRunId)] as const)
      .filter((entry) => entry[0] && entry[1])
  )
  const keywordEvidence = candidateRelations
    .filter((relation) => normalizeRelationStatus(relation.relationStatus) !== 'ignored')
    .map((relation) => keywordById.get(idValue(relation.keywordId))?.keyword)
    .filter((keyword): keyword is string => Boolean(keyword))
  const noonProductCode = stringValue(row.noonProductCode)
  const latestRankPoint = rankPoints.find(
    (point) => point.noonProductCode === noonProductCode && point.isConfirmedCompetitor
  )
  const latestRelation = candidateRelations
    .slice()
    .sort((left, right) => formatDateTime(right.lastSeenAt).localeCompare(formatDateTime(left.lastSeenAt)))[0]
  return {
    id: candidateId,
    noonProductCode,
    codeType: normalizeCodeType(row.codeType, noonProductCode),
    canonicalUrl: stringValue(row.canonicalUrl) || buildNoonProductUrl(noonProductCode),
    title: stringValue(row.titleSnapshot) || `竞品 ${noonProductCode}`,
    brand: stringValue(row.brandSnapshot) || '待补充',
    imageUrl: imageUrlValue(row.imageUrlSnapshot),
    priceAmount: row.priceAmountSnapshot,
    currencyCode: stringValue(row.currencyCodeSnapshot) || undefined,
    rating: row.ratingSnapshot,
    reviewCount: row.reviewCountSnapshot,
    isSponsored: latestRankPoint?.isSponsored ?? Boolean(latestRelation?.lastSeenSponsored),
    ownedByCurrentStore: Boolean(row.ownedByCurrentStore),
    latestRankNo: latestRankPoint?.rankNo ?? latestRelation?.lastSeenRankNo,
    sourceType: normalizeSourceType(row.sourceType),
    reviewStatus: normalizeReviewStatus(row.reviewStatus),
    keywordReviewStatus,
    keywordLastSeenRunIds,
    keywordEvidence,
    lastSeenAt: formatDateTime(row.lastSeenAt || latestRelation?.lastSeenAt)
  }
}

function mapRankPoint(row: BackendRankPoint): CompetitorRankPoint {
  const keywordId = idValue(row.keywordId)
  const noonProductCode = stringValue(row.noonProductCode)
  const factTime = stringValue(row.factTime || row.factDate)
  const trackedType = stringValue(row.trackedProductType).toUpperCase()
  const rankChannel = normalizeRankChannel(row.rankChannel, row.sponsored ?? row.isSponsored)
  const rankStatus = normalizeRankStatus(row.rankStatus)
  return {
    id: idValue(row.id) || `${keywordId}-${noonProductCode}-${factTime}-${rankChannel}`,
    keywordId,
    noonProductCode,
    factDate: formatFactDate(factTime),
    rankStatus,
    rankNo: row.rankNo,
    rankChannel,
    scanDepth: normalizeRankScanDepth(row.scanDepth, rankStatus),
    isSelf: trackedType === 'SELF',
    isConfirmedCompetitor: trackedType === 'COMPETITOR',
    isSponsored: rankChannel === 'sponsored',
    priceAmount: row.priceAmount,
    currencyCode: stringValue(row.currencyCode) || undefined
  }
}

function mapProductChangeGroup(row: BackendProductChangeGroup): CompetitorProductChangeGroup {
  const factDate = stringValue(row.factDate)
  const noonProductCode = stringValue(row.noonProductCode)
  return {
    id: idValue(row.id) || `${factDate}-${noonProductCode}`,
    factDate,
    noonProductCode,
    productName: stringValue(row.productName) || noonProductCode || '未知商品',
    subjectType: String(row.subjectType || '').toUpperCase() === 'SELF' ? 'self' : 'competitor',
    changes: (row.changes || []).map(mapProductChangeField)
  }
}

function mapProductChangeBaselineSummary(
  row?: BackendProductChangeBaselineSummary
): CompetitorProductChangeBaselineSummary | undefined {
  if (!row) return undefined
  return {
    monitoredCompetitorCount: numberValue(row.monitoredCompetitorCount),
    snapshotCompetitorCount: numberValue(row.snapshotCompetitorCount),
    firstSnapshotDate: stringValue(row.firstSnapshotDate) || undefined,
    latestSnapshotDate: stringValue(row.latestSnapshotDate) || undefined,
    latestCapturedAt: stringValue(row.latestCapturedAt) || undefined
  }
}

function mapProductChangeField(row: BackendProductChangeField): CompetitorProductChangeField {
  return {
    fieldKey: stringValue(row.fieldKey),
    fieldLabel: stringValue(row.fieldLabel) || stringValue(row.fieldKey),
    changeType: stringValue(row.changeType),
    oldValue: row.oldValue,
    newValue: row.newValue,
    severity: normalizeChangeSeverity(row.severity)
  }
}

function normalizeChangeSeverity(value: unknown): CompetitorProductChangeField['severity'] {
  const normalized = String(value || 'INFO').toUpperCase()
  if (normalized === 'CRITICAL') {
    return 'critical'
  }
  if (normalized === 'WARNING') {
    return 'warning'
  }
  return 'info'
}

function mapRefreshRun(payload: CompetitorRefreshRun): CompetitorRefreshRun {
  return {
    ...payload,
    taskId: optionalId(payload.taskId),
    runId: optionalId(payload.runId),
    watchProductId: optionalId(payload.watchProductId)
  }
}

function mapTask(payload: CompetitorTask): CompetitorTask {
  return {
    ...payload,
    taskId: optionalId(payload.taskId)
  }
}

export function mapDashboard(payload: BackendCompetitorDashboard): CompetitorDashboard {
  return {
    storeCode: stringValue(payload.storeCode),
    siteCode: stringValue(payload.siteCode),
    days: normalizeDashboardDays(payload.days),
    competitorAttributeChangeDate: formatFactDate(payload.competitorAttributeChangeDate) || undefined,
    competitorAttributeSnapshotCount: numberValue(payload.competitorAttributeSnapshotCount),
    issueSummary: (payload.issueSummary || []).map(mapDashboardSummaryItem),
    issueTrend: (payload.issueTrend || []).map(mapDashboardTrendItem),
    coverageTopProducts: (payload.coverageTopProducts || []).map(mapDashboardProductItem),
    rankIssueTopProducts: (payload.rankIssueTopProducts || []).map(mapDashboardProductItem),
    changeTypeDistribution: (payload.changeTypeDistribution || []).map(mapDashboardSummaryItem),
    changedProductTop: (payload.changedProductTop || []).map(mapDashboardProductItem),
    selfRankChanges: (payload.selfRankChanges || []).map(mapDashboardRankChangeItem),
    competitorRankChanges: (payload.competitorRankChanges || []).map(mapDashboardRankChangeItem),
    competitorAttributeChanges: (payload.competitorAttributeChanges || []).map(mapDashboardAttributeChangeItem)
  }
}

function mapDashboardSummaryItem(row: BackendDashboardSummaryItem): CompetitorDashboardSummaryItem {
  return {
    ...mapDashboardDrill(row),
    label: stringValue(row.label) || dashboardIssueLabel(row.issueType),
    value: numberValue(row.value)
  }
}

function mapDashboardTrendItem(row: BackendDashboardTrendItem): CompetitorDashboardTrendItem {
  return {
    ...mapDashboardDrill(row),
    date: formatFactDate(row.date),
    label: stringValue(row.label) || dashboardIssueLabel(row.issueType),
    value: numberValue(row.value)
  }
}

function mapDashboardProductItem(row: BackendDashboardProductItem): CompetitorDashboardProductItem {
  const partnerSku = stringValue(row.partnerSku)
  const title = stringValue(row.title)
  return {
    ...mapDashboardDrill(row),
    label: partnerSku || title || optionalId(row.watchProductId) || '未命名商品',
    partnerSku,
    title,
    value: numberValue(row.value),
    targetValue: row.targetValue === undefined || row.targetValue === null ? undefined : numberValue(row.targetValue)
  }
}

function mapDashboardRankChangeItem(row: BackendDashboardRankChangeItem): CompetitorDashboardRankChangeItem {
  return {
    watchProductId: optionalId(row.watchProductId),
    productSiteOfferId: optionalId(row.productSiteOfferId),
    partnerSku: stringValue(row.partnerSku),
    title: stringValue(row.title),
    imageUrl: optionalImageUrlValue(row.imageUrl),
    keywordId: optionalId(row.keywordId),
    keyword: stringValue(row.keyword),
    trackedProductType: String(row.trackedProductType || '').toUpperCase() === 'COMPETITOR' ? 'competitor' : 'self',
    noonProductCode: stringValue(row.noonProductCode),
    previousRankStatus: normalizeRankStatus(row.previousRankStatus),
    previousRankNo: row.previousRankNo,
    previousDate: formatFactDate(row.previousDate) || undefined,
    rankStatus: normalizeRankStatus(row.rankStatus),
    rankNo: row.rankNo,
    currentDate: formatFactDate(row.currentDate) || undefined,
    rankDelta: numberValue(row.rankDelta),
    priceChangeSummary: stringValue(row.priceChangeSummary) || undefined,
    titleChangeSummary: stringValue(row.titleChangeSummary) || undefined,
    adChangeSummary: stringValue(row.adChangeSummary) || undefined
  }
}

function mapDashboardAttributeChangeItem(row: BackendDashboardAttributeChangeItem): CompetitorDashboardAttributeChangeItem {
  return {
    watchProductId: optionalId(row.watchProductId),
    productSiteOfferId: optionalId(row.productSiteOfferId),
    partnerSku: stringValue(row.partnerSku),
    title: stringValue(row.title),
    productImageUrl: optionalImageUrlValue(row.productImageUrl),
    selfPreviousValue: stringValue(row.selfPreviousValue) || undefined,
    selfCurrentValue: stringValue(row.selfCurrentValue) || undefined,
    selfCurrentDate: formatFactDate(row.selfCurrentDate) || undefined,
    selfSnapshotCount: numberValue(row.selfSnapshotCount),
    selfLatestValue: stringValue(row.selfLatestValue) || undefined,
    selfLatestDate: formatFactDate(row.selfLatestDate) || undefined,
    noonProductCode: stringValue(row.noonProductCode),
    competitorTitle: stringValue(row.competitorTitle),
    competitorImageUrl: optionalImageUrlValue(row.competitorImageUrl),
    changeType: normalizeDashboardChangeType(row.changeType) || 'PRICE',
    label: stringValue(row.label) || dashboardChangeLabel(row.changeType),
    previousValue: stringValue(row.previousValue),
    currentValue: stringValue(row.currentValue),
    currentDate: formatFactDate(row.currentDate) || undefined,
    latestRankKeyword: stringValue(row.latestRankKeyword) || undefined,
    changeDateRankNo: numberValue(row.changeDateRankNo),
    latestRankNo: row.latestRankNo,
    selfLatestRankKeyword: stringValue(row.selfLatestRankKeyword) || undefined,
    selfLatestRankStatus: normalizeRankStatus(row.selfLatestRankStatus),
    selfLatestRankNo: row.selfLatestRankNo,
    selfLatestScanDepth: numberValue(row.selfLatestScanDepth)
  }
}

function mapDashboardDrill(row: BackendDashboardSummaryItem) {
  return {
    issueType: normalizeDashboardIssueType(row.issueType),
    productSiteOfferId: optionalId(row.productSiteOfferId),
    partnerSku: stringValue(row.partnerSku),
    watchProductId: optionalId(row.watchProductId),
    competitorOfferId: optionalId(row.competitorOfferId),
    date: formatFactDate(row.date) || undefined,
    changeType: normalizeDashboardChangeType(row.changeType)
  }
}

function appendSearchParam(params: URLSearchParams, key: string, value?: string) {
  const normalized = value?.trim()
  if (normalized) {
    params.set(key, normalized)
  }
}

function appendBooleanParam(params: URLSearchParams, key: string, value?: boolean) {
  if (value) {
    params.set(key, 'true')
  }
}

function normalizeActiveStatus(value: unknown): 'active' | 'paused' {
  return String(value || 'ACTIVE').toUpperCase() === 'PAUSED' ? 'paused' : 'active'
}

function normalizeRunStatus(value: unknown): SearchRunStatus {
  const normalized = String(value || 'FAILED').toUpperCase()
  if (normalized === 'SUCCEEDED') {
    return 'succeeded'
  }
  if (normalized === 'PARTIAL_FAILED') {
    return 'partial_failed'
  }
  if (normalized === 'RUNNING' || normalized === 'QUEUED') {
    return 'running'
  }
  if (normalized === 'CAPTCHA_REQUIRED') {
    return 'captcha_required'
  }
  if (normalized === 'PARSE_FAILED') {
    return 'parse_failed'
  }
  if (normalized === 'PROVIDER_UNAVAILABLE') {
    return 'provider_unavailable'
  }
  return 'failed'
}

function normalizeRankStatus(value: unknown): RankStatus {
  const normalized = String(value || 'NOT_IN_SCAN_DEPTH').toUpperCase()
  if (normalized === 'RANKED') {
    return 'ranked'
  }
  if (normalized === 'NOT_IN_SCAN_DEPTH' || normalized === 'NOT_IN_TOP_20') {
    return 'not_in_scan_depth'
  }
  return 'not_in_scan_depth'
}

function normalizeRankScanDepth(value: unknown, rankStatus: RankStatus) {
  const numericValue = typeof value === 'number' ? value : Number(value)
  const normalized = Number.isFinite(numericValue) && numericValue > 0 ? numericValue : DEFAULT_RANK_SCAN_DEPTH
  return rankStatus === 'ranked' ? normalized : Math.max(DEFAULT_RANK_SCAN_DEPTH, normalized)
}

function normalizeRankChannel(value: unknown, sponsoredFallback?: unknown): 'organic' | 'sponsored' {
  const normalized = String(value || '').toUpperCase()
  if (normalized === 'SPONSORED') {
    return 'sponsored'
  }
  return sponsoredFallback ? 'sponsored' : 'organic'
}

function normalizeDashboardIssueType(value: unknown): CompetitorDashboardIssueType | undefined {
  const normalized = String(value || '').toUpperCase()
  if (
    normalized === 'PENDING_CANDIDATE' ||
    normalized === 'MONITORING_SHORTAGE' ||
    normalized === 'RANK_ANOMALY' ||
    normalized === 'COMPETITOR_CHANGE'
  ) {
    return normalized
  }
  return undefined
}

function normalizeDashboardChangeType(value: unknown): CompetitorDashboardChangeType | undefined {
  const normalized = String(value || '').toUpperCase()
  if (
    normalized === 'PRICE' ||
    normalized === 'RATING' ||
    normalized === 'REVIEW_COUNT' ||
    normalized === 'IMAGE' ||
    normalized === 'TITLE' ||
    normalized === 'BRAND'
  ) {
    return normalized
  }
  return undefined
}

function normalizeDashboardDays(value: unknown): 1 | 7 | 14 | 30 {
  const days = typeof value === 'number' && Number.isFinite(value) ? value : 7
  if (days === 1) {
    return 1
  }
  if (days <= 7) {
    return 7
  }
  if (days <= 14) {
    return 14
  }
  return 30
}

function dashboardIssueLabel(value: unknown) {
  const issueType = normalizeDashboardIssueType(value)
  if (issueType === 'PENDING_CANDIDATE') return '待确认候选'
  if (issueType === 'MONITORING_SHORTAGE') return '监控不足'
  if (issueType === 'RANK_ANOMALY') return '排名异常'
  if (issueType === 'COMPETITOR_CHANGE') return '竞品详情变化'
  return '待处理'
}

function dashboardChangeLabel(value: unknown) {
  const changeType = normalizeDashboardChangeType(value)
  if (changeType === 'PRICE') return '价格变化'
  if (changeType === 'RATING') return '评分变化'
  if (changeType === 'REVIEW_COUNT') return '评论数变化'
  if (changeType === 'IMAGE') return '图片变化'
  if (changeType === 'TITLE') return '标题变化'
  if (changeType === 'BRAND') return '品牌变化'
  return '竞品改动'
}

function normalizeReviewStatus(value: unknown): CompetitorReviewStatus {
  const normalized = String(value || 'PENDING').toUpperCase()
  if (normalized === 'CONFIRMED') {
    return 'confirmed'
  }
  if (normalized === 'IGNORED') {
    return 'ignored'
  }
  return 'pending'
}

function normalizeRelationStatus(value: unknown): CompetitorReviewStatus {
  const normalized = String(value || 'DISCOVERED').toUpperCase()
  if (normalized === 'CONFIRMED') {
    return 'confirmed'
  }
  if (normalized === 'IGNORED') {
    return 'ignored'
  }
  return 'pending'
}

function normalizeSourceType(value: unknown): CompetitorCandidateSource {
  return String(value || 'SEARCH_DISCOVERY').toUpperCase() === 'MANUAL_ADD' ? 'manual_add' : 'search_discovery'
}

function normalizeCodeType(value: unknown, noonProductCode: string): NoonProductCodeType {
  const normalized = String(value || '').toUpperCase()
  if (normalized === 'Z_CODE' || noonProductCode.startsWith('Z')) {
    return 'Z_CODE'
  }
  return 'N_CODE'
}

function stringValue(value: unknown) {
  return value === undefined || value === null ? '' : String(value).trim()
}

function normalizeKeywordNorm(value: unknown) {
  return stringValue(value).toLowerCase().replace(/\s+/g, ' ')
}

function firstText(...values: unknown[]) {
  return values.map(stringValue).find(Boolean) || ''
}

function idValue(value: unknown) {
  return stringValue(value)
}

function optionalId(value: unknown) {
  const id = idValue(value)
  return id || undefined
}

function numberValue(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function optionalNumberValue(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }
  return undefined
}

function formatDateTime(value: unknown) {
  const text = stringValue(value)
  if (!text) {
    return ''
  }
  return text.replace('T', ' ').slice(0, 16)
}

function formatFactDate(value: unknown) {
  const text = formatDateTime(value)
  return text ? text.slice(0, 10) : ''
}

function buildNoonProductUrl(noonProductCode: string) {
  return noonProductCode ? `https://www.noon.com/p/${noonProductCode}/p/` : 'https://www.noon.com/'
}
