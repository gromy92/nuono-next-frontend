import type {
  BackendCandidate,
  BackendDetailResponse,
  BackendKeyword,
  BackendKeywordCount,
  BackendKeywordRelation,
  BackendProductOption,
  BackendRankPoint,
  BackendWatchProduct,
  BackendWatchProductListItem
} from './backendContracts'
import type {
  CompetitorCandidate,
  CompetitorKeyword,
  CompetitorProductOption,
  CompetitorRankPoint,
  CompetitorWatchProduct
} from '../types'
import {
  buildNoonProductUrl,
  firstText,
  formatDateTime,
  formatFactDate,
  idValue,
  imageUrlValue,
  normalizeActiveStatus,
  normalizeCodeType,
  normalizeKeywordNorm,
  normalizeRankChannel,
  normalizeRankScanDepth,
  normalizeRankStatus,
  normalizeRelationStatus,
  normalizeReviewStatus,
  normalizeRunStatus,
  normalizeSourceType,
  numberValue,
  optionalNumberValue,
  stringValue
} from './transportValues'
import { listFieldTags } from './listFieldTags'

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

export function mapListItem(row: BackendWatchProductListItem): CompetitorWatchProduct {
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

export function mapProductOption(row: BackendProductOption): CompetitorProductOption {
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
    title:
      stringValue(row.titleEnSnapshot || row.titleSnapshot) ||
      stringValue(row.titleArSnapshot) ||
      `竞品 ${noonProductCode}`,
    titleEn: stringValue(row.titleEnSnapshot || row.titleSnapshot) || undefined,
    titleAr: stringValue(row.titleArSnapshot) || undefined,
    tags: listFieldTags(row.tagsSnapshotJson),
    imageUrl: imageUrlValue(row.imageUrlSnapshot),
    priceAmount: row.priceAmountSnapshot,
    currencyCode: stringValue(row.currencyCodeSnapshot) || undefined,
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

export function mapRankPoint(row: BackendRankPoint): CompetitorRankPoint {
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
    scanDepth: normalizeRankScanDepth(row.scanDepth),
    isSelf: trackedType === 'SELF',
    isConfirmedCompetitor: trackedType === 'COMPETITOR',
    isSponsored: rankChannel === 'sponsored',
    priceAmount: row.priceAmount,
    currencyCode: stringValue(row.currencyCode) || undefined
  }
}
